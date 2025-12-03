/*'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Appointment {
  id: string;
  doctorName: string;
  doctorId: string;
  startTime: { seconds: number; nanoseconds: number; };
  status: string;
}

interface UserDashboardClientProps {
  appointments: Appointment[];
}

export default function UserDashboardClient({ appointments }: UserDashboardClientProps) {
  const router = useRouter();

  const safeCreateDate = (time: { seconds: number; nanoseconds: number; }) => {
    try {
        return new Date(time.seconds * 1000 + time.nanoseconds / 1000000);
    } catch (e) {
        return null;
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Your Appointments</h2>
        {appointments.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">You have no appointments scheduled.</p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {appointments.map((app) => (
              <li key={app.id} className="py-4 flex flex-wrap justify-between items-center">
                <div>
                  <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">Dr. {app.doctorName}</p>
                  <p className="text-md text-gray-600 dark:text-gray-400">
                     {safeCreateDate(app.startTime)?.toLocaleString([], { dateStyle: 'full', timeStyle: 'short' }) || 'Invalid Date'}
                  </p>
                  <p className={`mt-2 text-sm font-semibold rounded-full inline-block px-3 py-1 ${app.status === 'confirmed' ? 'bg-blue-100 text-blue-800' : app.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {app.status}
                  </p>
                </div>
                <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                  {app.status === 'completed' && (
                     <Link href={`/rate-appointment/${app.id}`} className="px-4 py-2 text-sm font-semibold rounded-md bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                        Rate
                     </Link>
                  )}
                   {app.status === 'confirmed' && (
                     <button className="px-4 py-2 text-sm font-semibold rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors">
                        Cancel
                     </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}*/
