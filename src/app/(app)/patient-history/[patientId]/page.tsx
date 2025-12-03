
"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, Timestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';

interface Appointment {
  id: string;
  startTime: Timestamp;
  status: string;
  notes?: string;
  doctorName: string;
}

export default function PatientHistory({ params }: { params: { patientId: string } }) {
  const { patientId } = params;
  const [patientName, setPatientName] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!patientId) return;

    // Fetch patient's name
    const fetchPatientName = async () => {
      const patientRef = doc(db, 'user', patientId as string);
      const patientSnap = await getDoc(patientRef);
      if (patientSnap.exists()) {
        setPatientName(patientSnap.data().displayName || 'Unknown Patient');
      }
    };
    fetchPatientName();

    const appointmentsRef = collection(db, 'appointments');
    const q = query(appointmentsRef, where("patientId", "==", patientId));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const apps: Appointment[] = [];
      querySnapshot.forEach((doc) => {
        apps.push({ id: doc.id, ...doc.data() } as Appointment);
      });
      apps.sort((a, b) => b.startTime.toMillis() - a.startTime.toMillis());
      setAppointments(apps);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [patientId]);

  const handleEditNotes = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setNotes(appointment.notes || '');
  };

  const handleSaveNotes = async () => {
    if (!editingAppointment) return;

    const appointmentRef = doc(db, 'appointments', editingAppointment.id);
    await updateDoc(appointmentRef, { notes });

    setEditingAppointment(null);
    setNotes('');
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Patient History: {patientName}</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Appointment Records</h2>
          {loading ? (
            <p>Loading history...</p>
          ) : appointments.length === 0 ? (
            <p>No appointment history found for this patient.</p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {appointments.map(app => (
                <li key={app.id} className="py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">Doctor: {app.doctorName}</p>
                      <p className="text-md text-gray-600 dark:text-gray-400">
                        Date: {new Date(app.startTime.seconds * 1000).toLocaleString('en-US', { timeZone: 'Africa/Johannesburg', dateStyle: 'full' })}
                      </p>
                      <p className={`text-sm font-semibold rounded-full inline-block px-2 ${app.status === 'confirmed' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                        Status: {app.status}
                      </p>
                    </div>
                    {app.status === 'completed' && (
                      <button onClick={() => handleEditNotes(app)} className="px-4 py-2 text-sm font-semibold rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300">
                        Edit Notes
                      </button>
                    )}
                  </div>
                  {editingAppointment?.id === app.id ? (
                    <div className="mt-4">
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                      <div className="mt-2 flex justify-end">
                        <button onClick={() => setEditingAppointment(null)} className="mr-2 px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                        <button onClick={handleSaveNotes} className="px-4 py-2 bg-blue-600 text-white rounded-md">Save</button>
                      </div>
                    </div>
                  ) : (
                    app.notes && <p className="mt-2 text-gray-700 dark:text-gray-300"><strong>Notes:</strong> {app.notes}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
