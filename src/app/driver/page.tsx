
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { auth, db } from '@/lib/firebase';
import { doc, updateDoc, onSnapshot, query, where, serverTimestamp, getDoc, collection, addDoc, getDocs, orderBy } from 'firebase/firestore';
import type { Booking, Timer } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getStatusVariant } from '@/lib/utils';
import { format } from 'date-fns';
import { Loader2, LogOut, Phone, User as UserIcon, Package, Power, PowerOff, Car, Cpu, Play, Pause } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function DriverDashboard() {
  const { user, loading, name, role } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [isUpdatingDuty, setIsUpdatingDuty] = useState<string | null>(null);
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
            const timersSnapshot = await getDocs(query(timersCollectionRef, orderBy('startTime', 'asc')));
            const timers = timersSnapshot.docs.map(timerDoc => {
                const timerData = timerDoc.data();
                return {
                    id: timerDoc.id,
                    ...timerData,
                    startTime: (timerData.startTime as any)?.toDate(),
                    endTime: timerData.endTime ? (timerData.endTime as any).toDate() : undefined,
                } as Timer;
            });
            
            return {
              id: bookingDoc.id,
              ...bookingData,
              bookingDate: (bookingData.bookingDate as any).toDate(),
              createdAt: (bookingData.createdAt as any).toDate(),
              timers: timers,
              isPaused: bookingData.isPaused ?? false,
            } as Booking;
          });

          const driverBookings = await Promise.all(bookingsPromises);
          
          const sortedBookings = driverBookings.sort((a, b) => {
            const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt as any).seconds * 1000;
            const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt as any).seconds * 1000;
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
  
 const fetchEngineHours = async (booking: Booking): Promise<string | null> => {
    const imeiNumber = booking.vehicleInfo?.imeiNumber;
    if (!imeiNumber) {
        toast({ title: "IMEI not found", description: "Vehicle has no IMEI number.", variant: "destructive" });
        return null;
    }
    
    const dutyStartTime = booking.timers?.[0]?.startTime;
    if (!dutyStartTime) {
       toast({ title: "Duty not started", description: "Cannot fetch hours before duty starts.", variant: "destructive" });
       return null;
    }

    try {
        const res = await fetch('/api/fleetop/hours', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                imei: imeiNumber,
                start: dutyStartTime.toISOString(),
                end: new Date().toISOString()
            })
        });

        const data = await res.json();
        
        if (!res.ok) {
            if (data.error === 'No ignition data') {
                return "00:00:00"; 
            }
            throw new Error(data.error || 'Failed to fetch from API.');
        }
        
        return data.engineOnHours || "00:00:00";
    } catch (error: any) {
        console.error("Error fetching engine hours:", error);
        toast({ title: "API Error", description: error.message, variant: "destructive" });
        return null;
    }
 };
  
 const handleStartDuty = async (bookingId: string) => {
    const bookingRef = doc(db, 'bookings', bookingId);
    setIsUpdatingDuty(bookingId);
    try {
        const timersRef = collection(db, 'bookings', bookingId, 'timers');
        await addDoc(timersRef, { startTime: serverTimestamp() });
        await updateDoc(bookingRef, { status: 'Active', isPaused: false });
        
        toast({ title: "Duty Started", description: "Booking is now active and generator is running." });
    } catch(error) {
        console.error("Error starting duty: ", error);
        toast({ title: "Error", description: "Could not start duty.", variant: "destructive"});
    } finally {
        setIsUpdatingDuty(null);
    }
  }

  const handlePauseGenerator = async (booking: Booking) => {
      const activeTimer = booking.timers?.find(t => !t.endTime);
      if (!activeTimer) {
          toast({ title: "Error", description: "No active timer to pause.", variant: "destructive" });
          return;
      }
      
      setIsUpdatingDuty(booking.id);
      const timerRef = doc(db, 'bookings', booking.id, 'timers', activeTimer.id);
      const bookingRef = doc(db, 'bookings', booking.id);
      try {
          await updateDoc(timerRef, { endTime: serverTimestamp() });
          await updateDoc(bookingRef, { isPaused: true });
          
          setBookings(currentBookings => 
            currentBookings.map(b => b.id === booking.id ? {...b, isPaused: true} : b)
          );

          toast({ title: "Generator Paused", description: "Generator timer has been paused." });
      } catch (error) {
          console.error("Error pausing generator: ", error);
          toast({ title: "Error", description: "Could not pause generator.", variant: "destructive" });
      } finally {
          setIsUpdatingDuty(null);
      }
  };

  const handleResumeGenerator = async (bookingId: string) => {
      setIsUpdatingDuty(bookingId);
      const timersRef = collection(db, 'bookings', bookingId, 'timers');
      const bookingRef = doc(db, 'bookings', bookingId);
      try {
          await addDoc(timersRef, { startTime: serverTimestamp() });
          await updateDoc(bookingRef, { isPaused: false });

          setBookings(currentBookings => 
            currentBookings.map(b => b.id === bookingId ? {...b, isPaused: false} : b)
          );

          toast({ title: "Generator Resumed", description: "Generator timer has resumed." });
      } catch (error) {
          console.error("Error resuming generator: ", error);
          toast({ title: "Error", description: "Could not resume generator.", variant: "destructive" });
      } finally {
          setIsUpdatingDuty(null);
      }
  };

  const handleEndDuty = async (booking: Booking) => {
    setIsUpdatingDuty(booking.id);
    const bookingRef = doc(db, 'bookings', booking.id);
    
    const activeTimer = booking.timers?.find(t => !t.endTime);
    if(activeTimer) {
         const timerRef = doc(db, 'bookings', booking.id, 'timers', activeTimer.id);
         await updateDoc(timerRef, { endTime: serverTimestamp() });
    }

    const endHours = await fetchEngineHours(booking);
    if (endHours === null) {
        toast({ title: "Failed", description: "Could not get final engine hours from API. Duty not ended.", variant: "destructive"});
        setIsUpdatingDuty(null);
        return;
    }
    
    try {
        await updateDoc(bookingRef, { 
            status: 'Completed',
            runtimeHoursFleetop: endHours,
            isPaused: false,
        });
        toast({ title: "Duty Ended", description: `Final engine hours recorded: ${endHours}` });
    } catch(error) {
        console.error("Error ending duty: ", error);
        toast({ title: "Error", description: "Could not end duty.", variant: "destructive"});
    } finally {
        setIsUpdatingDuty(null);
    }
  }

  const formatGeneratorDetails = (gen: Booking['generators'][0]) => {
    const baseHours = 5;
    const additional = gen.additionalHours || 0;
    const totalHours = baseHours + additional;
    return `1 x ${gen.kvaCategory} KVA (${totalHours} hrs)`;
  }

  const isGeneratorRunning = (booking: Booking) => {
      if(booking.status !== 'Active') return false;
      return !booking.isPaused;
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
                      {bookings.map(booking => {
                          const isRunning = isGeneratorRunning(booking);
                          return (
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
                                   {booking.status === 'Active' && (
                                     <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Generator</span>
                                        <Badge variant={isRunning ? 'success' : 'secondary'}>
                                            {isRunning ? 'Running' : 'Paused'}
                                        </Badge>
                                    </div>
                                   )}
                                  <div className="space-y-2">
                                    <h4 className="font-semibold text-sm flex items-center gap-2"><Package className="h-4 w-4" /> Generators</h4>
                                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                                        {booking.generators.map((gen, idx) => (
                                            <li key={idx}>{formatGeneratorDetails(gen)}</li>
                                        ))}
                                    </ul>
                                  </div>
                                  {booking.vehicleInfo && (
                                     <div className="space-y-2">
                                        <h4 className="font-semibold text-sm flex items-center gap-2"><Car className="h-4 w-4" /> Vehicle</h4>
                                         <p className="text-sm text-muted-foreground">{booking.vehicleInfo.vehicleName} ({booking.vehicleInfo.plateNumber})</p>
                                      </div>
                                  )}
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
                              </CardContent>
                              <CardFooter className="flex flex-col gap-2 items-stretch">
                                  {booking.status === 'Approved' && (
                                       <Button onClick={() => handleStartDuty(booking.id)} disabled={isUpdatingDuty === booking.id}>
                                           {isUpdatingDuty === booking.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Power className="mr-2 h-4 w-4" />} Start Duty
                                       </Button>
                                  )}
                                  {booking.status === 'Active' && (
                                      <div className="grid grid-cols-2 gap-2">
                                         {isRunning ? (
                                             <Button onClick={() => handlePauseGenerator(booking)} variant="secondary" disabled={isUpdatingDuty === booking.id}>
                                                {isUpdatingDuty === booking.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Pause className="mr-2 h-4 w-4"/>} Pause
                                             </Button>
                                         ) : (
                                              <Button onClick={() => handleResumeGenerator(booking.id)} disabled={isUpdatingDuty === booking.id}>
                                                {isUpdatingDuty === booking.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Play className="mr-2 h-4 w-4"/>} Resume
                                              </Button>
                                         )}
                                          <Button onClick={() => handleEndDuty(booking)} variant="destructive" disabled={isUpdatingDuty === booking.id || isRunning}>
                                              {isUpdatingDuty === booking.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PowerOff className="mr-2 h-4 w-4"/>} End Duty
                                          </Button>
                                      </div>
                                  )}
                              </CardFooter>
                            </Card>
                          )
                      })}
                  </div>
                </ScrollArea>
            )}
        </main>
    </div>
  );
}
