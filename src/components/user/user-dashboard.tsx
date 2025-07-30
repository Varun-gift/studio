
'use client';

import * as React from 'react';
import { HeroBanner } from '../user/hero-banner';
import { DashboardCards } from './dashboard-cards';
import { RecommendedForYou } from './recommended-for-you';

interface UserDashboardProps {
    setActiveTab: (tab: string) => void;
}

export function UserDashboard({ setActiveTab }: UserDashboardProps) {

    return (
        <div className="space-y-8">
            <HeroBanner onCTAClick={() => setActiveTab('booking')} />
            
            <div className="container mx-auto px-4 md:px-6 space-y-8">
               <RecommendedForYou setActiveTab={setActiveTab} />
               <DashboardCards setActiveTab={setActiveTab} />
            </div>

        </div>
    );
}
