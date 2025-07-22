
'use client';

import * as React from 'react';
import { StatsCards } from './stats-cards';
import { BookingManager } from './booking-manager';
import { DriverManager } from './driver-manager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AdminDashboardProps {
  onCardClick: (tab: string) => void;
}

export function AdminDashboard({ onCardClick }: AdminDashboardProps) {
  const [activeInnerTab, setActiveInnerTab] = React.useState<string | null>(null);

  const handleTabClick = (value: string) => {
    if (activeInnerTab === value) {
      setActiveInnerTab(null); // Deselect if clicked again
    } else {
      setActiveInnerTab(value);
    }
  };

  return (
    <div className="space-y-4">
       <Tabs value={activeInnerTab || ''} onValueChange={setActiveInnerTab} className="w-full">
         <TabsList className="grid w-full grid-cols-2">
           <TabsTrigger value="bookings" onClick={() => handleTabClick('bookings')}>All Bookings</TabsTrigger>
           <TabsTrigger value="users" onClick={() => handleTabClick('users')}>Users & Drivers</TabsTrigger>
         </TabsList>
         <TabsContent value="bookings">
           <BookingManager statusFilter={null} />
         </TabsContent>
         <TabsContent value="users">
           <DriverManager />
         </TabsContent>
       </Tabs>

      <StatsCards onCardClick={onCardClick} />
    </div>
  );
}
