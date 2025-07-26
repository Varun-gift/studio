
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Power, Calendar } from 'lucide-react';
import { HeroBanner } from './hero-banner';

interface UserDashboardProps {
    setActiveTab: (tab: string) => void;
}

export function UserDashboard({ setActiveTab }: UserDashboardProps) {

    return (
        <div className="space-y-8">
            <HeroBanner onCTAClick={() => setActiveTab('booking')} />
            
            <div className="container mx-auto px-4 space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold">Welcome, User!</h1>
                    <p className="text-muted-foreground">Ready to power up your next project?</p>
                </div>

                <div className="text-center">
                     <Button size="lg" className="h-12" onClick={() => setActiveTab('booking')}>
                        <Power className="mr-2 h-5 w-5" />
                        Book New Generator
                    </Button>
                </div>

                <div className="text-center">
                    <Button variant="link" onClick={() => setActiveTab('history')}>
                        <Calendar className="mr-2 h-4 w-4" />
                        View Booking History
                    </Button>
                </div>
            </div>
        </div>
    );
}
