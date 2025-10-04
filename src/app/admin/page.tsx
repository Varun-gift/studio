
'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { CalendarView } from '@/components/admin/calendar-view';
import { ProfileView } from '@/components/admin/profile-view';
import { Sidebar } from '@/components/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Home, Calendar, Bell, Settings, LogOut, Truck, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BottomNav } from '@/components/admin/bottom-nav';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { PanelLeft } from 'lucide-react';
import { VehicleManager } from '@/components/admin/vehicle-manager';
import { AddonManager } from '@/components/admin/addon-manager';
import { GeneratorManager } from '@/components/admin/generator-manager';


export default function AdminPage() {
  const [activeTab, setActiveTab] = React.useState('home');
  
  const { name, photoURL } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };
  
  const handleSidebarSelect = (tab: string) => {
    setActiveTab(tab);
  };

  const navItems = [
    { name: 'home', icon: Home, label: 'Home' },
    { name: 'calendar', icon: Calendar, label: 'Calendar' },
    { name: 'vehicles', icon: Truck, label: 'Vehicles' },
    { name: 'generators', icon: Truck, label: 'Generators' },
    { name: 'addons', icon: Wrench, label: 'Add-ons' },
    { name: 'profile', icon: Settings, label: 'Profile' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <AdminDashboard />;
      case 'calendar':
        return <CalendarView />;
      case 'vehicles':
        return <VehicleManager />;
      case 'generators':
        return <GeneratorManager />;
      case 'addons':
        return <AddonManager />;
      case 'profile':
        return <ProfileView />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
     <div className="flex min-h-screen w-full bg-transparent">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleSidebarSelect}
        navItems={navItems}
      />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14 flex-1">
         <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-lg px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <Sheet>
              <SheetTrigger asChild>
                  <Button size="icon" variant="outline" className="sm:hidden">
                  <PanelLeft className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                  </Button>
              </SheetTrigger>
              <SheetContent side="left" className="sm:max-w-xs">
                  <nav className="grid gap-6 text-lg font-medium">
                      <Link
                          href="#"
                          className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
                      >
                          <Image src="https://static.wixstatic.com/media/98dac2_72e59aa0510243c0936c2b4a3880c891~mv2.png" alt="AMG Logo" width={24} height={24} className="h-5 w-5 transition-all group-hover:scale-110" />
                          <span className="sr-only">AMG</span>
                      </Link>
                      {navItems.map(item => (
                           <button
                            key={item.name}
                            onClick={() => {
                                handleSidebarSelect(item.name)
                                const trigger = document.querySelector('[data-radix-collection-item] > button');
                                if (trigger instanceof HTMLElement) {
                                    trigger.click();
                                }
                            }}
                            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                            >
                                <item.icon className="h-5 w-5" />
                                {item.label}
                            </button>
                      ))}
                  </nav>
              </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
             <h1 className="text-lg font-semibold sm:text-xl capitalize">{activeTab}</h1>
          </div>
          <div className="relative ml-auto flex-1 md:grow-0">
             <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
             </Button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full bg-brand-orange-primary hover:bg-brand-orange-primary/90">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={photoURL || ''} alt={name || 'Admin'} />
                  <AvatarFallback className="bg-transparent text-white">{name?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
               <DropdownMenuItem onClick={() => handleSidebarSelect('profile')}>Profile</DropdownMenuItem>
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
