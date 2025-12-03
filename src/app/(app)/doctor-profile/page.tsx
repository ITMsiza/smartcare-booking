'use client';

import { useState, useEffect, useCallback } from 'react';

// Define the structure of the doctor's profile data
interface DoctorProfile {
  name?: string;
  email?: string;
  phone?: string;
  specialization?: string;
  license?: string;
  profilePicture?: string;
  biography?: string;
  yearsOfExperience?: number;
  consultationFee?: number;
}

export default function DoctorProfilePage() {
  const [profile, setProfile] = useState<DoctorProfile>({});
  const [editableProfile, setEditableProfile] = useState<DoctorProfile>({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch profile data from the API
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/doctor-profile');
      if (!response.ok) {
        throw new Error('Failed to fetch profile data.');
      }
      const data: DoctorProfile = await response.json();
      setProfile(data);
      setEditableProfile(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Handle input changes in the form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setEditableProfile((prev) => ({ ...prev, [id]: value }));
  };

  // Handle form submission to update the profile
  const handleSave = async () => {
    setError('');
    try {
      const response = await fetch('/api/doctor-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editableProfile),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update profile.');
      }

      // Refresh profile data and exit editing mode
      await fetchProfile();
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><p>Loading profile...</p></div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen"><p className="text-red-500">Error: {error}</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start mb-8">
          <img
            src={profile.profilePicture || '/default-avatar.png'} // Fallback to a default image
            alt="Doctor's Profile Picture"
            className="w-32 h-32 rounded-full object-cover border-4 border-indigo-500 shadow-md mb-4 sm:mb-0 sm:mr-8"
          />
          <div className="text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100">Dr. {profile.name || 'N/A'}</h1>
            <p className="text-lg text-indigo-600 dark:text-indigo-400 font-semibold">{profile.specialization || 'Specialization not set'}</p>
            <p className="text-md text-gray-600 dark:text-gray-400">License: {profile.license || 'N/A'}</p>
          </div>
        </div>

        {isEditing ? (
          // Editing View
          <div className="space-y-6">
            <div>
              <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Profile Picture URL</label>
              <input type="text" id="profilePicture" value={editableProfile.profilePicture || ''} onChange={handleInputChange} className="mt-1 w-full input-style" />
            </div>
            <div>
              <label htmlFor="biography" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Biography</label>
              <textarea id="biography" value={editableProfile.biography || ''} onChange={handleInputChange} rows={4} className="mt-1 w-full input-style"></textarea>
            </div>
            <div>
              <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Years of Experience</label>
              <input type="number" id="yearsOfExperience" value={editableProfile.yearsOfExperience || ''} onChange={handleInputChange} className="mt-1 w-full input-style" />
            </div>
            <div>
              <label htmlFor="consultationFee" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Consultation Fee ($)</label>
              <input type="number" id="consultationFee" value={editableProfile.consultationFee || ''} onChange={handleInputChange} className="mt-1 w-full input-style" />
            </div>
            <div className="flex justify-end space-x-4">
              <button onClick={() => setIsEditing(false)} className="px-6 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors">Cancel</button>
              <button onClick={handleSave} className="px-6 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">Save</button>
            </div>
          </div>
        ) : (
          // Display View
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
            <div className="flex justify-end">
              <button onClick={() => setIsEditing(true)} className="px-6 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">Edit Profile</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// A common style for input fields to avoid repetition
const styles = `
  .input-style {
    display: block;
    width: 100%;
    padding: 0.75rem;
    border-radius: 0.375rem;
    border: 1px solid #D1D5DB;
    background-color: #F9FAFB;
  }
  .dark .input-style {
    background-color: #374151;
    border-color: #4B5563;
    color: #F3F4F6;
  }
`;

// Inject styles into the document head
if (typeof window !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}
