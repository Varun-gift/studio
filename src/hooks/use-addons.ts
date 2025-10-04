
'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Addon } from '@/lib/types';

export function useAddons() {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const addonsRef = collection(db, 'addons');
    const q = query(addonsRef, orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        try {
          const allAddons: Addon[] = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Addon[];

          setAddons(allAddons);
        } catch (err) {
          console.error('Error processing addon data:', err);
          setError('Failed to parse addon records.');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error fetching addons:', err);
        setError('Failed to fetch addons.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { addons, loading, error };
}
