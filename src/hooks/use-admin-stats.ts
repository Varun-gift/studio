
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AdminStats {
  totalUsers: number;
  totalBookings: number;
  pendingBookings: number;
  approvedBookings: number;
  activeBookings: number;
}

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalBookings: 0,
    pendingBookings: 0,
    approvedBookings: 0,
    activeBookings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersQuery = query(collection(db, 'users'));
    const bookingsQuery = query(collection(db, 'bookings'));

    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      setStats((prevStats) => ({
        ...prevStats,
        totalUsers: snapshot.size,
      }));
      setLoading(false);
    }, (error) => {
        console.error("Error fetching users for stats: ", error);
        setLoading(false);
    });

    const unsubscribeBookings = onSnapshot(bookingsQuery, (snapshot) => {
      let pending = 0;
      let approved = 0;
      let active = 0;
      snapshot.forEach((doc) => {
        const booking = doc.data();
        if (booking.status === 'Pending') pending++;
        if (booking.status === 'Approved') approved++;
        if (booking.status === 'Active') active++;
      });
      setStats((prevStats) => ({
        ...prevStats,
        totalBookings: snapshot.size,
        pendingBookings: pending,
        approvedBookings: approved,
        activeBookings: active,
      }));
       setLoading(false);
    }, (error) => {
        console.error("Error fetching bookings for stats: ", error);
        setLoading(false);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeBookings();
    };
  }, []);

  return { stats, loading };
}
