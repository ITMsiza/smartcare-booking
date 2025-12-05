
"use client";

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';

export default async function DoctorProfile(
  { params }: { params: Promise<{ doctorId: string }> }
) {
  const { doctorId } = await params;
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctor = async () => {
      if (!doctorId) return;
      const doctorRef = doc(db, 'doctors', doctorId as string);
      const doctorSnap = await getDoc(doctorRef);

      if (doctorSnap.exists()) {
        setDoctor({ id: doctorSnap.id, ...doctorSnap.data() });
      } else {
        console.log("No such document!");
      }
      setLoading(false);
    };

    fetchDoctor();
  }, [doctorId]);

  if (loading) return <p>Loading...</p>;
  if (!doctor) return <p>Doctor not found.</p>;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Doctor Profile</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{doctor.name}</h2>
          <p className="text-gray-600 dark:text-gray-400">{doctor.specialty}</p>
          <div className="mt-4">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Average Rating</h3>
            <p className="text-lg text-yellow-500">{doctor.averageRating ? doctor.averageRating.toFixed(1) : 'Not yet rated'} / 5</p>
            <p className="text-sm text-gray-500 dark:text-gray-300">({doctor.ratingCount || 0} ratings)</p>
          </div>
        </div>
      </main>
    </div>
  );
}
