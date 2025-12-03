import { Suspense } from 'react';
import UserDashboardClient from './UserDashboardClient';

export default function UserDashboardPage() {
  return (
    <Suspense fallback={<p>Loading dashboard...</p>}>
      <UserDashboardClient />
    </Suspense>
  );
}

