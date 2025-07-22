
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AmgLogo } from '@/components/amg-logo';
import { auth } from '@/lib/firebase';
import { LogOut } from 'lucide-react';


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { name, photoURL } = useAuth();
  const router = useRouter();
  
  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  return (
    <div className="flex flex-col min-h-screen w-full">
        <header className="sticky top-0 flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 z-10">
          <div className="w-full flex-1 flex items-center gap-2">
             <AmgLogo className="h-8 w-8" />
             <h1 className="text-lg font-semibold md:text-2xl">
                AMG
            </h1>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={photoURL || ''} alt={name || 'Admin'} />
                        <AvatarFallback>{name?.[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 overflow-y-auto">
            {children}
        </main>
    </div>
  );
}
