
import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebaseAdmin';

export async function GET() {
  try {
    // Query the 'patient' collection for documents
    const patientsSnapshot = await db.collection('patient').get();

    if (patientsSnapshot.empty) {
      return NextResponse.json({ patients: [] }, { status: 200 });
    }

    const patients = patientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ patients }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching patients:', error);
    return NextResponse.json({ error: 'An unexpected error occurred while fetching patients.' }, { status: 500 });
  }
}
