

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { auth, db } from '@/lib/firebase';
import { doc, updateDoc, writeBatch, collection, onSnapshot, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import type { Booking, TimerLog } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getStatusVariant } from '@/lib/utils';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { Loader2, LogOut, Phone, User as UserIcon, Timer, Play, StopCircle, Package, Power, PowerOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const { user, loading, name, role } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    } else if (role && role !== 'driver') {
      router.replace(`/${role}`);
    }
  }, [user, loading, role, router]);


  useEffect(() => {
    if (user?.uid) {
      setBookingsLoading(true);
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('driverInfo.driverId', '==', user.uid)
      );

      const unsubscribe = onSnapshot(bookingsQuery, async (snapshot) => {
        try {
          const bookingsPromises = snapshot.docs.map(async (bookingDoc) => {
            const bookingData = bookingDoc.data();
            const timersCollectionRef = collection(db, 'bookings', bookingDoc.id, 'timers');
            const timersSnapshot = await getDocs(timersCollectionRef);
            
            const timers = timersSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              startTime: (doc.data().startTime as any).toDate(),
              endTime: doc.data().endTime ? (doc.data().endTime as any).toDate() : null,
            } as TimerLog));

            return {
              id: bookingDoc.id,
              ...bookingData,
              bookingDate: (bookingData.bookingDate as any).toDate(),
              createdAt: (bookingData.createdAt as any).toDate(),
              dutyStartTime: bookingData.dutyStartTime ? (bookingData.dutyStartTime as any).toDate() : null,
              dutyEndTime: bookingData.dutyEndTime ? (bookingData.dutyEndTime as any).toDate() : null,
              timers,
            } as Booking;
          });

          const driverBookings = await Promise.all(bookingsPromises);
          
          const sortedBookings = driverBookings.sort((a, b) => {
            const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : a.createdAt.seconds * 1000;
            const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : b.createdAt.seconds * 1000;
            return dateB - dateA;
          });

          setBookings(sortedBookings);
        } catch (error) {
          console.error("Error processing bookings snapshot:", error);
          toast({ title: "Error", description: "Could not process booking updates.", variant: "destructive"});
        } finally {
          setBookingsLoading(false);
        }
      }, (error) => {
        console.error("Error fetching driver bookings:", error);
        toast({ title: "Error", description: "Could not fetch bookings. Please try again later.", variant: "destructive"});
        setBookingsLoading(false);
      });

      return () => unsubscribe(); // Cleanup listener on component unmount
    }
  }, [user?.uid, toast]);
  
 const handleStartDuty = async (bookingId: string) => {
    const bookingRef = doc(db, 'bookings', bookingId);
    try {
        const batch = writeBatch(db);
        batch.update(bookingRef, { 
            status: 'Active',
            dutyStartTime: serverTimestamp(),
        });
        
        const booking = bookings.find(b => b.id === bookingId);
        if(booking && (!booking.timers || booking.timers.length === 0)) {
            const timersCollectionRef = collection(db, 'bookings', bookingId, 'timers');
            
            booking.generators.forEach((genGroup, index) => {
                 const generatorId = `${genGroup.kvaCategory}KVA-U${index+1}`;
                 const timerDocRef = doc(timersCollectionRef);
                 batch.set(timerDocRef, {
                    generatorId,
                    status: 'stopped',
                    startTime: new Date(),
                    endTime: null,
                    duration: 0,
                });
            });
        }
         await batch.commit();
        toast({ title: "Duty Started", description: "Booking is now active." });
    } catch(error) {
        console.error("Error starting duty: ", error);
        toast({ title: "Error", description: "Could not start duty.", variant: "destructive"});
    }
  }

  const handleEndDuty = async (bookingId: string) => {
    const bookingRef = doc(db, 'bookings', bookingId);
    try {
        await updateDoc(bookingRef, { 
            status: 'Completed',
            dutyEndTime: serverTimestamp(),
        });
        toast({ title: "Duty Ended", description: "Booking has been marked as completed." });
    } catch(error) {
        console.error("Error ending duty: ", error);
        toast({ title: "Error", description: "Could not end duty.", variant: "destructive"});
    }
  }

  const handleTimerToggle = async (bookingId: string, timerId: string) => {
    const timerRef = doc(db, 'bookings', bookingId, 'timers', timerId);
    
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
            endTime: null,
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

  const formatGeneratorDetails = (gen: Booking['generators'][0]) => {
    const baseHours = 5;
    const additional = gen.additionalHours || 0;
    const totalHours = baseHours + additional;
    return `1 x ${gen.kvaCategory} KVA (${totalHours} hrs)`;
  }


  if (loading || !user || (role && role !== 'driver')) {
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
                                  <CardTitle className="truncate">{booking.userName}</CardTitle>
                                  <CardDescription>{format(booking.bookingDate, 'PPP')}</CardDescription>
                              </CardHeader>
                              <CardContent className="space-y-4 flex-1">
                                  <div className="flex items-center justify-between">
                                      <span className="text-muted-foreground">Status</span>
                                      <Badge variant={getStatusVariant(booking.status) as any}>{booking.status}</Badge>
                                  </div>
                                  <div className="space-y-2">
                                    <h4 className="font-semibold text-sm flex items-center gap-2"><Package className="h-4 w-4" /> Generators</h4>
                                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                                        {booking.generators.map((gen, idx) => (
                                            <li key={idx}>{formatGeneratorDetails(gen)}</li>
                                        ))}
                                    </ul>
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
                                       <Button onClick={() => handleStartDuty(booking.id)}><Power className="mr-2 h-4 w-4" /> Start Duty</Button>
                                  )}
                                  {booking.status === 'Active' && (
                                       <Button onClick={() => handleEndDuty(booking.id)} variant="destructive"><PowerOff className="mr-2 h-4 w-4"/> End Duty</Button>
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

    
