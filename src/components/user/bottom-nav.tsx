
'use client';

import * as React from 'react';
import { Home, History, Bell, User, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const navItems = [
    { name: 'home', icon: Home, label: 'Home' },
    { name: 'history', icon: History, label: 'History' },
    { name: 'support', icon: Phone, label: 'Support', isCentral: true },
    { name: 'notifications', icon: Bell, label: 'Alerts' },
    { name: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-background md:hidden z-20">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
            const isActive = activeTab === item.name;
            return (
                <button
                    key={item.name}
                    onClick={() => setActiveTab(item.name)}
                    className={cn(
                        'flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors relative',
                        isActive ? 'text-primary font-bold' : 'text-muted-foreground',
                        item.isCentral && '-mt-4'
                    )}
                >
                    <div className={cn(
                        "rounded-full p-3 flex items-center justify-center relative",
                        item.isCentral && "bg-primary text-primary-foreground shadow-lg"
                    )}>
                        <item.icon className="h-6 w-6" />
                    </div>
                    <span className={cn("relative", item.isCentral && "mt-1")}>{item.label}</span>
                </button>
            );
        })}
      </div>
    </div>
  );
}
