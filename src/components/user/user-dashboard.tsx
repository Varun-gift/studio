
'use client';

import * as React from 'react';
import { DashboardCards } from './dashboard-cards';
import { RecommendedForYou } from './recommended-for-you';
import { useAuth } from '@/hooks/use-auth';
import { HeroBanner } from './hero-banner';
import { Button } from '../ui/button';
import { ArrowRight } from 'lucide-react';

interface UserDashboardProps {
    setActiveTab: (tab: string) => void;
}

export function UserDashboard({ setActiveTab }: UserDashboardProps) {
    const { name } = useAuth();
    
    return (
        <div className="space-y-6">
            <HeroBanner onCTAClick={() => setActiveTab('booking')} />

            <div className="px-4 md:px-6 space-y-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                        Welcome back, {name ? name.split(' ')[0] : 'User'}!
                    </h1>
                </div>

                <div className="text-center">
                    <Button size="lg" onClick={() => setActiveTab('booking')} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                        Get a Quote <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </div>

                <RecommendedForYou setActiveTab={setActiveTab} />
                <DashboardCards setActiveTab={setActiveTab} />
            </div>
        </div>
    );
}
