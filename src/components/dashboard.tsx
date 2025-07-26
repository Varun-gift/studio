
'use client';
import type { Dispatch, SetStateAction } from 'react';
import { BookingForm } from './booking-form';
import { RentalHistory } from './rental-history';
import { SupportView } from './user/support-view';

interface DashboardProps {
  activeTab: string;
  setActiveTab: Dispatch<SetStateAction<string>>;
  name: string | null;
}

export function Dashboard({ activeTab, setActiveTab, name }: DashboardProps) {

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Book a Generator</h1>
              <p className="text-muted-foreground">Select your generator and book your rental.</p>
            </div>
            <BookingForm />
          </>
        );
      case 'history':
        return <RentalHistory />;
      case 'support':
          return <SupportView />;
      default:
        return <BookingForm />;
    }
  };

  return (
    <main className="flex-1 overflow-auto p-4 md:p-8">
      {renderContent()}
    </main>
  );
}
