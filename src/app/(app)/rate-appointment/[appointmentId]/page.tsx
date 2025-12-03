'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { useAuth } from '@/app/hooks/useAuth';

interface Appointment {
    id: string;
    doctorName: string;
    doctorId: string;
    startTime: { seconds: number; nanoseconds: number; };
    status: string;
    patientId: string;
}

export default function RateAppointmentPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const { appointmentId } = params;

    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!appointmentId || !user) return;

        const id = Array.isArray(appointmentId) ? appointmentId[0] : appointmentId;
        if (!id) {
            setError('Invalid appointment ID.');
            setLoading(false);
            return;
        }

        const fetchAppointment = async () => {
            setLoading(true);
            const appointmentRef = doc(db, 'appointments', id);
            const docSnap = await getDoc(appointmentRef);

            if (docSnap.exists()) {
                const appData = { id: docSnap.id, ...docSnap.data() } as Appointment;
                if (appData.patientId === user.uid && appData.status === 'completed') {
                    setAppointment(appData);
                } else {
                    setError('This appointment cannot be rated.');
                }
            } else {
                setError('Appointment not found.');
            }
            setLoading(false);
        };

        fetchAppointment();
    }, [appointmentId, user]);

    const handleSubmitRating = async () => {
        if (!appointment || rating === 0) {
            setError("Please select a rating.");
            return;
        }

        if (!appointment.doctorId) {
            setError("Doctor information is missing. Cannot submit rating.");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/rate-appointment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appointmentId: appointment.id,
                    rating,
                    review,
                    doctorId: appointment.doctorId,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to submit rating.');
            }

            router.push('/user-dashboard');
        } catch (err: any) {
            setError(err.message);
            setSubmitting(false);
        }
    };
    
    const safeCreateDate = (time: { seconds: number; nanoseconds: number; }) => {
        try {
            return new Date(time.seconds * 1000 + time.nanoseconds / 1000000);
        } catch (e) {
            return null;
        }
    };

    if (loading) {
        return <div className="text-center py-10">Loading...</div>;
    }

    if (error) {
        return <div className="text-center py-10 text-red-500">Error: {error}</div>;
    }

    if (!appointment) {
        return <div className="text-center py-10">Appointment not available for rating.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
                    <div className="p-6">
                        <button onClick={() => router.back()} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline mb-4">
                            &larr; Back to Dashboard
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rate Your Appointment</h1>
                        <p className="text-md text-gray-600 dark:text-gray-400 mt-1">Doctor: {appointment.doctorName}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {safeCreateDate(appointment.startTime)?.toLocaleString([], { dateStyle: 'full', timeStyle: 'short' }) || 'Invalid Date'}
                        </p>
                    </div>
                    <div className="p-6 space-y-6 border-t border-gray-200 dark:border-gray-700">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Rating</label>
                            <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        className={`text-3xl transition-colors ${star <= rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`}>
                                        &#9733;
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label htmlFor="review" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Your Review (Optional)</label>
                            <textarea
                                id="review"
                                value={review}
                                onChange={(e) => setReview(e.target.value)}
                                rows={5}
                                placeholder="Tell us about your experience..."
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition"
                            />
                        </div>
                         {error && <p className="text-red-500 text-sm">{error}</p>}
                        <div className="flex justify-end">
                            <button 
                                onClick={handleSubmitRating} 
                                disabled={submitting || rating === 0}
                                className="py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                {submitting ? 'Submitting...' : 'Submit Rating'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
