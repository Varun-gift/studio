
'use client';

import * as React from 'react';
import Image from 'next/image';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { CalendarView } from '@/components/admin/calendar-view';
import { ProfileView } from '@/components/admin/profile-view';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sidebar } from '@/components/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Home, Calendar, Bell, User as UserIcon, LogOut, Settings } from 'lucide-react';
import { DriverManager } from '@/components/admin/driver-manager';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BottomNav } from '@/components/admin/bottom-nav';

export default function AdminPage() {
  const [activeTab, setActiveTab] = React.useState('home');
  const { name, photoURL } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  const navItems = [
    { name: 'home', icon: Home, label: 'Home' },
    { name: 'bookings', icon: Calendar, label: 'Bookings' },
    { name: 'users', icon: UserIcon, label: 'Users' },
    { name: 'notifications', icon: Bell, label: 'Notifications' },
    { name: 'profile', icon: Settings, label: 'Profile' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <AdminDashboard onCardClick={(tab) => setActiveTab(tab)} />;
      case 'bookings':
        return <CalendarView />;
      case 'users':
        return <DriverManager />;
      case 'notifications':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Notifications are not yet implemented.</p>
            </CardContent>
          </Card>
        );
      case 'profile':
        return <ProfileView />;
      default:
        return <AdminDashboard onCardClick={(tab) => setActiveTab(tab)} />;
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
              <Image src="https://static.wixstatic.com/media/98dac2_72e59aa0510243c0936c2b4a3880c891~mv2.png" alt="AMG Logo" width={32} height={32} />
              <h1 className="text-lg font-semibold">AMG</h1>
          </div>
          <div className="relative ml-auto flex-1 md:grow-0">
            {/* Can add search bar here later */}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={photoURL || ''} alt={name || 'Admin'} />
                  <AvatarFallback>{name?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
               <DropdownMenuItem onClick={() => setActiveTab('profile')}>Profile</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
