import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebaseAdmin';

export async function POST(request: Request) {
  // Set a default error message
  let errorMessage = 'Failed to submit rating due to a server error.';
  try {
    const { appointmentId, rating, review, doctorId } = await request.json();

    // 1. Validate the incoming data
    if (!appointmentId || !rating || !doctorId) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }
    
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be a number between 1 and 5.' }, { status: 400 });
    }

    const appointmentRef = db.collection('appointments').doc(appointmentId as string);
    const doctorRef = db.collection('doctor').doc(doctorId as string);

    // 2. Use a transaction for atomic updates
    await db.runTransaction(async (transaction) => {
      const appointmentDoc = await transaction.get(appointmentRef);
      const doctorDoc = await transaction.get(doctorRef);

      // 3. Add validation inside the transaction
      if (!appointmentDoc.exists) {
        errorMessage = "Appointment not found. Cannot submit rating.";
        throw new Error(errorMessage);
      }
      
      if (!doctorDoc.exists) {
        errorMessage = "Doctor not found. Cannot submit rating.";
        throw new Error(errorMessage);
      }

      // 4. Prevent duplicate ratings
      const appointmentData = appointmentDoc.data() || {};
      if (appointmentData.rating) {
        errorMessage = "This appointment has already been rated.";
        throw new Error(errorMessage);
      }

      // 5. Update the appointment with the rating
      transaction.update(appointmentRef, { 
        rating: rating,
        review: review || '',
        reviewSubmitted: true,
      });

      // 6. Update the doctor's average rating
      const doctorData = doctorDoc.data() || {};
      const oldRatingTotal = doctorData.ratingTotal || 0;
      const oldRatingCount = doctorData.ratingCount || 0;

      const newRatingTotal = oldRatingTotal + rating;
      const newRatingCount = oldRatingCount + 1;
      const newAverageRating = newRatingTotal / newRatingCount;

      transaction.update(doctorRef, {
        ratingTotal: newRatingTotal,
        ratingCount: newRatingCount,
        averageRating: newAverageRating,

      });
    });

    return NextResponse.json({ message: 'Rating submitted successfully.' }, { status: 200 });

  } catch (error: any) {
    console.error('Error submitting rating:', error);
    // 7. Return a more specific error message
    return NextResponse.json({ error: error.message || errorMessage }, { status: 500 });
  }
}
