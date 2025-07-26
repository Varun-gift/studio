
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, loading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until the loading is finished.
    if (loading) {
      return;
    }

    // If there's no user, redirect to login.
    if (!user) {
      router.replace('/login');
      return;
    }
    
    // Once we have a user and their role, redirect them.
    if (role) {
      switch (role) {
        case 'admin':
          router.replace('/admin');
          break;
        case 'driver':
          router.replace('/driver');
          break;
        case 'user':
          router.replace('/user');
          break;
        default:
          // If role is something unexpected, send to login.
          router.replace('/login');
          break;
      }
    }
    // If the role is still loading, the effect will re-run when it's available.

  }, [user, loading, role, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
       <Loader2 className="mr-2 h-8 w-8 animate-spin" />
      <p>Redirecting you...</p>
    </div>
  );
}
