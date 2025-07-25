
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { auth, db } from '@/lib/firebase';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import type { Booking, TimerLog } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getStatusVariant } from '@/lib/utils';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { Loader2, LogOut, Phone, User as UserIcon, Timer, Play, StopCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getDriverBookings } from '../actions';

function TimerDisplay({ startTime }: { startTime: Date }) {
    const [elapsedTime, setElapsedTime] = useState('');

    useEffect(() => {
        const updateElapsedTime = () => {
            setElapsedTime(formatDistanceToNowStrict(startTime));
        };

        updateElapsedTime();
        const timer = setInterval(updateElapsedTime, 1000);
        return () => clearInterval(timer);
    }, [startTime]);

    return (
        <span className="font-mono text-sm font-semibold">{elapsedTime}</span>
    );
}

export default function DriverDashboard() {
  const { user, loading, name } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);


  useEffect(() => {
    if (user?.uid) {
      const fetchBookings = async () => {
        setBookingsLoading(true);
        try {
          const driverBookings = await getDriverBookings(user.uid);
          // Sort bookings client-side to ensure latest is on top
          const sortedBookings = driverBookings.sort((a, b) => {
            const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : a.createdAt.seconds * 1000;
            const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : b.createdAt.seconds * 1000;
            return dateB - dateA;
          });
          setBookings(sortedBookings);
        } catch (error) {
          console.error("Error fetching driver bookings:", error);
          toast({ title: "Error", description: "Could not fetch bookings. Please try again later.", variant: "destructive"});
        } finally {
          setBookingsLoading(false);
        }
      };
      
      fetchBookings();
    }
  }, [user?.uid, toast]);
  
  const handleStatusUpdate = async (bookingId: string, newStatus: Booking['status']) => {
    const bookingRef = doc(db, 'bookings', bookingId);
    try {
        if(newStatus === 'Active') {
            const batch = writeBatch(db);
            batch.update(bookingRef, { status: newStatus });
            
            const booking = bookings.find(b => b.id === bookingId);
            // Only create timers if they don't already exist
            if(booking && booking.quantity > 0 && (!booking.timers || booking.timers.length === 0)) {
                const timersCollectionRef = doc(db, 'bookings', bookingId).collection('timers');
                for (let i = 1; i <= booking.quantity; i++) {
                    const generatorId = `${booking.generatorType.slice(0, 3).toUpperCase()}-${i}`;
                    const timerDocRef = doc(timersCollectionRef);
                     batch.set(timerDocRef, {
                        generatorId,
                        status: 'stopped',
                        startTime: new Date(),
                        endTime: null,
                        duration: 0,
                    });
                }
            }
             await batch.commit();

        } else {
             await updateDoc(bookingRef, { status: newStatus });
        }
       
        toast({ title: "Success", description: `Booking status updated to ${newStatus}` });
    } catch(error) {
        console.error("Error updating status: ", error);
        toast({ title: "Error", description: "Could not update booking status.", variant: "destructive"});
    }
  }

  const handleTimerToggle = async (bookingId: string, timerId: string) => {
    const timerRef = doc(db, 'bookings', bookingId, 'timers', timerId);
    
    // Find the specific booking and timer to get its current state
    const booking = bookings.find(b => b.id === bookingId);
    const timer = booking?.timers?.find(t => t.id === timerId);

    if (!timer) {
        toast({ title: 'Error', description: 'Timer not found.', variant: 'destructive' });
        return;
    }

    try {
      if (timer.status === 'running') {
        const endTime = new Date();
        const startTime = timer.startTime instanceof Date ? timer.startTime : new Date();
        const currentDuration = timer.duration || 0;
        const newDuration = (endTime.getTime() - startTime.getTime()) / 1000; // in seconds
        
        await updateDoc(timerRef, { 
            status: 'stopped',
            endTime: endTime,
            duration: currentDuration + newDuration,
        });
        toast({ title: 'Timer Stopped', description: `Timer for ${timer.generatorId} has been stopped.` });
      } else { // status is 'stopped'
        await updateDoc(timerRef, { 
            status: 'running',
            startTime: new Date(),
            endTime: null, // Clear end time when restarting
        });
        toast({ title: 'Timer Started', description: `Timer for ${timer.generatorId} has started.` });
      }
    } catch (error) {
      console.error('Error toggling timer:', error);
      toast({ title: 'Error', description: 'Could not update timer state.', variant: 'destructive' });
    }
  };

  const calculateTotalDuration = (durationInSeconds: number) => {
    if (!durationInSeconds || durationInSeconds <= 0) return '0s';
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
    const seconds = Math.floor(durationInSeconds % 60);
    return [
        hours > 0 ? `${hours}h` : '',
        minutes > 0 ? `${minutes}m` : '',
        seconds > 0 ? `${seconds}s` : '',
    ].filter(Boolean).join(' ');
  };


  if (loading || !user) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="ml-2">Loading & Verifying Access...</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-background">
       <header className="sticky top-0 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6 z-10">
          <div className="flex items-center gap-2 font-semibold">
             <Image src="https://static.wixstatic.com/media/98dac2_72e59aa0510243c0936c2b4a3880c891~mv2.png" alt="AMG Logo" width={32} height={32} />
             <div className="flex flex-col">
                <span className="text-xs font-bold">AMG</span>
                <span className="text-sm">Welcome, {name ? name.split(' ')[0] : 'Driver'}</span>
             </div>
          </div>
            <Button onClick={async () => {await auth.signOut(); router.push('/login');}} variant="outline" size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
            </Button>
        </header>
        <main className="flex-1 p-4 md:p-6 space-y-6">
            <h1 className="text-2xl font-bold">Your Assigned Bookings</h1>
            {bookingsLoading ? (
                 <div className="flex justify-center mt-8">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                 </div>
            ) : bookings.length === 0 ? (
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-center text-muted-foreground">You have no bookings assigned to you yet.</p>
                    </CardContent>
                </Card>
            ) : (
                <ScrollArea className="w-full">
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-4">
                      {bookings.map(booking => (
                          <Card key={booking.id} className="min-w-[300px] flex flex-col">
                              <CardHeader>
                                  <CardTitle className="truncate">{booking.generatorType} ({booking.kvaCategory} KVA)</CardTitle>
                                  <CardDescription>{format(booking.bookingDate, 'PPP')}</CardDescription>
                              </CardHeader>
                              <CardContent className="space-y-4 flex-1">
                                  <div className="flex items-center justify-between">
                                      <span className="text-muted-foreground">Status</span>
                                      <Badge variant={getStatusVariant(booking.status) as any}>{booking.status}</Badge>
                                  </div>
                                  <div className="space-y-2">
                                      <h4 className="font-semibold">Customer Details</h4>
                                      <div className="flex items-center gap-2 text-sm">
                                          <UserIcon className="h-4 w-4 text-muted-foreground" />
                                          <span className='truncate'>{booking.userName}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm">
                                          <Phone className="h-4 w-4 text-muted-foreground" />
                                          <span className="truncate">{booking.userEmail}</span>
                                      </div>
                                      <p className="text-sm text-muted-foreground pt-2">
                                         <span className='font-semibold text-foreground'>Location:</span> <span className="line-clamp-2">{booking.location}</span>
                                      </p>
                                  </div>
                                   {booking.status === 'Active' && booking.timers && booking.timers.length > 0 && (
                                      <div className="space-y-2 border-t pt-4">
                                          <h4 className="font-semibold flex items-center gap-2"><Timer className="h-4 w-4"/> Generator Timers</h4>
                                          {booking.timers.map((timer) => (
                                            <div key={timer.id} className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50">
                                              <div className='flex flex-col'>
                                                 <span className="font-medium text-sm">{timer.generatorId}</span>
                                                  {timer.status === 'running' && timer.startTime ? (
                                                      <TimerDisplay startTime={timer.startTime} />
                                                  ) : (
                                                       <span className="text-xs text-muted-foreground">
                                                            {timer.duration ? `Used: ${calculateTotalDuration(timer.duration)}` : 'Ready to start'}
                                                       </span>
                                                  )}
                                              </div>
                                              <Button size="sm" variant={timer.status === 'running' ? 'destructive' : 'default'} onClick={() => handleTimerToggle(booking.id, timer.id)}>
                                                 {timer.status === 'running' ? <StopCircle className="mr-2 h-4 w-4"/> : <Play className="mr-2 h-4 w-4"/>}
                                                {timer.status === 'running' ? 'Stop' : 'Start'}
                                              </Button>
                                            </div>
                                          ))}
                                      </div>
                                  )}
                              </CardContent>
                              <CardFooter className="flex justify-end gap-2">
                                  {booking.status === 'Approved' && (
                                       <Button onClick={() => handleStatusUpdate(booking.id, 'Active')}>Start Duty</Button>
                                  )}
                                  {booking.status === 'Active' && (
                                       <Button onClick={() => handleStatusUpdate(booking.id, 'Completed')}>End Duty</Button>
                                  )}
                              </CardFooter>
                          </Card>
                      ))}
                  </div>
                </ScrollArea>
            )}
        </main>
    </div>
  );
}
