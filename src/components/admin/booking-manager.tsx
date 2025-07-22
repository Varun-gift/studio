
'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { MoreHorizontal, Truck, UserX, Check, XCircle } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';

import { useBookings } from '@/hooks/use-bookings';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { getStatusVariant } from '@/lib/utils';
import { Booking } from '@/lib/types';

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AssignDriverDialog } from './assign-driver-dialog';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';

export function BookingManager() {
  const { bookings, loading } = useBookings();
  const { toast } = useToast();
  const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null);
  const [isAssignDriverOpen, setIsAssignDriverOpen] = React.useState(false);

  const handleStatusChange = async (bookingId: string, status: Booking['status']) => {
    const bookingRef = doc(db, 'bookings', bookingId);
    try {
      await updateDoc(bookingRef, { status });
      toast({
        title: 'Booking Updated',
        description: `Booking status has been changed to ${status}.`,
      });
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update booking status.',
        variant: 'destructive',
      });
    }
  };
  
  const handleAssignDriver = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsAssignDriverOpen(true);
  };

  const renderSkeleton = () => (
    Array.from({ length: 5 }).map((_, index) => (
      <TableRow key={index}>
        <TableCell colSpan={8}>
          <Skeleton className="h-8 w-full" />
        </TableCell>
      </TableRow>
    ))
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Booking Manager</CardTitle>
          <CardDescription>
            View and manage all customer bookings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full whitespace-nowrap rounded-md border">
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
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  renderSkeleton()
                ) : bookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
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
                        {booking.driverInfo ? (
                          <div className='flex items-center gap-2'>
                            <div className='bg-muted rounded-full p-1.5'>
                              <Truck className='size-3 text-muted-foreground' />
                            </div>
                            <span>
                              {booking.driverInfo.name}
                            </span>
                          </div>
                          ) : 'Not Assigned'}
                      </TableCell>
                      <TableCell>{booking.location}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleStatusChange(booking.id, 'Approved')}>
                              <Check className='mr-2'/> Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(booking.id, 'Rejected')}>
                              <UserX className='mr-2' /> Reject
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(booking.id, 'Voided')}>
                              <XCircle className='mr-2'/> Void
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleAssignDriver(booking)}>
                              <Truck className='mr-2'/> Assign Driver
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>
      
      {selectedBooking && (
        <AssignDriverDialog
          booking={selectedBooking}
          isOpen={isAssignDriverOpen}
          onOpenChange={setIsAssignDriverOpen}
        />
      )}
    </>
  );
}
