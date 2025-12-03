
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from 'lucide-react';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  profilePicture: string;
  averageRating: number;
  ratingCount: number;
  yearsOfExperience: number;
  consultationFee: number;
}

export default function DoctorProfiles() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDoctors() {
      try {
        const response = await fetch('/api/doctor-profiles');
        if (!response.ok) {
          throw new Error('Failed to fetch doctors');
        }
        const data = await response.json();
        setDoctors(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchDoctors();
  }, []);

  if (loading) {
    return <div className="text-center text-gray-500 dark:text-gray-400">Loading doctor profiles...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 dark:text-red-400">{error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Doctor Profiles</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map((doctor) => (
          <Card key={doctor.id}>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Image
                  src={doctor.profilePicture || '/default-avatar.png'}
                  alt={doctor.name}
                  width={80}
                  height={80}
                  className="rounded-full"
                />
                <div>
                  <CardTitle>{doctor.name}</CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{doctor.specialty}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-2">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold">{doctor.averageRating ? doctor.averageRating.toFixed(1) : 'N/A'}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">({doctor.ratingCount || 0} reviews)</span>
              </div>
              <p>Experience: {doctor.yearsOfExperience} years</p>
              <p>Consultation Fee: ${doctor.consultationFee}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
