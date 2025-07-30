
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase';
import { LogOut, Home, History, Settings, Phone, Power } from 'lucide-react';
import { BottomNav } from '@/components/user/bottom-nav';
import { ProfileViewManager } from '@/components/user/profile-view-manager';
import { RentalHistory } from '@/components/rental-history';
import { SupportView } from '@/components/user/support-view';
import { BookingForm } from '@/components/booking-form';
import Image from 'next/image';
import { UserDashboard } from '@/components/user/user-dashboard';
import { Button } from '@/components/ui/button';

export default function UserDashboardPage() {
  const { name } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState('home');
  
  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

   const navItems = [
    { name: 'home', icon: Home, label: 'Home' },
    { name: 'booking', icon: Power, label: 'Book' },
    { name: 'history', icon: History, label: 'History' },
    { name: 'support', icon: Phone, label: 'Support' },
    { name: 'profile', icon: Settings, label: 'Profile' },
  ];
  
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <UserDashboard setActiveTab={setActiveTab} />;
      case 'booking':
        return <BookingForm />;
      case 'history':
        return <RentalHistory />;
      case 'support':
        return <SupportView />;
      case 'profile':
        return <ProfileViewManager />;
      default:
        return <UserDashboard setActiveTab={setActiveTab} />;
    }
  };


  return (
    <div className="flex min-h-screen w-full bg-background flex-col">
       <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background/80 backdrop-blur-sm px-4">
          <div className="flex items-center gap-2">
            <Image src="https://static.wixstatic.com/media/98dac2_72e59aa0510243c0936c2b4a3880c891~mv2.png" alt="AMG Logo" width={24} height={24} />
            <h1 className="text-lg font-semibold">Generator Rentals</h1>
          </div>
           <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setActiveTab('profile')}>
                <Settings className="h-5 w-5"/>
                <span className="sr-only">Settings</span>
            </Button>
          </div>
        </header>
        
        <main className="flex-1 space-y-4 pb-20 md:pb-4">
          {renderContent()}
        </main>
      
        
      <div className="md:hidden">
          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
}
