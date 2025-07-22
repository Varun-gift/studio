
'use client';

import * as React from 'react';
import { Home, Calendar, Package, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBookings } from '@/hooks/use-bookings';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
    const { bookings } = useBookings({ status: 'Pending' });
    const pendingCount = bookings.length;

  const navItems = [
    { name: 'home', icon: Home, label: 'Home' },
    { name: 'bookings', icon: Package, label: 'Bookings' },
    { name: 'users', icon: User, label: 'Users' },
    { name: 'calendar', icon: Calendar, label: 'Calendar' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-background md:hidden z-20">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
            const isActive = activeTab === item.name;
            return (
                <button
                    key={item.name}
                    onClick={() => setActiveTab(item.name)}
                    className={cn(
                    'flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors relative',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                >
                    <item.icon className="h-6 w-6" />
                    <span>{item.label}</span>
                    {isActive && (
                        <div className="absolute bottom-0 h-0.5 w-8 bg-primary rounded-full" />
                    )}
                     {item.name === 'bookings' && pendingCount > 0 && (
                      <div className="absolute top-2 right-4 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center">
                        {pendingCount}
                      </div>
                    )}
                </button>
            );
        })}
      </div>
    </div>
  );
}
