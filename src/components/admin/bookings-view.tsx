
'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookingManager } from './booking-manager';
import type { Booking } from '@/lib/types';
import { BookingDetails } from './booking-details';

interface BookingsViewProps {
  statusFilter?: Booking['status'] | null;
}

export function BookingsView({ statusFilter }: BookingsViewProps) {
  const [activeTab, setActiveTab] = React.useState(statusFilter ? statusFilter.toLowerCase() : 'all');
  const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null);

  React.useEffect(() => {
    if (statusFilter) {
      setActiveTab(statusFilter.toLowerCase());
    }
    // Reset selected booking when filter changes
    setSelectedBooking(null);
  }, [statusFilter]);
  
  const handleSelectBooking = (booking: Booking) => {
      setSelectedBooking(booking);
  }

  const handleBack = () => {
      setSelectedBooking(null);
  }

  const TABS: {value: string; label: string; filter: Booking['status'] | null}[] = [
      {value: 'all', label: 'All', filter: null},
      {value: 'pending', label: 'Pending', filter: 'Pending'},
      {value: 'approved', label: 'Approved', filter: 'Approved'},
      {value: 'active', label: 'Active', filter: 'Active'},
      {value: 'completed', label: 'Completed', filter: 'Completed'},
  ];

  if (selectedBooking) {
      return <BookingDetails booking={selectedBooking} onBack={handleBack} />;
  }

  return (
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-xl font-bold">Recent Bookings</h2>
          <TabsList className="flex flex-wrap h-auto">
            {TABS.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
            ))}
          </TabsList>
        </div>
        <div className="mt-4">
           {TABS.map(tab => (
            <TabsContent key={tab.value} value={tab.value}>
                <BookingManager 
                    statusFilter={tab.filter} 
                    onSelectBooking={handleSelectBooking}
                />
            </TabsContent>
           ))}
        </div>
      </Tabs>
  );
}
