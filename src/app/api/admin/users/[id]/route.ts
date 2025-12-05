import { NextResponse } from 'next/server';
import { adminAuth } from '@/app/lib/firebaseAdmin';

/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     summary: Enables or disables a user account.
 *     tags: [Admin]
 *     description: Updates the status of a user to either enabled or disabled.
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
 *             properties:
 *               disabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User status updated successfully.
 *       400:
 *         description: Bad Request.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal Server Error.
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { disabled } = await request.json();

    if (!id || typeof disabled !== 'boolean') {
      return NextResponse.json({ error: 'User ID and disabled status are required.' }, { status: 400 });
    }

    await adminAuth.updateUser(id, { disabled });

    return NextResponse.json({ message: 'User status updated successfully.' }, { status: 200 });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Deletes a user account.
 *     tags: [Admin]
 *     description: Permanently deletes a user from Firebase Authentication.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal Server Error.
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await  params;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    await adminAuth.deleteUser(id);

    return NextResponse.json({ message: 'User deleted successfully.' }, { status: 200 });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
