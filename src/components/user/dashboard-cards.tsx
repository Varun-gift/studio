
'use client';

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useBookings } from '@/hooks/use-bookings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Power, Phone, FileText, Repeat, XCircle } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { format } from 'date-fns';

interface DashboardCardsProps {
    setActiveTab: (tab: string) => void;
}

export function DashboardCards({ setActiveTab }: DashboardCardsProps) {
    const { user } = useAuth();
    const { bookings, loading } = useBookings({ status: null });

    const activeRental = React.useMemo(() => {
        return bookings.find(b => ['Active', 'Approved'].includes(b.status));
    }, [bookings]);

    const lastQuote = React.useMemo(() => {
        return bookings?.[0]; // The hook sorts by most recent
    }, [bookings]);

    if (loading) {
        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
            </div>
        );
    }
    
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Power className="h-5 w-5 text-primary" />
                        Active Rentals
                    </CardTitle>
                    <CardDescription>Your most recent ongoing rental.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {activeRental ? (
                         <div>
                            <p className="font-semibold">{activeRental.generators.map(g => `${g.quantity}x ${g.kvaCategory}KVA`).join(', ')}</p>
                            <p className="text-sm text-muted-foreground">
                                Booked for: {format(activeRental.bookingDate, 'PPP')}
                            </p>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No active rentals at the moment.</p>
                    )}
                    <Button variant="outline" className="w-full" onClick={() => setActiveTab('history')}>View All Rentals</Button>
                </CardContent>
            </Card>

            <Card className="transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Last Quote
                    </CardTitle>
                    <CardDescription>Your most recently generated quote.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     {lastQuote ? (
                        <div>
                            <p className="text-2xl font-bold">₹{lastQuote.estimatedCost.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">
                                Quoted on: {format(lastQuote.createdAt as Date, 'PPP')}
                            </p>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No quotes generated yet.</p>
                    )}
                    <Button className="w-full" onClick={() => setActiveTab('booking')}>Request New Quote</Button>
                </CardContent>
            </Card>
            
            <Card className="transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Power className="h-5 w-5 text-primary" />
                        Quick Actions
                    </CardTitle>
                     <CardDescription>Need help or want to rebook?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setActiveTab('booking')}>
                        <Repeat /> Renew / Rebook
                    </Button>
                     <Button variant="outline" className="w-full justify-start gap-2" disabled>
                        <XCircle /> Cancel Booking
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setActiveTab('support')}>
                        <Phone /> Contact Support
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
