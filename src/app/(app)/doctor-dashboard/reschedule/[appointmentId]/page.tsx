"use client";

import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { useRouter } from 'next/navigation';

interface Appointment {
  id: string;
  patientName: string;
  startTime: Timestamp;
  endTime: Timestamp;
  status: string;
}

//export default function RescheduleAppointment({ params: { appointmentId } }: { params: { appointmentId: string } }) {
 export default async function RescheduleAppointment({ params }: { params: Promise<{ appointmentId: string }> }) {
  const { appointmentId } = await params;
  const router = useRouter();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointment = async () => {
      if (!appointmentId) return;
      const appointmentRef = doc(db, 'appointments', appointmentId as string);
      const appointmentSnap = await getDoc(appointmentRef);

      if (appointmentSnap.exists()) {
        setAppointment({ id: appointmentSnap.id, ...appointmentSnap.data() } as Appointment);
      } else {
        console.log("No such document!");
      }
      setLoading(false);
    };

    fetchAppointment();
  }, [appointmentId]);

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointment || !newDate || !newTime) return;

    try {
      const newStartTime = new Date(`${newDate}T${newTime}`);
      
      const appointmentRef = doc(db, 'appointments', appointment.id);
      await updateDoc(appointmentRef, {
        startTime: Timestamp.fromDate(newStartTime),
        // You might want to adjust endTime based on the appointment duration
      });

      router.push('/doctor-dashboard');
    } catch (error) {
      console.error("Error rescheduling appointment: ", error);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!appointment) return <p>Appointment not found.</p>;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">Reschedule Appointment</h1>
        <form onSubmit={handleReschedule}>
          <div className="mb-4">
            <label htmlFor="newDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Date</label>
            <input
              type="date"
              id="newDate"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-200"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="newTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Time</label>
            <input
              type="time"
              id="newTime"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-200"
              required
            />
          </div>
          <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Reschedule
          </button>
        </form>
      </div>
    </div>
  );
}