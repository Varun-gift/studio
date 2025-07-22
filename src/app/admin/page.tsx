
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';

export default function AdminDashboard() {
  const { user, loading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || role !== 'admin')) {
      router.replace('/login');
    }
  }, [user, loading, role, router]);
  
  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  if (loading || !user || role !== 'admin') {
    return <div>Loading...</div>; // Or a proper loading spinner
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Button onClick={handleLogout} variant="outline">Logout</Button>
      </div>
      <p>Welcome, Admin! You have full access to the system.</p>
    </div>
  );
}
