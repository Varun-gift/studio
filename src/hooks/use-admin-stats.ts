
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Booking } from '@/lib/types';
import { format } from 'date-fns';

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

    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      setStats((prevStats) => ({
        ...prevStats,
        totalUsers: snapshot.size,
      }));
      if(!loading) setLoading(false);
    }, (error) => {
        console.error("Error fetching users for stats: ", error);
        setLoading(false);
    });

    const unsubscribeBookings = onSnapshot(bookingsQuery, (snapshot) => {
      const statusCounts: { [key in Booking['status']]?: number } = {};
      const monthlyCounts: { [key: string]: number } = {};
      const kvaCounts: { [key: string]: number } = {};
      let totalKvaBookings = 0;
      
      const allBookings: Booking[] = [];
       snapshot.forEach((doc) => {
        const data = doc.data();
        const booking: Booking = {
          id: doc.id,
          ...data,
          bookingDate: (data.bookingDate as any).toDate(),
          createdAt: (data.createdAt as any).toDate(),
        } as Booking;
        allBookings.push(booking);
      });

      allBookings.forEach((booking) => {
        // Increment status count
        statusCounts[booking.status] = (statusCounts[booking.status] || 0) + 1;

        // Increment monthly count
        const month = format(booking.bookingDate, 'yyyy-MM');
        monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;

        // Increment KVA category count
        kvaCounts[booking.kvaCategory] = (kvaCounts[booking.kvaCategory] || 0) + 1;
        totalKvaBookings++;
      });

      // Format for status chart
      const statusDistribution: ChartDistribution[] = ['Approved', 'Pending', 'Active'].map((status, index) => ({
        name: status,
        value: statusCounts[status as Booking['status']] || 0,
        fill: `hsl(var(--chart-${index + 1}))`,
      }));

      // Format for generator distribution chart
      const generatorDistribution: ChartDistribution[] = Object.entries(kvaCounts)
        .map(([name, value], index) => ({
          name,
          value: totalKvaBookings > 0 ? Math.round((value / totalKvaBookings) * 100) : 0,
          fill: `hsl(var(--chart-${index + 1}))`,
        }))
        .sort((a,b) => parseInt(a.name) - parseInt(b.name));


      // Format for line chart
      const bookingsOverTime: BookingsOverTime[] = Object.entries(monthlyCounts)
        .map(([month, total]) => ({ month: format(new Date(month), 'MMM yy'), total }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
        
      setStats((prevStats) => ({
        ...prevStats,
        totalBookings: snapshot.size,
        pendingBookings: statusCounts['Pending'] || 0,
        approvedBookings: statusCounts['Approved'] || 0,
        activeBookings: statusCounts['Active'] || 0,
        bookingStatusDistribution: statusDistribution,
        bookingsOverTime: bookingsOverTime,
        generatorDistribution,
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
  }, [loading]);

  return { stats, loading };
}
