
'use client';

import * as React from 'react';
import { StatsCards } from './stats-cards';
import { DriverManager } from './driver-manager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookingsView } from './bookings-view';
import type { Booking } from '@/lib/types';

interface AdminDashboardProps {
  activeInnerTab: string;
  setActiveInnerTab: (tab: string) => void;
  bookingFilter: string | null;
  setBookingFilter: (filter: string | null) => void;
}

export function AdminDashboard({ activeInnerTab, setActiveInnerTab, bookingFilter, setBookingFilter }: AdminDashboardProps) {

  const handleTabChange = (tabName: string) => {
    if (activeInnerTab === tabName) {
      setActiveInnerTab('');
      setBookingFilter(null);
    } else {
      setActiveInnerTab(tabName);
      setBookingFilter(null); // Reset filter when switching main tabs
    }
  };
  
  const handleCardClick = (tab: string, filter?: Booking['status'] | null) => {
    setActiveInnerTab(tab);
    setBookingFilter(filter || null);
  }

  return (
    <div className="space-y-4">
      <StatsCards onCardClick={handleCardClick} />
      
      <Tabs value={activeInnerTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bookings">All Bookings</TabsTrigger>
            <TabsTrigger value="drivers">Users & Drivers</TabsTrigger>
        </TabsList>
        
        <TabsContent value="bookings" className="mt-4">
            <BookingsView statusFilter={bookingFilter as Booking['status'] | null} />
        </TabsContent>
        <TabsContent value="drivers" className="mt-4">
            <DriverManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
