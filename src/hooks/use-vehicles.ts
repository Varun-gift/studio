
'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Vehicle } from '@/lib/types';

interface UseVehiclesProps {
  status?: Vehicle['status'];
}

export function useVehicles({ status }: UseVehiclesProps = {}) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const vehiclesRef = collection(db, 'vehicles');
    const q = status
      ? query(vehiclesRef, where('status', '==', status), orderBy('vehicleName', 'asc'))
      : query(vehiclesRef, orderBy('vehicleName', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        try {
          const allVehicles: Vehicle[] = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Vehicle[];
          setVehicles(allVehicles);
        } catch (err) {
          console.error('Error processing vehicle data:', err);
          setError('Failed to parse vehicle records.');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error fetching vehicles:', err);
        setError('Failed to fetch vehicles.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [status]);

  return { vehicles, loading, error };
}
