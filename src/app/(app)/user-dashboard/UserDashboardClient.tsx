
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { db } from '@/app/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import Link from 'next/link';
import Header from '@/app/components/layout/Header';
import Sidebar from '@/app/components/layout/Sidebar';
import Footer from '@/app/components/layout/Footer';

// Helper to safely create a Date object from either a Firestore Timestamp or a date string.
const safeCreateDate = (time: any): Date | null => {
  if (time && typeof time === 'object' && time.seconds) {
    return new Date(time.seconds * 1000);
  }
  if (typeof time === 'string') {
    const d = new Date(time);
    if (!isNaN(d.getTime())) {
      return d;
    }
  }
  return null;
};

// Helper function to generate time slots
const generateTimeSlots = (availability: any, date: Date) => {
  if (!availability || !availability.schedule) return [];
  const timeZone = 'Africa/Johannesburg';
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long', timeZone }).toLowerCase();
  const year = date.toLocaleString('en-US', { year: 'numeric', timeZone });
  const month = date.toLocaleString('en-US', { month: '2-digit', timeZone });
  const day = date.toLocaleString('en-US', { day: '2-digit', timeZone });
  const dateString = `${year}-${month}-${day}`;

  if (availability.overrides?.includes(dateString)) {
    return [];
  }

  const daySchedule = availability.schedule[dayOfWeek];
  if (!daySchedule || !daySchedule.start || !daySchedule.end) return [];

  const slots = [];
  const startDateTime = new Date(`${dateString}T${daySchedule.start}:00+02:00`);
  const endDateTime = new Date(`${dateString}T${daySchedule.end}:00+02:00`);

  let currentTime = new Date(startDateTime);
  while (currentTime < endDateTime) {
    slots.push(new Date(currentTime));
    currentTime.setTime(currentTime.getTime() + 30 * 60 * 1000);
  }
  return slots;
};

