'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Booking } from '@/lib/types';
import { format, parse } from 'date-fns';

export interface ChartDistribution {
  name: string;
  value: number;
  fill: string;
}

export interface BookingsOverTime {
  month: string;
  total: number;
}

interface AdminStats {
  totalUsers: number;
  totalBookings: number;
  pendingBookings: number;
  approvedBookings: number;
  activeBookings: number;
  bookingsOverTime: BookingsOverTime[];
  bookingStatusDistribution: ChartDistribution[];
  generatorDistribution: ChartDistribution[];
}

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalBookings: 0,
    pendingBookings: 0,
    approvedBookings: 0,
    activeBookings: 0,
    bookingsOverTime: [],
    bookingStatusDistribution: [],
    generatorDistribution: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersQuery = query(collection(db, 'users'));
    const bookingsQuery = query(collection(db, 'bookings'));

    let usersLoaded = false;
    let bookingsLoaded = false;

    const checkLoadingState = () => {
      if (usersLoaded && bookingsLoaded) setLoading(false);
    };

    const unsubscribeUsers = onSnapshot(
      usersQuery,
      (snapshot) => {
        setStats((prev) => ({
          ...prev,
          totalUsers: snapshot.size,
        }));
        usersLoaded = true;
        checkLoadingState();
      },
      (error) => {
        console.error('Error fetching users:', error);
        usersLoaded = true;
        checkLoadingState();
      }
    );

    const unsubscribeBookings = onSnapshot(
      bookingsQuery,
      (snapshot) => {
        const statusCounts: Record<Booking['status'], number> = {
          Approved: 0,
          Pending: 0,
          Active: 0,
        };

        const monthlyCounts: Record<string, number> = {};
        const kvaCounts: Record<string, number> = {};
        let totalGeneratorsBooked = 0;

        const allBookings: Booking[] = [];

        for (const doc of snapshot.docs) {
          const data = doc.data();
          const bookingDate = (data.bookingDate as any)?.toDate?.();
          const createdAt = (data.createdAt as any)?.toDate?.();

          if (!bookingDate || !createdAt) continue;

          const booking: Booking = {
            id: doc.id,
            ...data,
            bookingDate,
            createdAt,
            generators: data.generators ?? [],
          };

          allBookings.push(booking);

          if (booking.status in statusCounts) {
            statusCounts[booking.status] += 1;
          }

          const monthKey = format(booking.bookingDate, 'yyyy-MM');
          monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1;

          booking.generators?.forEach((gen) => {
            const kva = gen.kvaCategory;
            kvaCounts[kva] = (kvaCounts[kva] || 0) + 1;
            totalGeneratorsBooked += 1;
          });
        }

        const statusDistribution: ChartDistribution[] = Object.entries(statusCounts).map(
          ([status, value], index) => ({
            name: status,
            value,
            fill: `hsl(var(--chart-${index + 1}))`,
          })
        );

        const generatorDistribution: ChartDistribution[] = Object.entries(kvaCounts)
          .map(([name, value], index) => ({
            name,
            value: totalGeneratorsBooked > 0 ? Math.round((value / totalGeneratorsBooked) * 100) : 0,
            fill: `hsl(var(--chart-${index + 1}))`,
          }))
          .sort((a, b) => parseInt(a.name) - parseInt(b.name));

        const bookingsOverTime: BookingsOverTime[] = Object.entries(monthlyCounts)
          .map(([monthKey, total]) => {
            const parsed = parse(monthKey, 'yyyy-MM', new Date());
            return { month: format(parsed, 'MMM yy'), total };
          })
          .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

        setStats((prev) => ({
          ...prev,
          totalBookings: snapshot.size,
          pendingBookings: statusCounts.Pending ?? 0,
          approvedBookings: statusCounts.Approved ?? 0,
          activeBookings: statusCounts.Active ?? 0,
          bookingsOverTime,
          bookingStatusDistribution: statusDistribution,
          generatorDistribution,
        }));

        bookingsLoaded = true;
        checkLoadingState();
      },
      (error) => {
        console.error('Error fetching bookings:', error);
        bookingsLoaded = true;
        checkLoadingState();
      }
    );

    return () => {
      unsubscribeUsers();
      unsubscribeBookings();
    };
  }, []);

  return { stats, loading };
}