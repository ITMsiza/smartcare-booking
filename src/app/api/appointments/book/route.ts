
import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '@/app/lib/firebaseAdmin';

export async function POST(request: Request) {
  try {
    const { doctorId, patientId, startTime, doctorName, patientName } = await request.json();

    if (!doctorId || !patientId || !startTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const appointmentDate = new Date(startTime);
    const appointmentStartTime = Timestamp.fromDate(appointmentDate);
    const appointmentEndTime = Timestamp.fromMillis(appointmentStartTime.toMillis() + 30 * 60 * 1000);

    // Run the booking logic within a Firestore transaction
    const newAppointment = await db.runTransaction(async (transaction) => {
      const doctorAvailabilityRef = db.collection('doctor_availability').doc(doctorId);
      const doctorAvailabilityDoc = await transaction.get(doctorAvailabilityRef);

      if (!doctorAvailabilityDoc.exists) {
        throw new Error('Doctor availability not found.');
      }

      const availabilityData = doctorAvailabilityDoc.data();
      const schedule = availabilityData?.schedule;
      const overrides = availabilityData?.overrides || [];
      const timeZone = 'Africa/Johannesburg';

      const dateInDoctorsTimezone = new Date(appointmentDate.toLocaleString('en-US', { timeZone }));
      const localDateString = dateInDoctorsTimezone.toISOString().split('T')[0];

      if (overrides.includes(localDateString)) {
        throw new Error('The doctor is unavailable on this date.');
      }

      if (!schedule) {
        throw new Error('Doctor availability not configured.');
      }

      const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'long', timeZone }).toLowerCase();
      const daySchedule = schedule[dayOfWeek];

      if (!daySchedule || !daySchedule.start || !daySchedule.end) {
        throw new Error('The doctor is not available on this day.');
      }

      const year = appointmentDate.toLocaleString('en-US', { year: 'numeric', timeZone });
      const month = appointmentDate.toLocaleString('en-US', { month: '2-digit', timeZone });
      const day = appointmentDate.toLocaleString('en-US', { day: '2-digit', timeZone });
      const dateStringForSchedule = `${year}-${month}-${day}`;

      const scheduleStartISO = `${dateStringForSchedule}T${daySchedule.start}:00+02:00`;
      const scheduleEndISO = `${dateStringForSchedule}T${daySchedule.end}:00+02:00`;

      const scheduleStartDate = new Date(scheduleStartISO);
      const scheduleEndDate = new Date(scheduleEndISO);
      const appointmentEndDate = new Date(appointmentDate.getTime() + 30 * 60 * 1000);

      if (appointmentDate < scheduleStartDate || appointmentEndDate > scheduleEndDate) {
        throw new Error("The selected time is outside the doctor's working hours.");
      }

      const appointmentsRef = db.collection('appointments');
      const conflictQuery = appointmentsRef
        .where('doctorId', '==', doctorId)
        .where('startTime', '>=', appointmentStartTime)
        .where('startTime', '<', appointmentEndTime);

      const conflictSnapshot = await transaction.get(conflictQuery);

      if (!conflictSnapshot.empty) {
        throw new Error('This time slot is already booked.');
      }

      const newAppointmentData = {
        doctorId,
        patientId,
        startTime: appointmentStartTime,
        endTime: appointmentEndTime,
        status: 'confirmed',
        doctorName: doctorName || 'N/A',
        patientName: patientName || 'N/A',
        createdAt: Timestamp.now(),
      };

      const newAppointmentRef = appointmentsRef.doc();
      transaction.set(newAppointmentRef, newAppointmentData);

      return { id: newAppointmentRef.id, ...newAppointmentData };
    });

    return NextResponse.json({
      message: 'Appointment booked successfully.',
      appointment: newAppointment,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error booking appointment:', error);

    // Determine the status code based on the error message
    let statusCode = 500;
    if (error.message === 'This time slot is already booked.') {
      statusCode = 409; // Conflict
    } else if (error.message.includes('unavailable') || error.message.includes('working hours')) {
      statusCode = 400; // Bad Request
    }

    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: statusCode });
  }
}
