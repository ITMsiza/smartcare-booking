import { NextResponse } from "next/server";
import { adminAuth, db } from "@/app/lib/firebaseAdmin";
import { cookies } from "next/headers";

// Helper function to get the UID from the session cookie
async function getUidFromSession() {
  const session = (await cookies()).get("session")?.value || "";
  if (!session) {
    return null;
  }
  try {
    const decodedClaims = await adminAuth.verifySessionCookie(session, true);
    return decodedClaims.uid;
  } catch (error) {
    console.error("Error verifying session cookie:", error);
    return null;
  }
}

/**
 * @swagger
 * /api/doctor-profile:
 *   get:
 *     summary: Fetches the profile of the currently logged-in doctor.
 *     description: Verifies the session cookie to identify the user and retrieves their profile data from the "doctor" collection in Firestore.
 *     responses:
 *       200:
 *         description: Doctor profile data retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 specialization:
 *                   type: string
 *                 license:
 *                   type: string
 *                 profilePicture:
 *                   type: string
 *                 biography:
 *                   type: string
 *                 yearsOfExperience:
 *                   type: number
 *                 consultationFee:
 *                   type: number
 *       401:
 *         description: Unauthorized. The user is not logged in or the session is invalid.
 *       404:
 *         description: Not Found. The doctor's profile could not be found in the database.
 *       500:
 *         description: Internal Server Error. Failed to fetch doctor data.
 */
export async function GET() {
  const uid = await getUidFromSession();
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const docRef = db.collection("doctor").doc(uid);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
    }

    return NextResponse.json(doc.data());
  } catch (error) {
    console.error("Error fetching doctor profile:", error);
    return NextResponse.json({ error: "Failed to fetch doctor profile" }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/doctor-profile:
 *   put:
 *     summary: Updates the profile of the currently logged-in doctor.
 *     description: Verifies the session cookie, retrieves the UID, and updates the corresponding doctor's document in Firestore with the provided data. This operation uses a merge to avoid overwriting existing fields.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profilePicture:
 *                 type: string
 *                 description: URL of the doctor's profile picture.
 *               biography:
 *                 type: string
 *                 description: A short professional summary.
 *               yearsOfExperience:
 *                 type: number
 *                 description: The doctor's years of professional experience.
 *               consultationFee:
 *                 type: number
 *                 description: The fee for a consultation.
 *     responses:
 *       200:
 *         description: Profile updated successfully.
 *       400:
 *         description: Bad Request. The request body is empty or invalid.
 *       401:
 *         description: Unauthorized. The user is not logged in or the session is invalid.
 *       500:
 *         description: Internal Server Error. Failed to update profile.
 */
export async function PUT(request: Request) {
  const uid = await getUidFromSession();
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();
  if (!data || Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Request body cannot be empty" }, { status: 400 });
  }

  try {
    const docRef = db.collection("doctor").doc(uid);
    await docRef.set(data, { merge: true });

    return NextResponse.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating doctor profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
