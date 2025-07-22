
'use client';

import * as React from 'react';
import { StatsCards } from './stats-cards';
import { DriverManager } from './driver-manager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookingsView } from './bookings-view';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = React.useState('');

  const handleTabChange = (tabName: string) => {
    setActiveTab(prev => (prev === tabName ? '' : tabName));
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2">
            <TabsTrigger value="bookings">All Bookings</TabsTrigger>
            <TabsTrigger value="drivers">Users & Drivers</TabsTrigger>
        </TabsList>
        
        <div className="mt-4 space-y-4">
            {/* StatsCards are always visible if no tab is selected, or above tab content */}
            {activeTab === '' && <StatsCards onCardClick={() => { /* Placeholder */ }} />}
            
            <TabsContent value="bookings">
                <BookingsView />
            </TabsContent>
            <TabsContent value="drivers">
                <DriverManager />
            </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
