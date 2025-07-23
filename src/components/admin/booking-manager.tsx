
'use client';

import * as React from 'react';
import { format, formatDistanceStrict } from 'date-fns';
import { MoreHorizontal, Truck, UserX, Check, XCircle, User, Phone, Timer, ChevronDown } from 'lucide-react';
import { doc, updateDoc, collection, getDocs } from 'firebase/firestore';

import { useBookings } from '@/hooks/use-bookings';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { getStatusVariant } from '@/lib/utils';
import { Booking, TimerLog } from '@/lib/types';

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
import { ScrollArea } from '../ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';

interface BookingManagerProps {
  statusFilter?: Booking['status'] | null;
}

export function BookingManager({ statusFilter }: BookingManagerProps) {
  const { bookings: initialBookings, loading } = useBookings({ status: statusFilter });
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const { toast } = useToast();
  const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null);
  const [isAssignDriverOpen, setIsAssignDriverOpen] = React.useState(false);

  React.useEffect(() => {
    const fetchTimersForBookings = async () => {
        if (!initialBookings || initialBookings.length === 0) {
            setBookings(initialBookings);
            return;
        }

        const bookingsWithTimers = await Promise.all(
            initialBookings.map(async (booking) => {
                const timersCollectionRef = collection(db, 'bookings', booking.id, 'timers');
                const timersSnapshot = await getDocs(timersCollectionRef);
                const timers = timersSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    startTime: (doc.data().startTime as any).toDate(),
                    endTime: doc.data().endTime ? (doc.data().endTime as any).toDate() : undefined,
                } as TimerLog));
                return { ...booking, timers };
            })
        );
        setBookings(bookingsWithTimers);
    };

    fetchTimersForBookings();
  }, [initialBookings]);


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
  
    const formatDuration = (seconds: number) => {
      return formatDistanceStrict(new Date(0), new Date(seconds * 1000));
    }
  
  const getTitle = () => {
      if(statusFilter) {
          return `${statusFilter} Bookings`;
      }
      return 'All Bookings';
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{getTitle()}</CardTitle>
          <CardDescription>
            View and manage all customer bookings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full whitespace-nowrap rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Customer</TableHead>
                  <TableHead>Generator</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Assignment</TableHead>
                  <TableHead className="min-w-[200px]">Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                    <Collapsible asChild key={booking.id}>
                      <>
                        <TableRow>
                          <TableCell>
                            <div className="font-medium truncate">{booking.userName}</div>
                            <div className="text-sm text-muted-foreground truncate">{booking.userEmail}</div>
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
                              <div className='flex flex-col gap-1'>
                                <div className='flex items-center gap-2'>
                                  <Truck className='size-3 text-muted-foreground' />
                                  <span className='font-medium'>{booking.driverInfo.name}</span>
                                </div>
                                <div className='flex items-center gap-2 text-xs text-muted-foreground pl-5'>
                                  Vehicle: {booking.driverInfo.vehicleNumber || 'N/A'}
                                </div>
                                <div className='flex items-center gap-2 text-xs text-muted-foreground pl-1'>
                                  <User className='size-3' />
                                  <span>Electrician: {booking.driverInfo.electricianName || 'N/A'}</span>
                                </div>
                                <div className='flex items-center gap-2 text-xs text-muted-foreground pl-1'>
                                  <Phone className='size-3' />
                                  <span>Contact: {booking.driverInfo.electricianContact || 'N/A'}</span>
                                </div>
                              </div>
                              ) : 'Not Assigned'}
                          </TableCell>
                          <TableCell className="whitespace-normal">{booking.location}</TableCell>
                          <TableCell className="text-right">
                             <div className="flex items-center justify-end">
                                {booking.timers && booking.timers.length > 0 && (
                                    <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                        <Timer className="h-4 w-4" />
                                        <span className="sr-only">Toggle Timers</span>
                                    </Button>
                                    </CollapsibleTrigger>
                                )}
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
                            </div>
                          </TableCell>
                        </TableRow>
                        <CollapsibleContent asChild>
                            <tr className="bg-muted/50">
                                <TableCell colSpan={8}>
                                    <div className="p-4">
                                    <h4 className="font-semibold text-md mb-2">Timer Logs</h4>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Generator ID</TableHead>
                                                <TableHead>Start Time</TableHead>
                                                <TableHead>End Time</TableHead>
                                                <TableHead>Duration</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {booking.timers?.map(timer => (
                                                <TableRow key={timer.id}>
                                                    <TableCell>{timer.generatorId}</TableCell>
                                                    <TableCell>{format(timer.startTime, 'PPpp')}</TableCell>
                                                    <TableCell>{timer.endTime ? format(timer.endTime, 'PPpp') : 'N/A'}</TableCell>
                                                    <TableCell>{timer.duration ? formatDuration(timer.duration) : 'N/A'}</TableCell>
                                                    <TableCell><Badge variant={timer.status === 'running' ? 'success' : 'outline'}>{timer.status}</Badge></TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    </div>
                                </TableCell>
                            </tr>
                        </CollapsibleContent>
                      </>
                    </Collapsible>
                  ))
                )}
              </TableBody>
            </Table>
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
