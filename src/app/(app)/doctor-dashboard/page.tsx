
"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/hooks/useAuth';
import SetAvailability from '@/app/components/SetAvailability';
import { Card, CardContent, CardHeader, CardTitle, } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Header from '@/app/components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';

interface Appointment {
  id: string;
  patientName: string;
  patientId: string;
  appointmentDate: string;
  status: string;
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const doctorNavLinks = [
    { href: '/doctor-profile', label: 'Profile' },
  ];

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };


  useEffect(() => {
    if (user) {
      fetch(`/api/appointments?doctorId=${user.uid}`)
        .then((res) => res.json())
        .then((data) => {
          setAppointments(data);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [user]);

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar navLinks={doctorNavLinks} isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col">
      <Header toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center text-gray-500 dark:text-gray-400">Loading appointments...</div>
                ) : appointments.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400">You have no appointments.</p>
                ) : (
                  <ul className="space-y-4">
                    {appointments.map((appointment) => (
                      <li key={appointment.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold">{appointment.patientName}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{new Date(appointment.appointmentDate).toLocaleString()}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Status: {appointment.status}</p>
                          </div>
                          <div className="flex gap-2">
                            {appointment.status !== 'completed' && appointment.status !== 'rescheduled' && (
                              <Link href={`/doctor-dashboard/reschedule/${appointment.id}`} passHref>
                                <Button variant="outline">Reschedule</Button>
                              </Link>
                            )}
                            {appointment.status === 'confirmed' && (
                              <Link href={`/doctor-dashboard/complete-appointment/${appointment.id}`} passHref>
                                <Button>Complete</Button>
                              </Link>
                            )}
                            {appointment.status === 'completed' && (
                              <Link href={`/patient-history/${appointment.patientId}`} passHref>
                                <Button>View patient history</Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            <SetAvailability />
          </div>
        </main>
        <footer className="bg-white dark:bg-gray-800 shadow mt-auto">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 text-center text-gray-500 dark:text-gray-400">
            &copy; 2024 Your Company. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
}
