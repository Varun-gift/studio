
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { LogOut, Home, History, Settings, Phone, Power } from 'lucide-react';
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
import { ProfileViewManager } from '@/components/user/profile-view-manager';
import { RentalHistory } from '@/components/rental-history';
import { SupportView } from '@/components/user/support-view';
import { BookingForm } from '@/components/booking-form';
import Image from 'next/image';
import { UserDashboard } from '@/components/user/user-dashboard';

export default function UserDashboardPage() {
  const { name, photoURL } = useAuth();
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
  
  const mainNavItems = navItems.filter(item => item.name !== 'booking');

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
    <div className="flex min-h-screen w-full bg-muted/40">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        navItems={mainNavItems}
      />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14 flex-1">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <div className="flex items-center gap-2 sm:hidden">
            <Image src="https://static.wixstatic.com/media/98dac2_72e59aa0510243c0936c2b4a3880c891~mv2.png" alt="AMG Logo" width={24} height={24} />
            <span className="text-xs font-bold">AMG</span>
          </div>
           <div className="ml-auto flex items-center gap-4">
            <span className="hidden sm:inline-block text-foreground">Welcome, {name ? name.split(' ')[0] : 'User'}</span>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="rounded-full bg-brand-orange-primary hover:bg-brand-orange-primary/90">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={photoURL || ''} alt={name || 'User'} />
                            <AvatarFallback className="bg-transparent text-white">{name?.[0]?.toUpperCase()}</AvatarFallback>
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
