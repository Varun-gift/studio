
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { auth, db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, doc, updateDoc, getDocs, QuerySnapshot } from 'firebase/firestore';
import type { Booking } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getStatusVariant } from '@/lib/utils';
import { format } from 'date-fns';
import { Loader2, LogOut, Phone, User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendFCMNotification } from '@/app/actions';

export default function DriverDashboard() {
  const { user, loading, role, name } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (role !== 'driver') {
        if (role === 'admin') {
          router.replace('/admin');
        } else {
          router.replace('/user');
        }
      }
    }
  }, [user, loading, role, router]);

  useEffect(() => {
    if (user && role === 'driver') {
      setBookingsLoading(true);
      const bookingsQuery = query(collection(db, 'bookings'), where('driverInfo.driverId', '==', user.uid));
      
      const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
        const assignedBookings = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          bookingDate: (doc.data().bookingDate as any).toDate(),
        } as Booking));
        setBookings(assignedBookings);
        setBookingsLoading(false);
      }, (error) => {
        console.error("Error fetching driver bookings:", error);
        setBookingsLoading(false);
      });

      return () => unsubscribe();
    }
  }, [user, role]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };
  
  const handleStatusUpdate = async (bookingId: string, newStatus: Booking['status']) => {
    const bookingRef = doc(db, 'bookings', bookingId);
    try {
        await updateDoc(bookingRef, { status: newStatus });
        toast({ title: "Success", description: `Booking status updated to ${newStatus}` });
        
        // Notify admins
        const adminsQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
        const adminSnapshot = await getDocs(adminsQuery);
        adminSnapshot.forEach(adminDoc => {
            const admin = adminDoc.data();
            if (admin.fcmToken) {
                sendFCMNotification(
                    admin.fcmToken,
                    `Booking ${newStatus}`,
                    `Driver ${name} has marked a booking as ${newStatus}.`
                );
            }
        });

    } catch(error) {
        console.error("Error updating status: ", error);
        toast({ title: "Error", description: "Could not update booking status.", variant: "destructive"});
    }
  }


  if (loading || !user || role !== 'driver') {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="ml-2">Loading & Verifying Access...</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-muted/40">
       <header className="sticky top-0 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6 z-10">
          <div className="flex items-center gap-2 font-semibold">
             <span className="">Welcome, {name ? name.split(' ')[0] : 'Driver'}</span>
          </div>
            <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
            </Button>
        </header>
        <main className="flex-1 p-4 md:p-6 space-y-6">
            <h1 className="text-2xl font-bold">Your Assigned Bookings</h1>
            {bookingsLoading ? (
                 <Loader2 className="mx-auto h-8 w-8 animate-spin" />
            ) : bookings.length === 0 ? (
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-center text-muted-foreground">You have no bookings assigned to you yet.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {bookings.map(booking => (
                        <Card key={booking.id}>
                            <CardHeader>
                                <CardTitle>{booking.generatorType} ({booking.kvaCategory} KVA)</CardTitle>
                                <CardDescription>{format(booking.bookingDate, 'PPP')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Status</span>
                                    <Badge variant={getStatusVariant(booking.status) as any}>{booking.status}</Badge>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-semibold">Customer Details</h4>
                                    <div className="flex items-center gap-2 text-sm">
                                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                                        <span>{booking.userName}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <span>{booking.userEmail}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground pt-2">
                                       <span className='font-semibold text-foreground'>Location:</span> {booking.location}
                                    </p>
                                </div>
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
            )}
        </main>
    </div>
  );
}
