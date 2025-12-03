"use client";

import { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { useAuth } from '@/app/hooks/useAuth';

const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export default function SetAvailability() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<Record<string, { start: string; end: string; }>>({});
  const [overrides, setOverrides] = useState<string[]>([]);
  const [overrideDate, setOverrideDate] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ message: string, error: boolean } | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchAvailability = async () => {
      const docRef = doc(db, 'doctor_availability', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSchedule(data.schedule || {});
        setOverrides(data.overrides || []);
      }
    };

    fetchAvailability();
  }, [user]);

  const handleCheckboxChange = (day: string) => {
    setSchedule(prev => {
      const newSchedule = { ...prev };
      if (newSchedule[day]) {
        delete newSchedule[day];
      } else {
        newSchedule[day] = { start: '09:00', end: '17:00' };
      }
      return newSchedule;
    });
  };

  const handleTimeChange = (day: string, timeType: 'start' | 'end', value: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], [timeType]: value }
    }));
  };

  const handleAddOverride = () => {
    if (overrideDate && !overrides.includes(overrideDate)) {
      setOverrides([...overrides, overrideDate].sort());
      setOverrideDate('');
    }
  };

  const handleRemoveOverride = (dateToRemove: string) => {
    setOverrides(overrides.filter(date => date !== dateToRemove));
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    setStatus(null);
    try {
      const docRef = doc(db, 'doctor_availability', user.uid);
      await setDoc(docRef, { schedule, overrides });
      setStatus({ message: 'Availability saved successfully!', error: false });
    } catch (error) {
      console.error("Error saving availability:", error);
      setStatus({ message: 'Failed to save availability.', error: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mt-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Set Your Weekly Availability</h2>
      <div className="space-y-4">
        {daysOfWeek.map(day => (
          <div key={day} className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                id={day}
                checked={!!schedule[day]}
                onChange={() => handleCheckboxChange(day)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor={day} className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                {day}
              </label>
            </div>
            {schedule[day] && (
              <div className="flex items-center space-x-2">
                <input
                  type="time"
                  value={schedule[day].start}
                  onChange={(e) => handleTimeChange(day, 'start', e.target.value)}
                  className="w-32 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                />
                <span>-</span>
                <input
                  type="time"
                  value={schedule[day].end}
                  onChange={(e) => handleTimeChange(day, 'end', e.target.value)}
                  className="w-32 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Date Overrides</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Block out specific dates when you are unavailable, like holidays or vacations.
        </p>
        <div className="flex items-center space-x-2">
          <input
            type="date"
            value={overrideDate}
            onChange={(e) => setOverrideDate(e.target.value)}
            className="w-full md:w-60 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
            min={new Date().toISOString().split('T')[0]}
          />
          <button onClick={handleAddOverride} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
            Add Override
          </button>
        </div>
        {overrides.length > 0 && (
          <div className="mt-4">
            <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200">Unavailable Dates:</h4>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {overrides.map(date => (
                <li key={date} className="text-gray-700 dark:text-gray-300 flex justify-between items-center">
                  <span>{new Date(date + 'T00:00:00').toLocaleDateString('en-US', { timeZone: 'Africa/Johannesburg' })}</span>
                  <button onClick={() => handleRemoveOverride(date)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save Availability'}
      </button>
      {status && (
        <div className={`mt-4 text-center p-2 rounded-md ${status.error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {status.message}
        </div>
      )}
    </div>
  );
}