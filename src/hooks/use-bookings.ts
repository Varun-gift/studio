
'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, onSnapshot, orderBy, where, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useFleetopApi } from '@/hooks/use-fleetop-api'; // Assuming this hook exists and handles token logic
import dayjs from 'dayjs'; // Assuming dayjs is installed for date comparisons
import type { Booking } from '@/lib/types';

interface UseBookingsProps {
  status?: Booking['status'] | null;
}

export function useBookings({ status }: UseBookingsProps = {}) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const { fetchRuntimeData } = useFleetopApi(); // Assuming useFleetopApi provides this function
  useEffect(() => {
    setLoading(true);
    const bookingsRef = collection(db, 'bookings');
    let q;

    if (status) {
        q = query(bookingsRef, where('status', '==', status), orderBy('createdAt', 'desc'));
    } else if (status === null) {
        q = query(bookingsRef, orderBy('createdAt', 'desc'));
    } else {
        q = query(bookingsRef, orderBy('createdAt', 'desc'));
    }


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
  }, [status]);

  return { bookings, loading };
}
