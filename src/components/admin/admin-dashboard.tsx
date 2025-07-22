
'use client';

import * as React from 'react';
import { StatsCards } from './stats-cards';
import { BookingManager } from './booking-manager';
import { DriverManager } from './driver-manager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookingsView } from './bookings-view';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = React.useState('');

  const handleTabClick = (tabName: string) => {
    if (activeTab === tabName) {
      setActiveTab(''); // Deselect if the same tab is clicked
    } else {
      setActiveTab(tabName);
    }
  };

  return (
    <div className="space-y-4">
      <StatsCards onCardClick={() => { /* This can be adjusted if clicking stat cards should change tabs */ }} />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2">
            <TabsTrigger value="bookings" onClick={() => handleTabClick('bookings')}>All Bookings</TabsTrigger>
            <TabsTrigger value="drivers" onClick={() => handleTabClick('drivers')}>Users & Drivers</TabsTrigger>
        </TabsList>
        <TabsContent value="bookings">
            <BookingsView />
        </TabsContent>
        <TabsContent value="drivers">
            <DriverManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
