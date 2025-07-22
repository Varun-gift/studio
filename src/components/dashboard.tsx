
'use client';
import type { Dispatch, SetStateAction } from 'react';
import { GeneratorSizingTool } from '@/components/generator-sizing-tool';
import { BookingForm } from './booking-form';
import { RentalHistory } from './rental-history';

interface DashboardProps {
  activeTab: string;
  setActiveTab: Dispatch<SetStateAction<string>>;
}

export function Dashboard({ activeTab, setActiveTab }: DashboardProps) {

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <BookingForm />;
      case 'history':
        return <RentalHistory />;
      case 'sizing':
        return <GeneratorSizingTool />;
      default:
        return <BookingForm />;
    }
  };


  return (
    <main className="flex-1 overflow-auto p-4 md:p-6">
      {renderContent()}
    </main>
  );
}
