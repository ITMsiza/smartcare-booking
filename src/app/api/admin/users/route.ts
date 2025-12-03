import { NextResponse } from 'next/server';
import { adminAuth  } from '@/app/lib/firebaseAdmin';
import type { UserRecord } from 'firebase-admin/auth';

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Fetches all non-admin users (patients).
 *     tags: [Admin]
 *     description: Retrieves a list of all users from Firebase Authentication, excluding admins.
 *     responses:
 *       200:
 *         description: A list of non-admin users.
 *       500:
 *         description: Internal Server Error.
 */
export async function GET() {
  try {
    const userRecords = await adminAuth .listUsers();

    // Filter out users with an 'admin' custom claim
    const nonAdminUsers = userRecords.users.filter((user: UserRecord) => !user.customClaims?.admin);

    const users = nonAdminUsers.map((user: UserRecord) => ({
      id: user.uid,
      displayName: user.displayName || 'N/A',
      email: user.email,
      disabled: user.disabled,
    }));

    return NextResponse.json({ users }, { status: 200 });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'An unexpected error occurred while fetching users.' }, { status: 500 });
  }
}
