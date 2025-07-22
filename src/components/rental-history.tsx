
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import type { Booking } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from './ui/skeleton';
import { format } from 'date-fns';

export function RentalHistory() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userBookings: Booking[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const booking: Booking = {
          id: doc.id,
          ...data,
          bookingDate: (data.bookingDate as any).toDate(),
          createdAt: (data.createdAt as any).toDate(),
        } as Booking;
        userBookings.push(booking);
      });
      setBookings(userBookings);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching bookings:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const getStatusVariant = (status: Booking['status']) => {
    switch (status) {
      case 'Active':
        return 'default';
      case 'Approved':
        return 'secondary';
      case 'Completed':
        return 'secondary';
      case 'Pending':
        return 'outline';
      case 'Rejected':
      case 'Cancelled':
      case 'Voided':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const renderSkeleton = () => (
    <TableRow>
      <TableCell colSpan={6}>
        <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
        </div>
      </TableCell>
    </TableRow>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Rentals</CardTitle>
        <CardDescription>A real-time log of your past and current generator rentals.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Generator</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <>
                  {renderSkeleton()}
                  {renderSkeleton()}
                  {renderSkeleton()}
                </>
              ) : bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">You have no booking history.</TableCell>
                </TableRow>
              ) : (
                bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">
                        <div>{booking.generatorType} ({booking.kvaCategory} KVA)</div>
                        <div className="text-xs text-muted-foreground">Qty: {booking.quantity}</div>
                    </TableCell>
                    <TableCell>{format(booking.bookingDate, 'PPP')}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                    </TableCell>
                    <TableCell>₹{booking.estimatedCost.toLocaleString()}</TableCell>
                    <TableCell>{booking.driverInfo ? `${booking.driverInfo.name} (${booking.driverInfo.contact})` : 'Not Assigned'}</TableCell>
                    <TableCell>{booking.location}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
