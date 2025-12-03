import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebaseAdmin';

/**
 * @swagger
 * /api/admin/feedback:
 *   get:
 *     summary: Fetches all feedback entries.
 *     tags: [Admin]
 *     description: Retrieves a list of all feedback submitted by users.
 *     responses:
 *       200:
 *         description: A list of feedback entries.
 *       500:
 *         description: Internal Server Error.
 */
export async function GET() {
  try {
    //const feedbackSnapshot = await db.collection('appointments').get();
    const feedbackSnapshot = await db.collection('appointments').where('reviewSubmitted', '==', true).get();
    const feedback = feedbackSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ feedback }, { status: 200 });

  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json({ error: 'An unexpected error occurred while fetching feedback.' }, { status: 500 });
  }
}
