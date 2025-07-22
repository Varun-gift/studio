
'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBookings } from '@/hooks/use-bookings';
import { Badge } from '../ui/badge';
import { Booking } from '@/lib/types';

export function CalendarView() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const { bookings, loading } = useBookings({ status: 'Approved' });

  const bookingsForSelectedDay = date
    ? bookings.filter((booking) => format(booking.bookingDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'))
    : [];
    
  const bookedDays = bookings.map(b => b.bookingDate);

  return (
    <div className="space-y-4">
       <Card>
        <CardHeader>
            <CardTitle>Booking Calendar</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
            <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
                modifiers={{
                    booked: bookedDays,
                }}
                 modifiersClassNames={{
                    booked: 'bg-primary/20 rounded-full',
                }}
            />
        </CardContent>
       </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Bookings for {date ? format(date, 'PPP') : 'selected date'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : bookingsForSelectedDay.length > 0 ? (
            <ul className="space-y-4">
              {bookingsForSelectedDay.map((booking: Booking) => (
                <li key={booking.id} className="p-4 border rounded-lg">
                  <p className="font-semibold">{booking.generatorType} ({booking.kvaCategory} KVA)</p>
                  <p className="text-sm text-muted-foreground">{booking.userName}</p>
                  <p className="text-sm text-muted-foreground">{booking.location}</p>
                  <Badge variant="secondary">Approved</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No approved bookings for this day.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
