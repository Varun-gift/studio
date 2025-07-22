
'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatsCards } from './stats-cards';
import { BookingManager } from './booking-manager';
import { DriverManager } from './driver-manager';
import { Booking } from '@/lib/types';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = React.useState('overview');
  const [bookingFilter, setBookingFilter] = React.useState<Booking['status'] | null>(null);

  const handleCardClick = (tab: string, filter: Booking['status'] | null = null) => {
    setBookingFilter(filter);
    setActiveTab(tab);
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList className="grid grid-cols-3 w-full md:w-auto">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="bookings">Bookings</TabsTrigger>
        <TabsTrigger value="drivers">Users &amp; Drivers</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="space-y-4">
        <StatsCards onCardClick={handleCardClick} />
      </TabsContent>
      <TabsContent value="bookings">
        <BookingManager statusFilter={bookingFilter} />
      </TabsContent>
      <TabsContent value="drivers">
        <DriverManager />
      </TabsContent>
    </Tabs>
  );
}
