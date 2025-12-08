
'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/app/components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';

// --- Type Definitions ---
interface Doctor {
  id: string;
  name: string;
  specialization: string;
  email: string;
  yearsOfExperience: number;
  averageRating?: number;
  ratingCount?: number;
}

interface Patient {
  id: string;
  displayName: string;
  email: string;
  disabled: boolean;
}

interface Feedback {
  id: string;
  rating: number;
  review: string;
  doctorName: string;
  patientName: string;
}

// --- Components ---

const DoctorForm = ({ doctor, onSave, onCancel }: { doctor: Partial<Doctor> | null; onSave: (doctor: Partial<Doctor>) => void; onCancel: () => void; }) => {
  const [formData, setFormData] = useState<Partial<Doctor>>(doctor || {});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <h3 className="text-lg font-bold mb-4">{doctor?.id ? 'Edit Doctor' : 'Add New Doctor'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" name="name" placeholder="Name" value={formData.name || ''} onChange={handleChange} required className="w-full p-2 border rounded" />
          <input type="text" name="specialty" placeholder="Specialty" value={formData.specialization || ''} onChange={handleChange} required className="w-full p-2 border rounded" />
          <input type="number" name="yearsOfExperience" placeholder="Years of Experience" value={formData.yearsOfExperience || ''} onChange={handleChange} required className="w-full p-2 border rounded" />
          <input type="email" name="email" placeholder="Email" value={formData.email || ''} onChange={handleChange} required className="w-full p-2 border rounded" />
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DoctorsSection = () => {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState<Partial<Doctor> | null>(null);

    const fetchDoctors = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/admin/doctors');
            if (!response.ok) throw new Error('Failed to fetch doctors');
            const data = await response.json();
            setDoctors(data.doctors || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDoctors();
    }, [fetchDoctors]);

    const handleSaveDoctor = async (doctorData: Partial<Doctor>) => {
        const url = doctorData.id ? `/api/admin/doctors/${doctorData.id}` : '/api/admin/doctors';
        const method = doctorData.id ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(doctorData),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to save doctor');
            }
            await fetchDoctors();
            setIsModalOpen(false);
            setEditingDoctor(null);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDeleteDoctor = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this doctor?')) {
            try {
                const response = await fetch(`/api/admin/doctors/${id}`, { method: 'DELETE' });
                if (!response.ok) throw new Error('Failed to delete doctor');
                await fetchDoctors();
            } catch (err: any) {
                setError(err.message);
            }
        }
    };

    if (isLoading) return <p>Loading doctors...</p>;
    if (error) return <p className="text-red-500">Error: {error}</p>;

    return (
        <div>
            <div className="flex justify-end mb-4">
                <button onClick={() => { setEditingDoctor(null); setIsModalOpen(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    + Add New Doctor
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specialty</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg. Rating</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Reviews</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {doctors.map(doctor => (
                            <tr key={doctor.id}>
                                <td className="px-6 py-4">{doctor.name}</td>
                                <td className="px-6 py-4">{doctor.specialization}</td>
                                <td className="px-6 py-4">{doctor.averageRating?.toFixed(1) ?? 'N/A'}</td>
                                <td className="px-6 py-4">{doctor.ratingCount ?? 0}</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => { setEditingDoctor(doctor); setIsModalOpen(true); }} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                    <button onClick={() => handleDeleteDoctor(doctor.id)} className="text-red-600 hover:text-red-900 ml-4">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && (
                <DoctorForm
                    doctor={editingDoctor}
                    onSave={handleSaveDoctor}
                    onCancel={() => { setIsModalOpen(false); setEditingDoctor(null); }}
                />
            )}
        </div>
    );
};

const UsersSection = () => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPatients = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/admin/users');
            if (!response.ok) throw new Error('Failed to fetch patients');
            const data = await response.json();
            setPatients(data.users || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPatients();
    }, [fetchPatients]);

    const handleToggleUserStatus = async (id: string, isDisabled: boolean) => {
        try {
            const response = await fetch(`/api/admin/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ disabled: !isDisabled }),
            });
            if (!response.ok) throw new Error('Failed to update user status');
            await fetchPatients();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (window.confirm('Are you sure you want to permanently delete this user?')) {
            try {
                const response = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
                if (!response.ok) throw new Error('Failed to delete user');
                await fetchPatients();
            } catch (err: any) {
                setError(err.message);
            }
        }
    };

    if (isLoading) return <p>Loading users...</p>;
    if (error) return <p className="text-red-500">Error: {error}</p>;

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {patients.map(patient => (
                        <tr key={patient.id}>
                            <td className="px-6 py-4">{patient.displayName}</td>
                            <td className="px-6 py-4">{patient.email}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${patient.disabled ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                    {patient.disabled ? 'Disabled' : 'Active'}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button onClick={() => handleToggleUserStatus(patient.id, patient.disabled)} className={`text-sm font-medium ${patient.disabled ? 'text-green-600 hover:text-green-900' : 'text-yellow-600 hover:text-yellow-900'}`}>
                                    {patient.disabled ? 'Enable' : 'Disable'}
                                </button>
                                <button onClick={() => handleDeleteUser(patient.id)} className="text-red-600 hover:text-red-900 ml-4">Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const FeedbackSection = () => {
    const [feedback, setFeedback] = useState<Feedback[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchFeedback = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/admin/feedback');
            if (!response.ok) throw new Error('Failed to fetch feedback');
            const data = await response.json();
            setFeedback(data.feedback || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFeedback();
    }, [fetchFeedback]);

    const handleDeleteFeedback = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this feedback?')) {
            try {
                const response = await fetch(`/api/admin/feedback/${id}`, { method: 'DELETE' });
                if (!response.ok) throw new Error('Failed to delete feedback');
                await fetchFeedback();
            } catch (err: any) {
                setError(err.message);
            }
        }
    };

    if (isLoading) return <p>Loading feedback...</p>;
    if (error) return <p className="text-red-500">Error: {error}</p>;

    return (
        <div className="space-y-4">
            {feedback.map(fb => (
                <div key={fb.id} className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 flex justify-between items-start">
                    <div>
                        <p className="font-bold"> Doctor Name: {fb.doctorName}</p>
                        <p className="font-bold"> Patient Name: {fb.patientName}</p>
                        <p>Comment: "{fb.review}"</p>
                        <p className="text-sm text-gray-500">Rated: {fb.rating}/5 by {fb.patientName}</p>
                    </div>
                    <button onClick={() => handleDeleteFeedback(fb.id)} className="text-red-600 hover:text-red-900">Delete</button>
                </div>
            ))}
        </div>
    );
};


// --- Main Dashboard Page ---
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('doctors');
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const adminNavLinks = [
    { id: 'doctors', label: 'Doctors' },
    { id: 'users', label: 'Users' },
    { id: 'feedback', label: 'Feedback' },
  ];

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'doctors':
        return <DoctorsSection />;
      case 'users':
        return <UsersSection />;
      case 'feedback':
        return <FeedbackSection />;
      default:
        return <DoctorsSection />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar navLinks={adminNavLinks} isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col">
      <Header toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-6">
          {renderContent()}
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
