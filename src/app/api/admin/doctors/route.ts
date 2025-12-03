import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebaseAdmin';

/**
 * @swagger
 * /api/admin/doctors:
 *   get:
 *     summary: Fetches all doctor profiles for the admin dashboard.
 *     tags: [Admin]
 *     description: Retrieves a comprehensive list of all doctors from the database.
 *     responses:
 *       200:
 *         description: A list of doctors.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 doctors:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Internal Server Error.
 */
export async function GET() {
  try {
    const doctorsSnapshot = await db.collection('doctor').get();
    
    if (doctorsSnapshot.empty) {
      return NextResponse.json({ doctors: [] }, { status: 200 });
    }

    const doctors = doctorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return NextResponse.json({ doctors }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching doctors:', error);
    return NextResponse.json({ error: 'An unexpected error occurred while fetching doctors.' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/admin/doctors:
 *   post:
 *     summary: Creates a new doctor profile.
 *     tags: [Admin]
 *     description: Allows an admin to add a new doctor to the system.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               specialty:
 *                 type: string
 *               yearsOfExperience:
 *                 type: number
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: Doctor created successfully.
 *       400:
 *         description: Bad Request. Missing required fields.
 *       500:
 *         description: Internal Server Error.
 */
export async function POST(request: Request) {
  try {
    const { name, specialty, yearsOfExperience, email } = await request.json();

    if (!name || !specialty || !yearsOfExperience || !email) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const newDoctor = {
      name,
      specialty,
      yearsOfExperience,
      email,
      // Initialize rating fields
      ratingTotal: 0,
      ratingCount: 0,
      averageRating: 0,
    };

    const docRef = await db.collection('doctor').add(newDoctor);

    return NextResponse.json({ id: docRef.id, ...newDoctor }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating doctor:', error);
    return NextResponse.json({ error: 'An unexpected error occurred while creating the doctor.' }, { status: 500 });
  }
}
