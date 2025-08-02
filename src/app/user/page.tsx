
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase';
import { LogOut, Home, History, Settings, Phone, Power } from 'lucide-react';
import { BottomNav } from '@/components/user/bottom-nav';
import { ProfileViewManager } from '@/components/user/profile-view-manager';
import { RentalHistory } from '@/components/rental-history';
import { SupportView } from '@/components/user/support-view';
import Image from 'next/image';
import { UserDashboard } from '@/components/user/user-dashboard';
import { Button } from '@/components/ui/button';

export default function UserDashboardPage() {
  const { name } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState('home');
  const [historyStack, setHistoryStack] = React.useState<string[]>(['home']);
  
  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  const handleSetActiveTab = (tab: string) => {
    if (tab !== activeTab) {
      const newHistory = [...historyStack, tab];
      setHistoryStack(newHistory);
      setActiveTab(tab);
    }
  };

  const handleBackPress = React.useCallback(() => {
    if (historyStack.length > 1) {
      const newHistory = historyStack.slice(0, -1);
      const previousTab = newHistory[newHistory.length - 1];
      setHistoryStack(newHistory);
      setActiveTab(previousTab);
      // We handled it, so we don't want the default browser back behavior
      return true;
    }
    // If we're at the beginning of the stack, let the browser handle it (e.g., exit app)
    return false;
  }, [historyStack]);


  React.useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Intercept browser back button press
      if (handleBackPress()) {
         // This is a bit of a hack to keep the URL state consistent 
         // without causing a full re-render, preventing the browser's default back action.
         history.pushState(null, '', window.location.href);
      }
    };

    // Add event listener for the browser's back button
    window.addEventListener('popstate', handlePopState);
    
    // Set initial state
    history.pushState(null, '', window.location.href);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [handleBackPress]);


   const navItems = [
    { name: 'home', icon: Home, label: 'Home' },
    { name: 'history', icon: History, label: 'History' },
    { name: 'support', icon: Phone, label: 'Support' },
    { name: 'profile', icon: Settings, label: 'Profile' },
  ];
  
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <UserDashboard setActiveTab={handleSetActiveTab} />;
      case 'history':
        return <RentalHistory />;
      case 'support':
        return <SupportView />;
      case 'profile':
        return <ProfileViewManager />;
      default:
        return <UserDashboard setActiveTab={handleSetActiveTab} />;
    }
  };


  return (
    <div className="flex min-h-screen w-full bg-background flex-col">
       <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background/80 backdrop-blur-sm px-4">
          <div className="flex items-center gap-2">
            <Image src="https://static.wixstatic.com/media/98dac2_72e59aa0510243c0936c2b4a3880c891~mv2.png" alt="AMG Logo" width={24} height={24} />
            <h1 className="text-lg font-semibold">Generator Rentals</h1>
          </div>
           <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => handleSetActiveTab('profile')}>
                <Settings className="h-5 w-5"/>
                <span className="sr-only">Settings</span>
            </Button>
          </div>
        </header>
        
        <main className="flex-1 space-y-4 pb-20 md:pb-4 p-4">
          {renderContent()}
        </main>
      
        
      <div className="md:hidden">
          <BottomNav activeTab={activeTab} setActiveTab={handleSetActiveTab} />
      </div>
    </div>
  );
}
