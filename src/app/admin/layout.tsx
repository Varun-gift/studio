
'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Car,
  Home,
  LogOut,
  Menu,
  Package,
  Users,
} from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { AmgLogo } from '@/components/amg-logo';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

function NavLink({
  href,
  children,
  isActive,
}: {
  href: string;
  children: React.ReactNode;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
        isActive && 'bg-muted text-primary'
      )}
    >
      {children}
    </Link>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { name } = useAuth();
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const isMobile = useIsMobile();
  const router = useRouter();
  
  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  const sidebarContent = (
    <div className="flex h-full max-h-screen flex-col gap-2">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/admin" className="flex items-center gap-2 font-semibold">
          <AmgLogo className="size-8" />
          <span className="">AMG Admin</span>
        </Link>
      </div>
      <div className="flex-1">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          <NavLink href="/admin" isActive={true}>
            <Home className="h-4 w-4" />
            Dashboard
          </NavLink>
        </nav>
      </div>
      <div className="mt-auto p-4">
          <Button onClick={handleLogout} variant="outline" className="w-full justify-start gap-3">
              <LogOut className="h-4 w-4" />
              Logout
          </Button>
      </div>
    </div>
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
             <h1 className="text-lg font-semibold md:text-2xl">
                Admin Panel
            </h1>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-8">
            {children}
        </main>
      </div>
    </div>
  );
}
