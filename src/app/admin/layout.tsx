
'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Bell,
  Calendar,
  Home,
  LogOut,
  Menu,
  User,
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, name, photoURL } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const router = useRouter();
  
  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };


  return (
    <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr]">
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <div className="w-full flex-1">
             <h1 className="text-lg font-semibold md:text-2xl">
                Admin Panel
            </h1>
          </div>
          <div className="relative">
            <Avatar className="h-9 w-9">
              <AvatarImage src={photoURL || ''} alt={name || 'Admin'} />
              <AvatarFallback>{name?.[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-8">
            {children}
        </main>
      </div>
    </div>
  );
}
