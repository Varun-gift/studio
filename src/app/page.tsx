
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, loading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else {
        // Redirect based on role
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
            // Fallback to login if role is unknown or not set
            router.replace('/login');
            break;
        }
      }
    }
  }, [user, loading, role, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
       <Loader2 className="mr-2 h-8 w-8 animate-spin" />
      <p>Redirecting you...</p>
    </div>
  );
}
