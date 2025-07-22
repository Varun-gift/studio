
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import * as React from 'react';
import {
  History,
  LayoutDashboard,
  MessageSquare,
  Wrench,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { AmgLogo } from '@/components/amg-logo';
import { Dashboard } from '@/components/dashboard';

export default function UserDashboard() {
  const { user, loading, role } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState('dashboard');
  
  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  useEffect(() => {
    // We allow admin and driver to see the user dashboard, but redirect others
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, role, router]);

  if (loading || !user) {
    return <div>Loading...</div>; // Or a proper loading spinner
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-2">
              <AmgLogo className="size-8" />
              <span className="text-xl font-semibold">AMG</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setActiveTab('dashboard')}
                isActive={activeTab === 'dashboard'}
                tooltip="Dashboard"
              >
                <LayoutDashboard />
                Dashboard
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setActiveTab('sizing')}
                isActive={activeTab === 'sizing'}
                tooltip="Sizing Tool"
              >
                <Wrench />
                Sizing Tool
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setActiveTab('history')}
                isActive={activeTab === 'history'}
                tooltip="Rental History"
              >
                <History />
                Rental History
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Support">
                <a href="mailto:support@amg.com">
                  <MessageSquare />
                  Support
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <div className="p-2 mt-auto">
            <Button onClick={handleLogout} variant="outline" className="w-full">Logout</Button>
        </div>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-card px-6">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-lg font-semibold capitalize">{activeTab.replace('-', ' ')}</h1>
        </header>
        <Dashboard activeTab={activeTab} setActiveTab={setActiveTab} />
      </SidebarInset>
    </SidebarProvider>
  );
}
