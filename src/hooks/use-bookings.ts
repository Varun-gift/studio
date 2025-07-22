
'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Booking } from '@/lib/types';

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const allBookings: Booking[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const booking: Booking = {
          id: doc.id,
          ...data,
          bookingDate: (data.bookingDate as any).toDate(),
          createdAt: (data.createdAt as any).toDate(),
        } as Booking;
        allBookings.push(booking);
      });
      setBookings(allBookings);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching bookings:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { bookings, loading };
}
