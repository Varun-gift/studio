
'use client';

import * as React from 'react';
import { Home, History, Bell, User, Phone, ShoppingCart, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
    
    const navItems = [
    { name: 'dashboard', icon: Home, label: 'Book', href: '/user' },
    { name: 'history', icon: History, label: 'History', href: '/user' },
    { name: 'support', icon: Phone, label: 'Support', href: '/user' },
    { name: 'profile', icon: User, label: 'Profile', href: '/user' },
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
