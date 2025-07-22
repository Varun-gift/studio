
'use client';

import * as React from 'react';
import { StatsCards } from './stats-cards';
import { DriverManager } from './driver-manager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookingsView } from './bookings-view';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = React.useState('');

  const handleTabChange = (tabName: string) => {
    // This allows toggling the tab off by clicking it again
    setActiveTab(prev => (prev === tabName ? '' : tabName));
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2">
            <TabsTrigger value="bookings">All Bookings</TabsTrigger>
            <TabsTrigger value="drivers">Users & Drivers</TabsTrigger>
        </TabsList>
        
        {/* The content will only render when a tab is active */}
        <TabsContent value="bookings">
            <BookingsView />
        </TabsContent>
        <TabsContent value="drivers">
            <DriverManager />
        </TabsContent>
      </Tabs>
      
      {/* StatsCards are now below the tabs */}
      <StatsCards onCardClick={() => { /* This can be adjusted if clicking stat cards should change tabs */ }} />
    </div>
  );
}
