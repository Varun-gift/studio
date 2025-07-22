
'use client';

import * as React from 'react';
import { Users, Package, Clock, CheckCircle, Truck } from 'lucide-react';
import { useAdminStats } from '@/hooks/use-admin-stats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function StatsCards() {
  const { stats, loading } = useAdminStats();

  const statItems = [
    { title: 'Total Users', value: stats.totalUsers, key: 'totalUsers', icon: Users },
    { title: 'Total Bookings', value: stats.totalBookings, key: 'totalBookings', icon: Package },
    { title: 'Pending Bookings', value: stats.pendingBookings, key: 'pendingBookings', icon: Clock },
    { title: 'Approved Bookings', value: stats.approvedBookings, key: 'approvedBookings', icon: CheckCircle },
    { title: 'Active Bookings', value: stats.activeBookings, key: 'activeBookings', icon: Truck },
  ];

  if (loading) {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {Array.from({length: 5}).map((_, index) => (
                <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-6 w-6 rounded-full" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-12" />
                    </CardContent>
                </Card>
            ))}
        </div>
      )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {statItems.map((item) => (
        <Card key={item.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            <item.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
