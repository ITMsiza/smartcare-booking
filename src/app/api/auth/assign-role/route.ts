
import { NextResponse } from "next/server";
import { adminAuth } from "@/app/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    // 1. Extract UID and role from the request body.
    const { uid, role } = await req.json();

    if (!uid || !role) {
      return NextResponse.json(
        { error: "UID and role are required." },
        { status: 400 }
      );
    }

    // 2. Set the custom claim. Use "userRole" instead of the reserved "role".
    await adminAuth.setCustomUserClaims(uid, { userRole: role });

    // 3. Return a success response.
    return NextResponse.json({ message: `Custom claim set for ${uid}` });
  } catch (error: any) {
    console.error("Error setting custom claim:", error);
    return NextResponse.json(
      { error: error.message || "Failed to set custom claim." },
      { status: 500 }
    );
  }
}
