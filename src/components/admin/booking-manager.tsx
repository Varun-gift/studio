

'use client';

import * as React from 'react';
import { MoreHorizontal, Truck, Check, UserX, XCircle, Package, Car } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { format } from 'date-fns';

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

interface BookingManagerProps {
  statusFilter?: Booking['status'] | null;
  onSelectBooking: (booking: Booking) => void;
}

export function BookingManager({ statusFilter, onSelectBooking }: BookingManagerProps) {
  const { bookings, loading } = useBookings({ status: statusFilter });
  const { toast } = useToast();
  const [selectedBookingForDriver, setSelectedBookingForDriver] = React.useState<Booking | null>(null);
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
    setSelectedBookingForDriver(booking);
    setIsAssignDriverOpen(true);
  };

  const renderSkeleton = () => (
    Array.from({ length: 3 }).map((_, index) => (
      <Card key={index} className="p-4 space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-5 w-1/4" />
        </div>
        <div className="space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </Card>
    ))
  );
  
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          renderSkeleton()
        ) : bookings.length === 0 ? (
          <div className="col-span-full text-center p-8 text-muted-foreground">
            No bookings found for this category.
          </div>
        ) : (
          bookings.map((booking: Booking) => (
            <Card 
                key={booking.id} 
                className="flex flex-col cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onSelectBooking(booking)}
            >
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-lg">{booking.userName}</CardTitle>
                            <CardDescription>
                                {format(booking.bookingDate, 'PPP')}
                            </CardDescription>
                        </div>
                        <Badge variant={getStatusVariant(booking.status) as any}>{booking.status}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                    <div className='space-y-1'>
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Package className="h-4 w-4" /> Generators</p>
                      <div className="text-sm text-foreground pl-2">
                        {booking.generators.map((g, i) => <div key={i}>{`1 x ${g.kvaCategory} KVA`}</div>)}
                      </div>
                    </div>
                     {booking.driverInfo && (
                        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                            <div className="flex items-center gap-2">
                                <Truck className="h-3 w-3"/>
                                <span>{booking.driverInfo.name}</span>
                            </div>
                        </div>
                     )}
                     {booking.vehicleInfo && (
                        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                            <div className="flex items-center gap-2">
                                <Car className="h-3 w-3"/>
                                <span>{booking.vehicleInfo.vehicleName}</span>
                            </div>
                        </div>
                     )}
                </CardContent>
                <CardContent className="flex justify-between items-center">
                    <div className="font-bold">
                        ₹{booking.estimatedCost.toLocaleString()}
                    </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                aria-haspopup="true"
                                size="icon"
                                variant="ghost"
                                onClick={(e) => e.stopPropagation()}
                            >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleAssignDriver(booking)}>
                                <Truck className='mr-2'/> Assign Driver/Vehicle
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleStatusChange(booking.id, 'Approved')}>
                                <Check className='mr-2'/> Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(booking.id, 'Rejected')}>
                                <UserX className='mr-2' /> Reject
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(booking.id, 'Voided')}>
                                <XCircle className='mr-2'/> Void
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardContent>
            </Card>
          ))
        )}
      </div>
      
      {selectedBookingForDriver && (
        <AssignDriverDialog
          booking={selectedBookingForDriver}
          isOpen={isAssignDriverOpen}
          onOpenChange={setIsAssignDriverOpen}
        />
      )}
    </>
  );
}
