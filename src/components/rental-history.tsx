
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import type { Booking } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from './ui/skeleton';
import { format } from 'date-fns';
import { BookingDetailsView } from './user/booking-details-view';
import { getStatusVariant } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';


export function RentalHistory() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

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

    const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
      const bookingsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          bookingDate: (data.bookingDate as any).toDate(),
          createdAt: (data.createdAt as any).toDate(),
          dutyStartTime: data.dutyStartTime ? (data.dutyStartTime as any).toDate() : undefined,
        } as Booking;
      });
      setBookings(bookingsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching bookings:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const getGeneratorSummary = (booking: Booking) => {
    const totalGenerators = booking.generators.length;
    const kvaList = booking.generators.map(g => g.kvaCategory).join(', ');
    
    const generatorText = totalGenerators > 1 ? 'Generators' : 'Generator';
    return `${totalGenerators} ${generatorText} - ${kvaList} KVA`;
  }

  const renderSkeleton = () => (
     <div className="space-y-4">
        {Array.from({length: 3}).map((_, i) => (
             <div key={i} className="flex justify-between items-center p-4 border-b">
                <div>
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-6 w-16" />
            </div>
        ))}
     </div>
  );

  if(selectedBooking) {
      return <BookingDetailsView booking={selectedBooking} onBack={() => setSelectedBooking(null)} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Rentals</CardTitle>
        <CardDescription>A list of your generator rentals.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
            renderSkeleton()
        ) : bookings.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">You have no booking history.</p>
        ) : (
            <div className="border rounded-lg">
              {bookings.map((booking, index) => (
                <button 
                    key={booking.id} 
                    onClick={() => setSelectedBooking(booking)} 
                    className={`w-full text-left p-4 hover:bg-muted/50 transition-colors flex justify-between items-center ${index < bookings.length - 1 ? 'border-b' : ''}`}
                >
                    <div>
                        <p className="font-semibold">{format(booking.bookingDate, 'PPP')}</p>
                        <p className="text-sm text-muted-foreground">{getGeneratorSummary(booking)}</p>
                    </div>
                    <Badge variant={getStatusVariant(booking.status) as any}>{booking.status}</Badge>
                </button>
              ))}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
