
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import * as React from 'react';
import {
  History,
  LayoutDashboard,
  LogOut,
  Mail,
  User,
  Bell
} from 'lucide-react';
import { AmgLogo } from '@/components/amg-logo';
import { Dashboard } from '@/components/dashboard';
import { cn } from '@/lib/utils';
import { BottomNav } from '@/components/user/bottom-nav';
import { ProfileView } from '@/components/admin/profile-view';
import { NotificationsView } from '@/components/admin/notifications-view';
import { RentalHistory } from '@/components/rental-history';
import { BookingForm } from '@/components/booking-form';
import { SupportView } from '@/components/user/support-view';


export default function UserDashboard() {
  const { user, loading, role, name } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState('home');
  
  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };


  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, role, router]);

  if (loading || !user) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div>Loading...</div>
        </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
            <div className='p-4 md:p-6'>
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Book a Generator</h1>
                    <p className="text-muted-foreground">Select your generator and book your rental.</p>
                </div>
                <BookingForm />
            </div>
        );
      case 'history':
        return <div className='p-4 md:p-6'><RentalHistory /></div>;
      case 'support':
        return <div className='p-4 md:p-6'><SupportView /></div>;
      case 'notifications':
        return <div className='p-4 md:p-6'><NotificationsView /></div>;
      case 'profile':
        return <div className='p-4 md:p-6'><ProfileView /></div>;
      default:
        return <div className='p-4 md:p-6'><BookingForm /></div>;
    }
  };


  return (
    <div className="flex flex-col min-h-screen w-full bg-muted/40">
        <header className="sticky top-0 flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6 z-10">
          <div className="w-full flex-1 flex items-center gap-2 font-semibold">
             <AmgLogo className="h-8 w-8" />
             <span className="">Welcome, {name ? name.split(' ')[0] : 'User'}</span>
          </div>
            <Button onClick={handleLogout} variant="outline" size="sm" className="hidden md:flex">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
            </Button>
        </header>
        
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
            {renderContent()}
        </main>
        
        <div className="md:hidden">
            <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
    </div>
  );
}
