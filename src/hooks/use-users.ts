
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

  useEffect(() => {
    setLoading(true);
    const usersRef = collection(db, 'users');
    let q;

    if (role) {
      q = query(usersRef, where('role', '==', role), orderBy('createdAt', 'desc'));
    } else {
      q = query(usersRef, orderBy('createdAt', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const allUsers: User[] = [];
      querySnapshot.forEach((doc) => {
        allUsers.push({ id: doc.id, ...doc.data() } as User);
      });
      setUsers(allUsers);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [role]);

  return { users, loading };
}
