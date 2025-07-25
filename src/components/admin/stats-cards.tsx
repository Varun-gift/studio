
'use client';

import * as React from 'react';
import { useAdminStats } from '@/hooks/use-admin-stats';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Booking } from '@/lib/types';

interface StatsCardsProps {
    onCardClick: (tab: 'bookings' | 'drivers', filter?: Booking['status'] | null) => void;
}

export function StatsCards({ onCardClick }: StatsCardsProps) {
  const { stats, loading } = useAdminStats();

  const statItems = [
    { title: 'Total Users', value: stats.totalUsers, tab: 'drivers' as const, filter: null },
    { title: 'Total Bookings', value: stats.totalBookings, tab: 'bookings' as const, filter: null },
    { title: 'Pending Bookings', value: stats.pendingBookings, tab: 'bookings'as const, filter: 'Pending' as const},
    { title: 'Approved Bookings', value: stats.approvedBookings, tab: 'bookings' as const, filter: 'Approved' as const },
    { title: 'Active Bookings', value: stats.activeBookings, tab: 'bookings' as const, filter: 'Active' as const },
  ];

  if (loading) {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {Array.from({length: 5}).map((_, index) => (
                <Card key={index}>
                    <CardHeader>
                        <Skeleton className="h-5 w-24" />
                    </CardHeader>
                    <CardContent className='space-y-2'>
                        <Skeleton className="h-8 w-12" />
                    </CardContent>
                </Card>
            ))}
        </div>
      )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      {statItems.map((item) => (
        <Card 
            key={item.title} 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => onCardClick(item.tab, item.filter)}
        >
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">{item.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{item.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
