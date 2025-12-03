import { adminAuth } from "@/app/lib/firebaseAdmin";
import { NextResponse } from "next/server";
import { db } from "@/app/lib/firebaseAdmin";

/**
 * Exchanges a Firebase ID token for a session cookie by searching across multiple user collections.
 */
export async function POST(request: Request) {
  const { idToken } = await request.json();

  if (!idToken) {
    return NextResponse.json(
      { error: "ID token is required." },
      { status: 400 }
    );
  }

  try {
    // 1. Verify the ID token to get the user's UID.
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // 2. Check 'patients', 'doctor', and 'admin' collections for the user's data.
    const collections = ["patient", "doctor", "admin"]; 
    let userDoc = null;

    for (const collection of collections) {
      const docRef = db.collection(collection).doc(uid);
      const doc = await docRef.get();
      if (doc.exists) {
        userDoc = doc;
        break;
      }
    }

    if (!userDoc) {
      return NextResponse.json({ error: "User data not found in Firestore." }, { status: 404 });
    }

    // 3. Get the user's role from the document.
    const userType = userDoc.data()?.userType;

    // 4. Create a session cookie.
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    // 5. Return the session cookie and user role in the response.
    const options = {
      name: "session",
      value: sessionCookie,
      maxAge: expiresIn,
      httpOnly: true,
      secure: true,
    };

    const response = NextResponse.json({ userType }, { status: 200 });
    response.cookies.set(options);
    return response;

  } catch (error: any) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { error: "Authentication failed.", details: error.message },
      { status: 401 }
    );
  }
}
