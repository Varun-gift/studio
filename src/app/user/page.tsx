
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
  LogOut,
  Menu
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { AmgLogo } from '@/components/amg-logo';
import { Dashboard } from '@/components/dashboard';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';


function NavLink({
  children,
  onClick,
  isActive,
}: {
  children: React.ReactNode;
  onClick: () => void;
  isActive: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
        isActive && 'bg-muted text-primary'
      )}
    >
      {children}
    </button>
  );
}

export default function UserDashboard() {
  const { user, loading, role, name } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const isMobile = useIsMobile();
  
  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if(isMobile) {
      setIsSheetOpen(false);
    }
  }

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

  const sidebarContent = (
    <>
        <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
                <AmgLogo className="size-8" />
                <span className="">AMG Generators</span>
            </Link>
            </div>
            <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                <NavLink onClick={() => handleTabChange('dashboard')} isActive={activeTab === 'dashboard'}>
                    <LayoutDashboard className="h-4 w-4" />
                    New Booking
                </NavLink>
                <NavLink onClick={() => handleTabChange('history')} isActive={activeTab === 'history'}>
                    <History className="h-4 w-4" />
                    Rental History
                </NavLink>
                <NavLink onClick={() => handleTabChange('sizing')} isActive={activeTab === 'sizing'}>
                    <Wrench className="h-4 w-4" />
                    Sizing Tool
                </NavLink>
                <a
                    href="mailto:support@amg.com"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                    <MessageSquare className="h-4 w-4" />
                    Support
                </a>
            </nav>
            </div>
            <div className="mt-auto p-4">
                <Button onClick={handleLogout} variant="outline" className="w-full justify-start gap-3">
                    <LogOut className="h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    </>
  );


  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        {sidebarContent}
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0">
              {sidebarContent}
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
             <h1 className="text-lg font-semibold">
                {name ? `Welcome back, ${name}` : 'Welcome'}
            </h1>
          </div>
        </header>
        <Dashboard activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
}

// Helper component to avoid repetition
function Link(props: React.ComponentProps<'a'>) {
    return <a {...props} />;
}
