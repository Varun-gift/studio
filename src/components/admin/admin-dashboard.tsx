
'use client';

import * as React from 'react';
import { StatsCards } from './stats-cards';
import { BookingManager } from './booking-manager';
import { DriverManager } from './driver-manager';
import { Booking } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface AdminDashboardProps {
  onCardClick: (tab: string) => void;
}

export function AdminDashboard({ onCardClick }: AdminDashboardProps) {
  return (
    <div className="space-y-4">
      <StatsCards onCardClick={onCardClick} />
      <Tabs defaultValue="bookings">
          <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value="bookings">All Bookings</TabsTrigger>
              <TabsTrigger value="users">Users & Drivers</TabsTrigger>
          </TabsList>
          <TabsContent value="bookings">
              <BookingManager statusFilter={null} />
          </TabsContent>
          <TabsContent value="users">
              <DriverManager />
          </TabsContent>
      </Tabs>
    </div>
  );
}
