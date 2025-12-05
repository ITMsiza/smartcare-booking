
import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebaseAdmin';

/**
 * @swagger
 * /api/admin/doctors/{id}:
 *   put:
 *     summary: Updates a doctor's profile.
 *     tags: [Admin]
 *     description: Allows an admin to update the details of a specific doctor.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Doctor updated successfully.
 *       400:
 *         description: Bad Request.
 *       404:
 *         description: Doctor not found.
 *       500:
 *         description: Internal Server Error.
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();

    if (!id || !data || Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Doctor ID and update data are required.' }, { status: 400 });
    }

    const doctorRef = db.collection('doctor').doc(id);
    const doc = await doctorRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Doctor not found.' }, { status: 404 });
    }

    await doctorRef.update(data);

    return NextResponse.json({ message: 'Doctor updated successfully.' }, { status: 200 });

  } catch (error: any) {
    console.error('Error updating doctor:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/admin/doctors/{id}:
 *   delete:
 *     summary: Deletes a doctor's profile.
 *     tags: [Admin]
 *     description: Allows an admin to delete a doctor from the system.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Doctor deleted successfully.
 *       404:
 *         description: Doctor not found.
 *       500:
 *         description: Internal Server Error.
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Doctor ID is required.' }, { status: 400 });
    }

    const doctorRef = db.collection('doctor').doc(id);
    const doc = await doctorRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Doctor not found.' }, { status: 404 });
    }

    await doctorRef.delete();

    return NextResponse.json({ message: 'Doctor deleted successfully.' }, { status: 200 });

  } catch (error: any) {
    console.error('Error deleting doctor:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
