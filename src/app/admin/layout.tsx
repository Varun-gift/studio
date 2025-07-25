
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, role } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (loading) {
      return; // Wait for auth state to be determined
    }

    if (!user) {
      router.replace('/login');
      return;
    }
    
    // If the user is logged in, but not an 'admin', redirect them appropriately
    if (role && role !== 'admin') {
      if(role === 'user') {
          router.replace('/user');
      } else if (role === 'driver') {
          router.replace('/driver');
      } else {
          router.replace('/login'); // Fallback
      }
    }
  }, [user, loading, role, router]);
  
  // Render a loading state while auth is being checked or redirection is happening.
  if (loading || !user || role !== 'admin') {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Verifying Admin Access...</p>
      </div>
    );
  }

  // If everything is fine, render the children components (the admin dashboard page).
  return (
    <div className="flex flex-col min-h-screen w-full">
      {children}
    </div>
  );
}
