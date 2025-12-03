// app/api/send-otp/route.ts
/*import { NextResponse } from 'next/server';
import { db, adminAuth } from '@/app/lib/firebaseAdmin';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Test Firebase Admin connection immediately
    try {
      await adminAuth.getUserByEmail(email); // Just a dummy read to confirm credentials
    } catch (err) {
      console.error("Firebase Admin credentials invalid:", err);
      return NextResponse.json(
        { error: "Server misconfigured. Firebase credentials invalid." },
        { status: 500 }
      );
    }

    // Generate OTP (6-digit)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    //  Save OTP in Firestore
    await db.collection('otps').doc(email).set({
      otp,
      // expires: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 5*60*1000)) // optional
    });

    // Send OTP via email using SendGrid
    try {
      await sgMail.send({
        to: email,
        from: process.env.SENDGRID_SENDER_EMAIL as string, // Use the provided sender email
        subject: 'Your One-Time Password (OTP) for SmartAppointments',
        text: `Your OTP is: ${otp}`,
        html: `<strong>Your OTP is: ${otp}</strong>`,
      });
    } catch (sendError) {
      console.error("Failed to send OTP email:", sendError);
      return NextResponse.json({ error: "Failed to send OTP email" }, { status: 500 });
    }

    return NextResponse.json({ message: "OTP sent successfully" });
  } catch (error: any) {
    console.error("Unexpected error sending OTP:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send OTP" },
      { status: 500 }
    );
  }
}*/

import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebaseAdmin';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // Expires in 10 minutes

    // Store OTP in Firestore
    await db.collection('otps').doc(email).set({
      otp,
      expires,
    });

    // Send email using SendGrid
    const msg = {
      to: email,
      from: process.env.SENDGRID_SENDER_EMAIL as string, // Use the provided sender email
      subject: 'Your One-Time Password (OTP) for SmartAppointments',
      text: `Your OTP is: ${otp}`,
      html: `<strong>Your OTP is: ${otp}</strong>`,
    };

    await sgMail.send(msg);

    return NextResponse.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
