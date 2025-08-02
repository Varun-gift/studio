
'use client';

import * as React from 'react';
import { StatsCards } from './stats-cards';
import { DriverManager } from './driver-manager';
import { BookingsView } from './bookings-view';
import type { Booking } from '@/lib/types';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { AnalyticsCharts } from './analytics-charts';

type View = 'dashboard' | 'bookings' | 'drivers';
type BookingFilter = Booking['status'] | 'all' | null;


export function AdminDashboard() {
  const [view, setView] = React.useState<View>('dashboard');
  const [bookingFilter, setBookingFilter] = React.useState<BookingFilter>(null);

  const handleCardClick = (targetView: View, filter?: Booking['status']) => {
    setView(targetView);
    setBookingFilter(filter === null ? 'all' : filter);
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
            {view === 'bookings' && <BookingsView initialFilter={bookingFilter} />}
            {view === 'drivers' && <DriverManager />}
        </div>
    );
  }

  return (
    <div className="space-y-6">
        <AnalyticsCharts />
        <StatsCards onCardClick={handleCardClick} />
    </div>
  );
}
