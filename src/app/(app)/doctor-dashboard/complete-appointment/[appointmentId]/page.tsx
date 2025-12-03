'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { useAuth } from '@/app/hooks/useAuth';

interface Appointment {
  id: string;
  patientName: string;
  startTime: Timestamp;
  status: string;
  patientId: string;
  doctorId: string;
}

export default function CompleteAppointmentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { appointmentId } = params;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!appointmentId || !user) return;

    const fetchAppointment = async () => {
      setLoading(true);
      const appointmentRef = doc(db, 'appointments', appointmentId as string);
      const docSnap = await getDoc(appointmentRef);

      if (docSnap.exists()) {
        const appData = { id: docSnap.id, ...docSnap.data() } as Appointment;
        if (appData.doctorId === user.uid) {
          setAppointment(appData);
        } else {
          setError('You are not authorized to complete this appointment.');
        }
      } else {
        setError('Appointment not found.');
      }
      setLoading(false);
    };

    fetchAppointment();
  }, [appointmentId, user]);

  const handleCompleteAppointment = async () => {
    if (!appointment) return;

    const appointmentRef = doc(db, 'appointments', appointment.id);
    try {
      await updateDoc(appointmentRef, {
        status: 'completed',
        notes: notes,
      });
      router.push(`/patient-history/${appointment.patientId}`);
    } catch (err: any) {
      console.error("Error completing appointment: ", err);
      setError('Failed to complete appointment.');
    }
  };

  if (loading) {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <p className="text-gray-500 dark:text-gray-400">Loading Appointment...</p>
        </div>
    );
  }

  if (error) {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <p className="text-red-500">{error}</p>
        </div>
    );
  }

  if (!appointment) {
      return null; // Should not happen if error handling is correct
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <button onClick={() => router.back()} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            &larr; Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            Complete Appointment
          </h1>
        </div>
      </header>
      <main>
        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">Patient: {appointment.patientName}</p>
                    <p className="text-md text-gray-600 dark:text-gray-400">
                        Time: {new Date(appointment.startTime.seconds * 1000).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Africa/Johannesburg' })}
                    </p>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Clinical Notes
                        </label>
                        <textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="e.g., Prescribed medication, follow-up required in 2 weeks..."
                            className="w-full mt-1 p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                            rows={8}
                        />
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button onClick={() => router.back()} className="px-5 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500 font-semibold text-sm shadow-sm transition">
                            Cancel
                        </button>
                        <button onClick={handleCompleteAppointment} className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-semibold text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:ring-offset-gray-800 transition">
                            Mark as Completed
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}
