
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
      return;
    }
    if (!user) {
      router.replace('/login');
      return;
    }
    if (role && role !== 'admin') {
      router.replace(`/${role}`);
    }
  }, [user, loading, role, router]);
  
  if (loading || !user || role !== 'admin') {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Verifying Admin Access...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen w-full">
      {children}
    </div>
  );
}
