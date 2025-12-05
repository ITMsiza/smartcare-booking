import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebaseAdmin';

/**
 * @swagger
 * /api/admin/feedback/{id}:
 *   delete:
 *     summary: Deletes a feedback entry.
 *     tags: [Admin]
 *     description: Permanently deletes a specific feedback entry from the database.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Feedback deleted successfully.
 *       404:
 *         description: Feedback not found.
 *       500:
 *         description: Internal Server Error.
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Feedback ID is required.' }, { status: 400 });
    }

    const feedbackRef = db.collection('feedback').doc(id);
    const doc = await feedbackRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Feedback not found.' }, { status: 404 });
    }

    await feedbackRef.delete();

    return NextResponse.json({ message: 'Feedback deleted successfully.' }, { status: 200 });

  } catch (error) {
    console.error('Error deleting feedback:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
