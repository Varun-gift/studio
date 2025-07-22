
'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatsCards } from './stats-cards';
import { BookingManager } from './booking-manager';
import { DriverManager } from './driver-manager';

export function AdminDashboard() {
  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList className="grid grid-cols-3 w-full md:w-auto">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="bookings">Bookings</TabsTrigger>
        <TabsTrigger value="drivers">Users &amp; Drivers</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="space-y-4">
        <StatsCards />
      </TabsContent>
      <TabsContent value="bookings">
        <BookingManager />
      </TabsContent>
      <TabsContent value="drivers">
        <DriverManager />
      </TabsContent>
    </Tabs>
  );
}
