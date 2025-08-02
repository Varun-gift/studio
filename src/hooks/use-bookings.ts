
'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Booking } from '@/lib/types';

interface UseBookingsProps {
  status?: Booking['status'] | null;
}

export function useBookings({ status }: UseBookingsProps = {}) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const bookingsRef = collection(db, 'bookings');
    
    // Create a query based on the status filter. If no filter is provided, fetch all.
    const q = status !== undefined 
      ? query(bookingsRef, where('status', '==', status), orderBy('createdAt', 'desc'))
      : query(bookingsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const bookingsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          bookingDate: (data.bookingDate as any).toDate(),
          createdAt: (data.createdAt as any).toDate(),
        } as Booking;
      });
      setBookings(bookingsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching bookings:", error);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [status]); // Rerun effect if status filter changes

  return { bookings, loading };
}
