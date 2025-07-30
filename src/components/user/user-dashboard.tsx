
'use client';

import * as React from 'react';
import { HeroBanner } from './hero-banner';
import { DashboardCards } from './dashboard-cards';
import { QuickQuoteWidget } from './quick-quote-widget';

interface UserDashboardProps {
    setActiveTab: (tab: string) => void;
}

export function UserDashboard({ setActiveTab }: UserDashboardProps) {

    return (
        <div className="space-y-8">
            <HeroBanner onCTAClick={() => setActiveTab('booking')} />
            
            <div className="container mx-auto px-4 md:px-6 space-y-8">
               <DashboardCards setActiveTab={setActiveTab} />
            </div>

            <QuickQuoteWidget setActiveTab={setActiveTab} />
        </div>
    );
}
