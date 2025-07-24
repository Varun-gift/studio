
'use client';

import * as React from 'react';
import Image from 'next/image';
import { StatsCards } from './stats-cards';
import { DriverManager } from './driver-manager';
import { BookingsView } from './bookings-view';
import type { Booking } from '@/lib/types';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { AnalyticsCharts } from './analytics-charts';


type View = 'dashboard' | 'bookings' | 'drivers';
type BookingFilter = Booking['status'] | null;


export function AdminDashboard() {
  const [view, setView] = React.useState<View>('dashboard');
  const [bookingFilter, setBookingFilter] = React.useState<BookingFilter>(null);

  const handleCardClick = (targetView: View, filter?: BookingFilter) => {
    setView(targetView);
    if(filter !== undefined) {
        setBookingFilter(filter);
    }
  }
  
  const handleBack = () => {
      setView('dashboard');
      setBookingFilter(null);
  }

  if (view !== 'dashboard') {
    return (
        <div className="space-y-4">
             <Button variant="outline" size="sm" onClick={handleBack} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
             </Button>
            {view === 'bookings' && <BookingsView statusFilter={bookingFilter} />}
            {view === 'drivers' && <DriverManager />}
        </div>
    );
  }


  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleCardClick('bookings')}>
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                    <Image src="https://placehold.co/600x400.png" data-ai-hint="booking office" alt="View All Bookings" width={600} height={400} className="rounded-lg aspect-[3/2] object-cover"/>
                    <CardTitle className="text-base font-semibold mt-2">View All Bookings</CardTitle>
                </CardContent>
            </Card>
             <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleCardClick('drivers')}>
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                     <Image src="https://placehold.co/600x400.png" data-ai-hint="users group" alt="Manage Users & Drivers" width={600} height={400} className="rounded-lg aspect-[3/2] object-cover"/>
                    <CardTitle className="text-base font-semibold mt-2">Manage Users & Drivers</CardTitle>
                </CardContent>
            </Card>
        </div>
        
        <div>
            <h2 className="text-xl font-bold mb-4">Summary</h2>
            <StatsCards onCardClick={handleCardClick} />
        </div>

        <div>
            <h2 className="text-xl font-bold mb-4">Analytics</h2>
            <AnalyticsCharts />
        </div>
    </div>
  );
}
