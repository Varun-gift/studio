
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
  const [activeInnerTab, setActiveInnerTab] = React.useState<string | undefined>(undefined);

  // This function allows toggling the tab off by clicking it again.
  const handleValueChange = (value: string) => {
    if (activeInnerTab === value) {
      setActiveInnerTab(undefined);
    } else {
      setActiveInnerTab(value);
    }
  };
  
  return (
    <div className="space-y-4">
       <Tabs value={activeInnerTab} onValueChange={handleValueChange} className="w-full">
         <TabsList className="grid w-full grid-cols-2">
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

      <StatsCards onCardClick={onCardClick} />
    </div>
  );
}
