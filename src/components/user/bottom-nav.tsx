
'use client';

import * as React from 'react';
import { Home, History, User, Phone, Power } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
    
    const navItems = [
    { name: 'home', icon: Home, label: 'Home' },
    { name: 'history', icon: History, label: 'History' },
    { name: 'support', icon: Phone, label: 'Support' },
    { name: 'profile', icon: User, label: 'Profile' },
  ];


  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-white md:hidden z-20">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
            const isActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors relative',
                  isActive ? 'text-brand-orange-primary' : 'text-brand-blue-darker'
                )}
              >
                <item.icon className="h-6 w-6" />
                <span>{item.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 h-0.5 w-full bg-brand-orange-primary rounded-full" />
                )}
              </button>
            );
        })}
      </div>
    </div>
  );
}
