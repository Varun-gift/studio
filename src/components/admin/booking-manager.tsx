
'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { useBookings } from '@/hooks/use-bookings';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getStatusVariant } from '@/lib/utils';
import { Booking } from '@/lib/types';


export function BookingManager() {
  const { bookings, loading } = useBookings();

  const renderSkeleton = () => (
    Array.from({ length: 5 }).map((_, index) => (
      <TableRow key={index}>
        <TableCell colSpan={7}>
          <Skeleton className="h-8 w-full" />
        </TableCell>
      </TableRow>
    ))
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Manager</CardTitle>
        <CardDescription>
          View and manage all customer bookings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
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
              renderSkeleton()
            ) : bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No bookings found.
                </TableCell>
              </TableRow>
            ) : (
              bookings.map((booking: Booking) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <div className="font-medium">{booking.userName}</div>
                    <div className="text-sm text-muted-foreground">{booking.userEmail}</div>
                  </TableCell>
                  <TableCell>
                    <div>{booking.generatorType} ({booking.kvaCategory} KVA)</div>
                    <div className="text-xs text-muted-foreground">Qty: {booking.quantity}</div>
                  </TableCell>
                  <TableCell>{format(booking.bookingDate, 'PPP')}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(booking.status) as any}>{booking.status}</Badge>
                  </TableCell>
                  <TableCell>₹{booking.estimatedCost.toLocaleString()}</TableCell>
                  <TableCell>
                    {booking.driverInfo ? `${booking.driverInfo.name}` : 'Not Assigned'}
                  </TableCell>
                  <TableCell>{booking.location}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
