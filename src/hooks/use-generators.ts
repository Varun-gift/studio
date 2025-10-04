
'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Generator } from '@/lib/types';

export function useGenerators() {
  const [generators, setGenerators] = useState<Generator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const generatorsRef = collection(db, 'generators');
    const q = query(generatorsRef, orderBy('kva', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        try {
          const allGenerators: Generator[] = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Generator[];
          // Firestore returns numbers as strings from KVA, so we sort numerically
          allGenerators.sort((a,b) => parseInt(a.kva) - parseInt(b.kva));
          setGenerators(allGenerators);
        } catch (err) {
          console.error('Error processing generator data:', err);
          setError('Failed to parse generator records.');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error fetching generators:', err);
        setError('Failed to fetch generators.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { generators, loading, error };
}
