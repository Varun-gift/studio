
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import * as React from 'react';
import { LogOut, Loader2, Home, History, Bell, User as UserIcon, Phone, Settings } from 'lucide-react';
import { ProfileViewManager } from '@/components/user/profile-view-manager';
import { RentalHistory } from '@/components/rental-history';
import { BookingForm } from '@/components/booking-form';
import { SupportView } from '@/components/user/support-view';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BottomNav } from '@/components/user/bottom-nav';
import { Sidebar } from '@/components/sidebar';

export default function UserDashboard() {
  const { user, loading, role, name, photoURL } = useAuth();
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

   const navItems = [
    { name: 'home', icon: Home, label: 'Home' },
    { name: 'history', icon: History, label: 'History' },
    { name: 'support', icon: Phone, label: 'Support' },
    { name: 'notifications', icon: Bell, label: 'Alerts' },
    { name: 'profile', icon: Settings, label: 'Profile' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
            <>
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Book a Generator</h1>
                    <p className="text-muted-foreground">Select your generator and book your rental.</p>
                </div>
                <BookingForm />
            </>
        );
      case 'history':
        return <RentalHistory />;
      case 'support':
        return <SupportView />;
      case 'notifications':
        return (
            <Card>
                <CardHeader>
                <CardTitle>Notifications</CardTitle>
                </CardHeader>
                <CardContent>
                <p className="text-muted-foreground">You have no new notifications.</p>
                </CardContent>
            </Card>
        );
      case 'profile':
        return <ProfileViewManager />;
      default:
        return <BookingForm />;
    }
  };


  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        navItems={navItems}
      />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14 flex-1">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <div className="flex items-center gap-2 sm:hidden">
            <Image src="https://static.wixstatic.com/media/98dac2_72e59aa0510243c0936c2b4a3880c891~mv2.png" alt="AMG Logo" width={24} height={24} />
            <span className="text-xs font-bold">AMG</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:inline-block">Welcome, {name ? name.split(' ')[0] : 'User'}</span>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="rounded-full">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={photoURL || ''} alt={name || 'User'} />
                            <AvatarFallback>{name?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setActiveTab('profile')}>
                        Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-4 pb-20 md:pb-4">
            {renderContent()}
        </main>
      </div>
        
      <div className="md:hidden">
          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
}
