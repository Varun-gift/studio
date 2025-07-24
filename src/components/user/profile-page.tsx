
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { ChevronRight, LogOut, Shield, FileText, User } from 'lucide-react';

interface ProfilePageProps {
  onNavigate: (view: 'editProfile' | 'privacy' | 'legal') => void;
}

export function ProfilePage({ onNavigate }: ProfilePageProps) {
  const { user, name, photoURL } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  const menuItems = [
    {
      label: 'Personal Information',
      icon: User,
      action: () => onNavigate('editProfile'),
    },
    {
      label: 'Privacy and Sharing',
      icon: Shield,
      action: () => onNavigate('privacy'),
    },
    {
      label: 'Legal and Terms',
      icon: FileText,
      action: () => onNavigate('legal'),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-6">Profile</h1>
        <div className="flex items-center gap-4 p-4 rounded-lg">
          <Avatar className="h-20 w-20">
            <AvatarImage src={photoURL || ''} alt={name || 'User'} />
            <AvatarFallback>{name?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-semibold">{name}</h2>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-xl font-semibold px-4">Account</h3>
        <div className="border rounded-lg bg-card text-card-foreground">
          {menuItems.map((item, index) => (
            <React.Fragment key={item.label}>
              <button
                onClick={item.action}
                className="flex items-center justify-between w-full p-4 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
              {index < menuItems.length - 1 && <div className="border-b mx-4"></div>}
            </React.Fragment>
          ))}
        </div>
      </div>
      
      <div className="p-4">
         <Button variant="outline" onClick={handleLogout} className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Log out
         </Button>
      </div>

    </div>
  );
}
