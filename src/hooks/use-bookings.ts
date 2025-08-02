'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import useFleetopApi from '@/hooks/use-fleetop-api';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import type { Booking } from '@/lib/types';

dayjs.extend(advancedFormat);

interface UseBookingsProps {
  status?: Booking['status'] | null;
}

export function useBookings({ status }: UseBookingsProps = {}) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    loading: fleetopLoading,
    error: fleetopError,
    fetchIgnitionSummary,
  } = useFleetopApi();

  useEffect(() => {
    setLoading(true);
    const bookingsRef = collection(db, 'bookings');

    const q = status !== undefined
      ? query(bookingsRef, where('status', '==', status), orderBy('createdAt', 'desc'))
      : query(bookingsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      async (querySnapshot) => {
        const allBookings: Booking[] = [];
        const imeiFetches: Promise<void>[] = [];

        for (const docSnapshot of querySnapshot.docs) {
          const data = docSnapshot.data();

          const bookingDate = (data.bookingDate as any)?.toDate?.();
          const createdAt = (data.createdAt as any)?.toDate?.();

          const booking: Booking = {
            id: docSnapshot.id,
            ...data,
            bookingDate,
            createdAt,
            fleetopRuntimeData: null,
          };

          allBookings.push(booking);

          if (booking.imei_nos) {
            const startDate = dayjs(bookingDate).format('DD-MM-YYYY HH:mm:ss');
            const endDate = dayjs(bookingDate).add(1, 'day').format('DD-MM-YYYY HH:mm:ss');
            const imei = booking.imei_nos;

            imeiFetches.push(
              (async () => {
                try {
                  const data = await fetchIgnitionSummary(startDate, endDate, imei);
                  const index = allBookings.findIndex(b => b.id === booking.id);
                  if (index !== -1 && data && data.length > 0) {
                    allBookings[index].fleetopRuntimeData = data[0];
                  }
                } catch (err) {
                  console.error(`Error fetching Fleetop data for ${imei}:`, err);
                }
              })()
            );
          }
        }

        try {
          await Promise.all(imeiFetches);
          setBookings(allBookings);
        } catch (err) {
          console.error('Error resolving IMEI data:', err);
          setError('Failed to enrich booking data');
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Error fetching bookings:', error);
        setError(error.message || 'Unknown error');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [status, fetchIgnitionSummary]);

  const overallLoading = loading || fleetopLoading;
  const overallError = error || fleetopError;
  const memoizedBookings = useMemo(() => bookings, [bookings]);

  return {
    bookings: memoizedBookings,
    loading: overallLoading,
    error: overallError,
  };
}