
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function UserLayout({
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
    
    // If the user is logged in, but not a 'user', redirect them appropriately
    if (role && role !== 'user') {
        if(role === 'admin') {
            router.replace('/admin');
        } else if (role === 'driver') {
            router.replace('/driver');
        } else {
            router.replace('/login'); // Fallback
        }
    }

  }, [user, loading, role, router]);
  
  // Render a loading state while auth is being checked or redirection is happening.
  if (loading || !user || role !== 'user') {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Verifying Access...</p>
      </div>
    );
  }

  // If everything is fine, render the children components (the user dashboard page).
  return <>{children}</>;
}
