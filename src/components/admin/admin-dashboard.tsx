
'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatsCards } from './stats-cards';
import { BookingManager } from './booking-manager';
import { DriverManager } from './driver-manager';
import { Booking } from '@/lib/types';
import { CalendarView } from './calendar-view';

interface AdminDashboardProps {
  onCardClick: (tab: string) => void;
}

export function AdminDashboard({ onCardClick }: AdminDashboardProps) {
  return (
    <div className="space-y-4">
      <StatsCards onCardClick={onCardClick} />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <BookingManager statusFilter={null} />
        </div>
        <div className="lg:col-span-3">
          <DriverManager />
        </div>
      </div>
    </div>
  );
}
