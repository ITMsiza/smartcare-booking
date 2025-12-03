import { NextResponse } from 'next/server';
import { db, adminAuth } from '@/app/lib/firebaseAdmin';

export async function POST(request: Request) {
  try {
    const {
      email,
      otp,
      password,
      name,
      phone,
      userType,
      specialization,
      license,
      hospital,
    } = await request.json();

    if (!email || !otp || !password) {
      return NextResponse.json(
        { error: 'Email, OTP, and password are required' },
        { status: 400 }
      );
    }

    // Verify OTP
    const otpDoc = await db.collection('otps').doc(email).get();

    if (!otpDoc.exists) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    const { otp: storedOtp, expires } = otpDoc.data()!;

    if (storedOtp !== otp) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    if (new Date() > expires.toDate()) {
      return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
    }

    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({ email, password });

    // Determine the correct collection based on userType
    let collectionName = userType;
    if (userType === 'user') {
      collectionName = 'patient'; 
    }

    // Store user data in the correct Firestore collection
    const userData: any = { name, phone, userType, email, uid: userRecord.uid };
    if (userType === 'doctor') {
      userData.isDoctor = true;
      userData.specialization = specialization;
      userData.license = license;
    } else if (userType === 'admin') {
      userData.hospital = hospital;
    }
    await db.collection(collectionName).doc(userRecord.uid).set(userData);

    // Generate custom token
    const customToken = await adminAuth.createCustomToken(userRecord.uid);

    // Delete OTP from Firestore
    await db.collection('otps').doc(email).delete();

    return NextResponse.json({ customToken });
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json({ error: 'An account with this email address already exists.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}
