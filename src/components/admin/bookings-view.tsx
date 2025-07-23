
'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookingManager } from './booking-manager';
import type { Booking } from '@/lib/types';

interface BookingsViewProps {
  statusFilter?: Booking['status'] | null;
}

export function BookingsView({ statusFilter }: BookingsViewProps) {
  const [activeTab, setActiveTab] = React.useState('all');

  // When a filter is passed from the stats card, switch to the correct tab.
  React.useEffect(() => {
    if (statusFilter) {
      setActiveTab(statusFilter.toLowerCase());
    } else {
      setActiveTab('all');
    }
  }, [statusFilter]);

  // Determine the final filter to pass to BookingManager
  const getFilterForTab = (tab: string): Booking['status'] | null => {
    if (tab === 'all') return null;
    return tab.charAt(0).toUpperCase() + tab.slice(1) as Booking['status'];
  };
  
  const currentFilter = getFilterForTab(activeTab);

  return (
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        {/* Render only one BookingManager instance with the current filter */}
        <div className="mt-4">
            <BookingManager statusFilter={currentFilter} />
        </div>
      </Tabs>
  );
}
