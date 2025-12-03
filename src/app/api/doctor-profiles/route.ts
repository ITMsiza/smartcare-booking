
import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebaseAdmin';

/**
 * @swagger
 * /api/doctor-profiles:
 *   get:
 *     summary: Fetches a list of all doctor profiles.
 *     description: Retrieves a complete list of doctor profiles from the "doctor" collection in Firestore.
 *     responses:
 *       200:
 *         description: A list of doctor profiles.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       500:
 *         description: Internal Server Error. Failed to fetch doctors.
 */
export async function GET() {
  try {
    const doctorsSnapshot = await db.collection('doctor').get();
    const doctors = doctorsSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    return NextResponse.json(doctors);
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return NextResponse.json({ error: 'Failed to fetch doctors' }, { status: 500 });
  }
}
