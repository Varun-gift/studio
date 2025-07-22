
'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookingManager } from './booking-manager';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';

export function BookingsView() {

  return (
      <Tabs defaultValue="all">
        <TabsList className='grid w-full grid-cols-5'>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <BookingManager statusFilter={null} />
        </TabsContent>
        <TabsContent value="pending">
          <BookingManager statusFilter="Pending" />
        </TabsContent>
        <TabsContent value="approved">
          <BookingManager statusFilter="Approved" />
        </TabsContent>
        <TabsContent value="active">
          <BookingManager statusFilter="Active" />
        </TabsContent>
          <TabsContent value="completed">
          <BookingManager statusFilter="Completed" />
        </TabsContent>
      </Tabs>
  );
}
