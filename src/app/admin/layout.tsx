
'use client';

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useBookings } from '@/hooks/use-bookings';


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { name, photoURL } = useAuth();
  const { bookings } = useBookings({ status: 'Pending' });
  const pendingCount = bookings.length;
  

  return (
    <div className="flex flex-col min-h-screen w-full">
        <header className="sticky top-0 flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 z-10">
          <div className="w-full flex-1">
             <h1 className="text-lg font-semibold md:text-2xl">
                Admin Panel
            </h1>
          </div>
          <div className="relative">
            <Avatar className="h-9 w-9">
              <AvatarImage src={photoURL || ''} alt={name || 'Admin'} />
              <AvatarFallback>{name?.[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            {pendingCount > 0 && (
                <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
            {children}
        </main>
    </div>
  );
}
