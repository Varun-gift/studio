'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from '@/lib/types';

interface UseUsersProps {
  role?: 'admin' | 'driver' | 'user';
}

export function useUsers({ role }: UseUsersProps = {}) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const usersRef = collection(db, 'users');
    const q = role
      ? query(usersRef, where('role', '==', role), orderBy('createdAt', 'desc'))
      : query(usersRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        try {
          const allUsers: User[] = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: (doc.data().createdAt as any)?.toDate?.(), // Optional chaining for safety
          })) as User[];

          setUsers(allUsers);
        } catch (err) {
          console.error('Error processing user data:', err);
          setError('Failed to parse user records.');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error fetching users:', err);
        setError('Failed to fetch users.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [role]);

  return { users, loading, error };
}