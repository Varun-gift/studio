
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, loading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until the AuthProvider has finished its initial loading.
    if (loading) {
      return;
    }

    // If there's no user after loading, they are not logged in.
    if (!user) {
      router.replace('/login');
      return;
    }
    
    // Now that we're sure we have a user and their role, we can redirect.
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
          // Fallback for an unknown role.
          router.replace('/login');
          break;
      }
    }
    // The `else` case (user exists but no role) is handled by the loading state in `useAuth`,
    // so we shouldn't get here. If we do, we wait for the next effect run.

  }, [user, loading, role, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
       <Loader2 className="mr-2 h-8 w-8 animate-spin" />
      <p>Redirecting you...</p>
    </div>
  );
}
