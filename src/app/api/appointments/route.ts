
import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebaseAdmin';
import type { Query } from 'firebase-admin/firestore';

/**
 * API Endpoint to fetch appointments.
 *
 * It can filter appointments by either `patientId` or `doctorId` based on the
 * query parameters provided in the request URL.
 *
 * @param {Request} request The incoming request object.
 * @returns {NextResponse} The response object containing the list of appointments.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const doctorId = searchParams.get('doctorId');

    let query: Query = db.collection('appointments');

    if (patientId) {
      query = query.where('patientId', '==', patientId);
    } else if (doctorId) {
      query = query.where('doctorId', '==', doctorId);
    } else {
      return NextResponse.json({ error: 'A patientId or doctorId must be provided.' }, { status: 400 });
    }

    const snapshot = await query.get();

    if (snapshot.empty) {
      return NextResponse.json([], { status: 200 });
    }

    const allAppointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Filter out appointments that do not have a valid startTime.
    // This is the definitive fix to prevent passing invalid data to the client.
    const validAppointments = allAppointments.filter((appt: any) => 
        appt.startTime && typeof appt.startTime.seconds === 'number'
    );

    // Sort the valid appointments by their start time.
    validAppointments.sort((a: any, b: any) => a.startTime.seconds - b.startTime.seconds);

    return NextResponse.json(validAppointments, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ error: 'An unexpected error occurred while fetching appointments.' }, { status: 500 });
  }
}
