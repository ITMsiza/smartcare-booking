
import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '@/app/lib/firebaseAdmin';

/**
 * API Endpoint to reschedule an existing appointment.
 *
 * This endpoint uses a Firestore transaction to ensure that the new time slot
 * is available before moving the appointment. This prevents race conditions
 * and double-bookings.
 *
 * @param {Request} request The incoming request object.
 * @returns {NextResponse} The response object.
 */
export async function POST(request: Request) {
  try {
    const { appointmentId, newStartTime, userId } = await request.json();

    if (!appointmentId || !newStartTime || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const appointmentDate = new Date(newStartTime);
    const appointmentStartTime = Timestamp.fromDate(appointmentDate);
    const appointmentEndTime = Timestamp.fromMillis(appointmentStartTime.toMillis() + 30 * 60 * 1000);

    const rescheduledAppointment = await db.runTransaction(async (transaction) => {
      const appointmentRef = db.collection('appointments').doc(appointmentId);
      const appointmentDoc = await transaction.get(appointmentRef);

      if (!appointmentDoc.exists) {
        throw new Error('Appointment not found.');
      }

      const appointmentData = appointmentDoc.data();
      const { doctorId, patientId } = appointmentData!;

      // Authorization: Ensure the user is either the doctor or the patient
      if (userId !== doctorId && userId !== patientId) {
        throw new Error('You are not authorized to reschedule this appointment.');
      }

      // --- All validation logic from the booking endpoint is re-used here ---
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
      // --- End of re-used validation logic ---

      // Check for conflicting appointments at the new time
      const appointmentsRef = db.collection('appointments');
      const conflictQuery = appointmentsRef
        .where('doctorId', '==', doctorId)
        .where('startTime', '>=', appointmentStartTime)
        .where('startTime', '<', appointmentEndTime);
      
      const conflictSnapshot = await transaction.get(conflictQuery);

      if (!conflictSnapshot.empty) {
        // If the conflict is the appointment we are trying to reschedule, it's not a true conflict
        let isSelfConflict = false;
        conflictSnapshot.forEach(doc => {
          if (doc.id === appointmentId) {
            isSelfConflict = true;
          }
        });
        if (!isSelfConflict) {
          throw new Error('This time slot is already booked.');
        }
      }

      // Update the appointment
      transaction.update(appointmentRef, {
        startTime: appointmentStartTime,
        endTime: appointmentEndTime,
        status: 'rescheduled',
        updatedAt: Timestamp.now(),
      });

      return {
        id: appointmentRef.id,
        ...appointmentData,
        startTime: appointmentStartTime,
        status: 'rescheduled',
      };
    });

    return NextResponse.json({
      message: 'Appointment rescheduled successfully.',
      appointment: rescheduledAppointment,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error rescheduling appointment:', error);
    let statusCode = 500;
    if (error.message === 'This time slot is already booked.') {
      statusCode = 409;
    } else if (error.message.includes('authorized')) {
      statusCode = 403;
    } else if (error.message.includes('unavailable') || error.message.includes('working hours') || error.message.includes('not found')) {
      statusCode = 400;
    }
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: statusCode });
  }
}
