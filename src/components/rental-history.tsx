

'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import type { Booking, TimerLog } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from './ui/skeleton';
import { format } from 'date-fns';
import { getStatusVariant } from '@/lib/utils';
import { Truck, User, Phone, Timer, Package } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Button } from './ui/button';
import { ChevronDown } from 'lucide-react';

export function RentalHistory() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(true);
      return;
    }

    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(bookingsQuery, async (snapshot) => {
      const bookingsData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();
          
          const timersCollectionRef = collection(db, 'bookings', doc.id, 'timers');
          const timersSnapshot = await getDocs(timersCollectionRef);
          
          const timers = timersSnapshot.docs.map(timerDoc => {
            const timerData = timerDoc.data();
            return {
              id: timerDoc.id,
              ...timerData,
              startTime: (timerData.startTime as any)?.toDate(),
              endTime: timerData.endTime ? (timerData.endTime as any).toDate() : undefined,
            } as TimerLog;
          });

          return {
            id: doc.id,
            ...data,
            bookingDate: (data.bookingDate as any).toDate(),
            createdAt: (data.createdAt as any).toDate(),
            timers,
          } as Booking;
        })
      );
      setBookings(bookingsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching bookings:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);
  
  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0s';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return [
        hours > 0 ? `${hours}h` : '',
        minutes > 0 ? `${minutes}m` : '',
        secs > 0 ? `${secs}s` : '',
    ].filter(Boolean).join(' ');
  }

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
        <ScrollArea className="w-full whitespace-nowrap rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Generators</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Assignment</TableHead>
                <TableHead className='text-right'>Details</TableHead>
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
                  <Collapsible asChild key={booking.id}>
                    <>
                    <TableRow>
                        <TableCell className="font-medium">
                            <div className="flex flex-col gap-1">
                                {booking.generators.map((gen, idx) => (
                                    <div key={idx} className="text-xs">{gen.quantity} x {gen.kvaCategory} KVA ({gen.usageHours} hrs)</div>
                                ))}
                            </div>
                        </TableCell>
                        <TableCell>{format(booking.bookingDate, 'PPP')}</TableCell>
                        <TableCell>
                        <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                        </TableCell>
                        <TableCell>₹{booking.estimatedCost.toLocaleString()}</TableCell>
                        <TableCell>
                            {booking.driverInfo ? (
                            <div className='flex flex-col gap-1'>
                                <div className='flex items-center gap-2'>
                                <Truck className='size-3 text-muted-foreground' />
                                <span className='font-medium'>{booking.driverInfo.name}</span>
                                </div>
                                <div className='flex items-center gap-2 text-xs text-muted-foreground pl-1'>
                                <Phone className='size-3' />
                                <span>{booking.driverInfo.contact}</span>
                                </div>
                                <div className='flex items-center gap-2 text-xs text-muted-foreground pl-1'>
                                <User className='size-3' />
                                <span>Elec: {booking.driverInfo.electricianName || 'N/A'}</span>
                                </div>
                            </div>
                            ) : 'Not Assigned'}
                        </TableCell>
                        <TableCell className="text-right">
                          {booking.timers && booking.timers.length > 0 && (
                            <CollapsibleTrigger asChild>
                               <Button variant="ghost" size="sm">
                                  <ChevronDown className="h-4 w-4" />
                                  <span className="sr-only">Toggle Details</span>
                               </Button>
                            </CollapsibleTrigger>
                          )}
                        </TableCell>
                    </TableRow>
                     <CollapsibleContent asChild>
                        <tr className="bg-muted/50">
                            <TableCell colSpan={6}>
                                <div className="p-4">
                                <h4 className="font-semibold text-md mb-2 flex items-center gap-2"><Timer className='h-5 w-5' />Timer Logs</h4>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Generator ID</TableHead>
                                            <TableHead>Start Time</TableHead>
                                            <TableHead>End Time</TableHead>
                                            <TableHead>Duration</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {booking.timers?.map(timer => (
                                            <TableRow key={timer.id}>
                                                <TableCell>{timer.generatorId}</TableCell>
                                                <TableCell>{timer.startTime ? format(timer.startTime, 'PPpp') : 'Not started'}</TableCell>
                                                <TableCell>{timer.endTime ? format(timer.endTime, 'PPpp') : 'N/A'}</TableCell>
                                                <TableCell>{timer.duration ? formatDuration(timer.duration) : 'N/A'}</TableCell>
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
  );
}
