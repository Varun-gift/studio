
'use client';
import type { Dispatch, SetStateAction } from 'react';
import { RentalHistory } from './rental-history';
import { SupportView } from './user/support-view';
import { UserDashboard } from './user/user-dashboard';

interface DashboardProps {
  activeTab: string;
  setActiveTab: Dispatch<SetStateAction<string>>;
  name: string | null;
}

export function Dashboard({ activeTab, setActiveTab, name }: DashboardProps) {

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <UserDashboard setActiveTab={setActiveTab} />;
      case 'history':
        return <RentalHistory />;
      case 'support':
          return <SupportView />;
      default:
        return <UserDashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <main className="flex-1 overflow-auto p-4 md:p-8">
      {renderContent()}
    </main>
  );
}
