

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { auth, db } from '@/lib/firebase';
import { doc, updateDoc, onSnapshot, query, where, serverTimestamp, getDoc } from 'firebase/firestore';
import type { Booking } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getStatusVariant } from '@/lib/utils';
import { format } from 'date-fns';
import { Loader2, LogOut, Phone, User as UserIcon, Package, Power, PowerOff, Car, Cpu } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';

const parseDuration = (durationStr: string): number => {
    if (!durationStr || !durationStr.includes(':')) return 0;
    const parts = durationStr.split(':');
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 60 + minutes;
};

export default function DriverDashboard() {
  const { user, loading, name, role } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [isFetchingHours, setIsFetchingHours] = useState<string | null>(null);
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
            
            return {
              id: bookingDoc.id,
              ...bookingData,
              bookingDate: (bookingData.bookingDate as any).toDate(),
              createdAt: (bookingData.createdAt as any).toDate(),
              dutyStartTime: bookingData.dutyStartTime ? (bookingData.dutyStartTime as any).toDate() : null,
              dutyEndTime: bookingData.dutyEndTime ? (bookingData.dutyEndTime as any).toDate() : null,
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
  
 const fetchEngineHours = async (booking: Booking): Promise<string | null> => {
    const imeiNumber = booking.vehicleInfo?.imeiNumber;
    if (!imeiNumber) {
        toast({ title: "IMEI not found", description: "Vehicle has no IMEI number.", variant: "destructive" });
        return null;
    }

    setIsFetchingHours(booking.id);
    try {
        const res = await fetch('/api/fleetop/hours', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                imei: imeiNumber,
                // For live/current hours, a recent range is needed.
                // The API route defaults to last 24h if start/end are null.
                start: booking.dutyStartTime?.toISOString(),
                end: new Date().toISOString()
            })
        });
        if (!res.ok) {
            const errorData = await res.json();
            const errorMessage = errorData.error === 'No ignition data' 
                ? 'No ignition data found for the active period.' 
                : 'Failed to fetch from API.';
            throw new Error(errorMessage);
        }
        
        const data = await res.json();
        return data.engineOnHours || null;
    } catch (error: any) {
        console.error("Error fetching engine hours:", error);
        toast({ title: "API Error", description: error.message, variant: "destructive" });
        return null;
    } finally {
        setIsFetchingHours(null);
    }
 };
  
 const handleStartDuty = async (bookingId: string) => {
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingDoc = await getDoc(bookingRef);
    if (!bookingDoc.exists()) {
        toast({ title: "Error", description: "Booking not found.", variant: "destructive"});
        return;
    }
    const bookingData = { id: bookingDoc.id, ...bookingDoc.data() } as Booking;
    
    if(!bookingData.vehicleInfo?.imeiNumber) {
         toast({ title: "Cannot Start Duty", description: "No vehicle with an IMEI number is assigned.", variant: "destructive"});
         return;
    }

    const startHours = await fetchEngineHours(bookingData);
    if (startHours === null) {
        toast({ title: "Failed", description: "Could not get start engine hours. Duty not started.", variant: "destructive"});
        return;
    }
    
    try {
        await updateDoc(bookingRef, { 
            status: 'Active',
            dutyStartTime: serverTimestamp(),
            engineStartHours: startHours,
        });
        toast({ title: "Duty Started", description: `Engine start hours recorded: ${startHours}. Booking is now active.` });
    } catch(error) {
        console.error("Error starting duty: ", error);
        toast({ title: "Error", description: "Could not start duty.", variant: "destructive"});
    }
  }

  const handleEndDuty = async (bookingId: string) => {
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingDoc = await getDoc(bookingRef);
    if (!bookingDoc.exists()) {
        toast({ title: "Error", description: "Booking not found.", variant: "destructive"});
        return;
    }
    const booking = { id: bookingDoc.id, ...bookingDoc.data() } as Booking;

    const endHours = await fetchEngineHours(booking);
    if (endHours === null) {
        toast({ title: "Failed", description: "Could not get end engine hours. Duty not ended.", variant: "destructive"});
        return;
    }
    
    const startMinutes = parseDuration(booking.engineStartHours || '0:0');
    const endMinutes = parseDuration(endHours);
    
    let finalEngineDuration = '00:00';
    if (endMinutes >= startMinutes) {
        const durationInMinutes = endMinutes - startMinutes;
        const hours = Math.floor(durationInMinutes / 60);
        const minutes = durationInMinutes % 60;
        finalEngineDuration = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    } else {
        toast({ title: "Warning", description: "End hours are less than start hours. Duration may be incorrect.", variant: "default" });
    }

    try {
        await updateDoc(bookingRef, { 
            status: 'Completed',
            dutyEndTime: serverTimestamp(),
            engineEndHours: endHours,
            finalEngineDuration: finalEngineDuration
        });
        toast({ title: "Duty Ended", description: `Engine end hours: ${endHours}. Total duration: ${finalEngineDuration}` });
    } catch(error) {
        console.error("Error ending duty: ", error);
        toast({ title: "Error", description: "Could not end duty.", variant: "destructive"});
    }
  }
  
  const handleViewLiveHours = async (booking: Booking) => {
      const liveHours = await fetchEngineHours(booking);
      if (liveHours !== null) {
          toast({ title: "Live Engine Hours", description: `Current reading from Fleetop: ${liveHours}`});
      }
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
                                       <Button onClick={() => handleStartDuty(booking.id)} disabled={isFetchingHours === booking.id}>
                                           {isFetchingHours === booking.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Power className="mr-2 h-4 w-4" />} Start Duty
                                       </Button>
                                  )}
                                  {booking.status === 'Active' && (
                                      <>
                                          <Button onClick={() => handleViewLiveHours(booking)} variant="outline" disabled={isFetchingHours === booking.id}>
                                              {isFetchingHours === booking.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Cpu className="mr-2 h-4 w-4"/>} View Live Hours
                                          </Button>
                                          <Button onClick={() => handleEndDuty(booking.id)} variant="destructive" disabled={isFetchingHours === booking.id}>
                                              {isFetchingHours === booking.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PowerOff className="mr-2 h-4 w-4"/>} End Duty
                                          </Button>
                                      </>
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
