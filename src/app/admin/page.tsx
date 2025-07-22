
'use client';

import { AdminDashboard } from '@/components/admin/admin-dashboard';

export default function AdminPage() {
  // The authentication check has been temporarily removed to allow direct access
  // to the admin dashboard for development.
  //
  // To re-enable it, you can restore the following code:
  //
  // import { useEffect } from 'react';
  // import { useRouter } from 'next/navigation';
  // import { useAuth } from '@/hooks/use-auth';
  //
  // const { user, loading, role } = useAuth();
  // const router = useRouter();
  //
  // useEffect(() => {
  //   if (!loading && (!user || role !== 'admin')) {
  //     router.replace('/login');
  //   }
  // }, [user, loading, role, router]);
  //
  // if (loading || !user || role !== 'admin') {
  //   return <div>Loading...</div>; // Or a proper loading spinner
  // }

  return <AdminDashboard />;
}
