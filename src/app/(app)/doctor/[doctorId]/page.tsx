'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';

// Define the structure of the doctor's public profile
interface DoctorPublicProfile {
  name?: string;
  specialization?: string;
  profilePicture?: string;
  biography?: string;
  yearsOfExperience?: number;
  consultationFee?: number;
}

export default function DoctorPublicProfilePage() {
  const [profile, setProfile] = useState<DoctorPublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const params = useParams();
  const doctorId = params.doctorId as string;

  // Fetch public profile data for the given doctorId
  const fetchPublicProfile = useCallback(async () => {
    if (!doctorId) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/doctor/${doctorId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch doctor profile.');
      }
      const data: DoctorPublicProfile = await response.json();
      setProfile(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchPublicProfile();
  }, [fetchPublicProfile]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><p>Loading doctor's profile...</p></div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen"><p className="text-red-500">Error: {error}</p></div>;
  }

  if (!profile) {
    return <div className="flex justify-center items-center h-screen"><p>Doctor not found.</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start mb-8">
          <img
            src={profile.profilePicture || '/default-avatar.png'}
            alt="Doctor's Profile Picture"
            className="w-32 h-32 rounded-full object-cover border-4 border-indigo-500 shadow-md mb-4 sm:mb-0 sm:mr-8"
          />
          <div className="text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100">Dr. {profile.name || 'N/A'}</h1>
            <p className="text-lg text-indigo-600 dark:text-indigo-400 font-semibold">{profile.specialization || 'Specialization not set'}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Biography</h3>
            <p className="text-gray-600 dark:text-gray-400">{profile.biography || 'Not provided.'}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">Years of Experience</h3>
              <p className="text-gray-600 dark:text-gray-400">{profile.yearsOfExperience || 'Not provided.'}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">Consultation Fee</h3>
              <p className="text-gray-600 dark:text-gray-400">{profile.consultationFee ? `$${profile.consultationFee}` : 'Not provided.'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
