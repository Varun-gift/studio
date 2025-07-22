
'use client';

import * as React from 'react';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { BottomNav } from '@/components/admin/bottom-nav';
import { CalendarView } from '@/components/admin/calendar-view';
import { NotificationsView } from '@/components/admin/notifications-view';
import { ProfileView } from '@/components/admin/profile-view';

export default function AdminPage() {
  const [activeTab, setActiveTab] = React.useState('home');

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <AdminDashboard />;
      case 'calendar':
        return <CalendarView />;
      case 'notifications':
        return <NotificationsView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
