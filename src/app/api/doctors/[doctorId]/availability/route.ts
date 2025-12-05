import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebaseAdmin';

export async function GET(req: Request, { params }: { params: Promise<{ doctorId: string }> }) {
  try {
    const { doctorId } = await params;
    if (!doctorId) {
      return NextResponse.json({ error: 'Doctor ID is required' }, { status: 400 });
    }

    const docRef = db.collection('doctor_availability').doc(doctorId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Availability not found for this doctor' }, { status: 404 });
    }

    return NextResponse.json(docSnap.data());
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
  }
}
