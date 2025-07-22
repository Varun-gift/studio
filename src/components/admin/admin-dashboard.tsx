
'use client';

import * as React from 'react';
import { StatsCards } from './stats-cards';
import { BookingManager } from './booking-manager';
import { DriverManager } from './driver-manager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function AdminDashboard() {
  return (
    <div className="space-y-4">
      <StatsCards onCardClick={() => { /* This can be adjusted if clicking stat cards should change tabs */ }} />
    </div>
  );
}
