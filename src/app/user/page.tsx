
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import * as React from 'react';
import {
  LogOut,
  Loader2,
} from 'lucide-react';
import { BottomNav } from '@/components/user/bottom-nav';
import { ProfileView } from '@/components/admin/profile-view';
import { RentalHistory } from '@/components/rental-history';
import { BookingForm } from '@/components/booking-form';
import { SupportView } from '@/components/user/support-view';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';


export default function UserDashboard() {
  const { user, loading, role, name } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState('home');
  
  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };


  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (role !== 'user') {
        if (role === 'admin') {
          router.replace('/admin');
        } else {
          router.replace('/driver');
        }
      }
    }
  }, [user, loading, role, router]);

  if (loading || !user || role !== 'user') {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="ml-2">Loading & Verifying Access...</p>
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
        return (
            <div className='p-4 md:p-6'>
                 <Card>
                    <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                    <p className="text-muted-foreground">You have no new notifications.</p>
                    </CardContent>
                </Card>
            </div>
        );
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
            <div className="flex flex-col items-center">
                <Image src="https://static.wixstatic.com/media/98dac2_72e59aa0510243c0936c2b4a3880c891~mv2.png" alt="AMG Logo" width={24} height={24} />
                <span className="text-xs font-bold">AMG</span>
            </div>
             <span className="ml-2">Welcome, {name ? name.split(' ')[0] : 'User'}</span>
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