export default function UserDashboardClient() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [availability, setAvailability] = useState(null);
  const [timeSlots, setTimeSlots] = useState<Date[]>([]);
  const [appointmentDate, setAppointmentDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [bookingStatus, setBookingStatus] = useState<{ message: string; error: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [reschedulingAppointment, setReschedulingAppointment] = useState<any>(null);

  const userNavLinks = [
    { href: '/doctor-profiles', label: 'View Doctor Profiles' },
  ];

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
         const response = await fetch('/api/doctor-profiles');
        if (!response.ok) throw new Error('Failed to fetch doctors');
        const data = await response.json();
        
        setDoctors(data);
      } catch (error) {
        console.error('Error fetching doctors:', error);
      }
    };
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, "appointments"), where("patientId", "==", user.uid));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const appts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Manually sort the appointments by their start time in ascending order.
        appts.sort((a: any, b: any) => {
            const timeA = a?.startTime?.seconds;
            const timeB = b?.startTime?.seconds;

            if (typeof timeA !== 'number' && typeof timeB !== 'number') {
                return 0; // If both are invalid, keep original order.
            } else if (typeof timeA !== 'number') {
                return 1; // If only `a` is invalid, sort it to the end.
            } else if (typeof timeB !== 'number') {
                return -1; // If only `b` is invalid, sort it to the end.
            }

            return timeA - timeB; // Sort by time.
        });
        setAppointments(appts);
        console.log(appts);
      });
      return () => unsubscribe();
    }
  }, [user]);


  useEffect(() => {
    if (!selectedDoctor) return;
    const fetchAvailability = async () => {
      try {
        const response = await fetch(`/api/doctors/${selectedDoctor}/availability`);
        if (!response.ok) throw new Error('Failed to fetch availability');
        const data = await response.json();
        setAvailability(data);
      } catch (error) {
        console.error('Error fetching availability:', error);
        setAvailability(null);
      }
    };
    fetchAvailability();
  }, [selectedDoctor]);

  useEffect(() => {
    if (availability) {
      const slots = generateTimeSlots(availability, appointmentDate);
      setTimeSlots(slots);
      setSelectedSlot(null);
    }
  }, [availability, appointmentDate]);
  

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedDoctor || !selectedSlot) {
      setBookingStatus({ message: 'Please select a doctor, date, and time slot.', error: true });
      return;
    }
    setLoading(true);
    setBookingStatus(null);
    try {
      const response = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: selectedDoctor,
          patientId: user.uid,
          startTime: selectedSlot.toISOString(),
          doctorName: doctors.find((d) => d.uid === selectedDoctor)?.name,
          patientName: user.displayName || 'Anonymous',
        }),
      });
      
      const data = await response.json();
      console.log("Userrrrrrrrrrrrrrrrrrrrrrrrrrrr ID",data.patientId);
      if (!response.ok) throw new Error(data.error || 'Failed to book appointment.');
      setBookingStatus({ message: 'Appointment booked successfully!', error: false });
    } catch (error: any) {
      setBookingStatus({ message: error.message, error: true });
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reschedulingAppointment || !selectedSlot) {
      setBookingStatus({ message: 'Please select a new time slot to reschedule.', error: true });
      return;
    }
    setLoading(true);
    setBookingStatus(null);
    try {
      const response = await fetch('/api/appointments/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: reschedulingAppointment.id,
          newStartTime: selectedSlot.toISOString(),
          userId: user.uid,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to reschedule appointment.');
      setBookingStatus({ message: 'Appointment rescheduled successfully!', error: false });
      setReschedulingAppointment(null);
    } catch (error: any) {
      setBookingStatus({ message: error.message, error: true });
    } finally {
      setLoading(false);
    }
  };

  const startRescheduling = (appointment: any) => {
    setReschedulingAppointment(appointment);
    setSelectedDoctor(appointment.doctorId);
    const date = safeCreateDate(appointment.startTime);
    if (date) {
      setAppointmentDate(date);
    }
    setBookingStatus(null);
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar navLinks={userNavLinks} />
      <div className="flex-1 flex flex-col ml-64">
        <Header />
        <main className="flex-1 p-6">
          {reschedulingAppointment ? (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Reschedule Appointment</h2>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Rescheduling for {reschedulingAppointment.doctorName} on {
                  safeCreateDate(reschedulingAppointment.startTime)?.toLocaleDateString([], { timeZone: 'Africa/Johannesburg' }) || 'Invalid Date'
                }
              </p>
              <form onSubmit={handleReschedule} className="space-y-4">
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select a New Date</label>
                    <input
                        id="date"
                        type="date"
                        value={appointmentDate.toISOString().split('T')[0]}
                        onChange={(e) => setAppointmentDate(new Date(e.target.value))}
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                        min={new Date().toISOString().split('T')[0]}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="time-slot" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select a New Time Slot</label>
                    <select
                        id="time-slot"
                        value={selectedSlot?.toISOString() || ''}
                        onChange={(e) => setSelectedSlot(e.target.value ? new Date(e.target.value) : null)}
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                        required
                        disabled={timeSlots.length === 0}
                    >
                        <option value="">{timeSlots.length > 0 ? '-- Choose a time --' : 'No available slots'}</option>
                        {timeSlots.map((slot, index) => (
                            <option key={index} value={slot.toISOString()}>
                                {slot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Johannesburg' })}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="submit"
                    disabled={loading || !selectedSlot}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {loading ? 'Rescheduling...' : 'Confirm Reschedule'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReschedulingAppointment(null)}
                    className="ml-4 w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Book an Appointment</h2>
              <form onSubmit={handleBooking} className="space-y-4">
                  <div>
                      <label htmlFor="doctor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select a Doctor</label>
                      <select
                          id="doctor"
                          value={selectedDoctor}
                          onChange={(e) => setSelectedDoctor(e.target.value)}
                          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          required
                      >
                          <option value="">-- Choose a Doctor --</option>
                          {doctors.map((doc) => (
                              <option key={doc.uid} value={doc.uid}>{doc.name}</option>
                          ))}
                      </select>
                  </div>

                  {selectedDoctor && availability && (
                      <>
                          <div>
                              <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select a Date</label>
                              <input
                                  id="date"
                                  type="date"
                                  value={appointmentDate.toISOString().split('T')[0]}
                                  onChange={(e) => setAppointmentDate(new Date(e.target.value))}
                                  className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                                  min={new Date().toISOString().split('T')[0]}
                                  required
                              />
                          </div>

                          <div>
                              <label htmlFor="time-slot" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select a Time Slot</label>                            <select
                                  id="time-slot"
                                  value={selectedSlot?.toISOString() || ''}
                                  onChange={(e) => setSelectedSlot(e.target.value ? new Date(e.target.value) : null)}
                                  className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                                  required
                                  disabled={timeSlots.length === 0}
                              >
                                  <option value="">{timeSlots.length > 0 ? '-- Choose a time --' : 'No available slots'}</option>
                                  {timeSlots.map((slot, index) => (
                                      <option key={index} value={slot.toISOString()}>
                                          {slot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Johannesburg' })}
                                      </option>
                                  ))}
                              </select>
                          </div>
                      </>
                  )}

                  <button
                      type="submit"
                      disabled={loading || !selectedSlot}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                      {loading ? 'Booking...' : 'Book Appointment'}
                  </button>
              </form>
            </div>
          )}

          {bookingStatus && (
              <div className={`my-4 text-center p-2 rounded-md ${bookingStatus.error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {bookingStatus.message}
              </div>
          )}

          <div className="px-4 py-6 sm:px-0">
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg h-auto p-6">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Your Appointments</h2>
                  {appointments.length > 0 ? (
                      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                                      {appointments.map((appt) => (
                                  <li key={appt.id} className="py-4 flex items-center justify-between">
                                      <div>
                                          <Link href={`/doctor-profile/${appt.doctorId}`}>
                                              <p className="text-lg font-medium text-indigo-600 dark:text-indigo-400 hover:underline">{appt.doctorName}</p>
                                          </Link>
                                          <p className="text-gray-600 dark:text-gray-400">
                                              {safeCreateDate(appt.startTime)?.toLocaleString([], { timeZone: 'Africa/Johannesburg', dateStyle: 'full', timeStyle: 'short' }) || 'Invalid Date'}
                                          </p>
                                          <p className="text-sm text-gray-500 dark:text-gray-300">Status: {appt.status}</p>
                                          {appt.rating && <p className="text-sm text-gray-500 dark:text-gray-300">Your Rating: {appt.rating}/5</p>}
                                      </div>
                                      {appt.status === 'completed' && !appt.rating && (
                                          <Link href={`/rate-appointment/${appt.id}`} className="ml-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
                                              Rate
                                          </Link>
                                      )}
                                      {(appt.status === 'confirmed' || appt.status === 'rescheduled') && (
                                        <button
                                            onClick={() => startRescheduling(appt)}
                                            className="ml-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700"
                                        >
                                            Reschedule
                                        </button>
                                    )}
                                  </li>
                              ))}

                      </ul>
                  ) : (
                      <p className="mt-2 text-gray-600 dark:text-gray-400">Your scheduled appointments will appear here.</p>
                  )}
              </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
