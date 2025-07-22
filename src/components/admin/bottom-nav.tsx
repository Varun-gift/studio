
'use client';

import * as React from 'react';
import { Home, Calendar, Mail, User } from 'lucide-react';
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
    { name: 'calendar', icon: Calendar, label: 'Calendar' },
    { name: 'notifications', icon: Mail, label: 'Notifications', count: pendingCount },
    { name: 'profile', icon: User, label: 'Profile' },
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
                    <div className="relative">
                        <item.icon className="h-6 w-6" />
                        {item.count && item.count > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 block h-2 w-2 rounded-full bg-red-500 ring-1 ring-background" />
                        )}
                    </div>
                    <span>{item.label}</span>
                    {isActive && (
                        <div className="absolute bottom-0 h-0.5 w-8 bg-primary rounded-full" />
                    )}
                </button>
            );
        })}
      </div>
    </div>
  );
}
