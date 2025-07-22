
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { AdminDashboard } from '@/components/admin/admin-dashboard';

export default function AdminPage() {
  const { user, loading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || role !== 'admin')) {
      router.replace('/login');
    }
  }, [user, loading, role, router]);

  if (loading || !user || role !== 'admin') {
    return <div>Loading...</div>; // Or a proper loading spinner
  }

  return <AdminDashboard />;
}
