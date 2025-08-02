
'use client';

import * as React from 'react';
import { useBookings } from '@/hooks/use-bookings';
import { Button } from '../ui/button';
import { Power, Phone, FileText, Repeat, XCircle, ArrowRight, Plus } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { format } from 'date-fns';
import Image from 'next/image';
import { Card, CardContent } from '../ui/card';

interface DashboardCardsProps {
    setActiveTab: (tab: string) => void;
}

export function DashboardCards({ setActiveTab }: DashboardCardsProps) {
    const { bookings, loading } = useBookings({ status: null });

    const activeRental = React.useMemo(() => {
        return bookings.find(b => ['Active', 'Approved'].includes(b.status));
    }, [bookings]);

    const lastQuote = React.useMemo(() => {
        return bookings?.[0]; // The hook sorts by most recent
    }, [bookings]);

    if (loading) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        );
    }
    
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-xl font-bold mb-4">Active Rentals</h2>
                <Card>
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div className="flex-1">
                            {activeRental ? (
                                <>
                                    <p className="text-sm text-muted-foreground">Ongoing Rental</p>
                                    <p className="font-semibold">{activeRental.generators.map(g => `1x ${g.kvaCategory}KVA`).join(', ')}</p>
                                    <p className="text-xs text-muted-foreground">Booking ID: {activeRental.id.substring(0, 6)}</p>
                                    <Button variant="ghost" size="sm" className="px-0 h-auto text-primary" onClick={() => setActiveTab('history')}>
                                        View Details <ArrowRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground">No active rentals.</p>
                            )}
                        </div>
                        <div className="relative h-20 w-20 rounded-md overflow-hidden">
                             <Image 
                                src={activeRental ? 'https://i.ibb.co/6yVw4z9/image.png' : 'https://placehold.co/100x100.png'} 
                                alt="Active Rental" 
                                fill
                                className="object-cover"
                                data-ai-hint="generator"
                            />
                        </div>
                    </CardContent>
                </Card>
                <button onClick={() => setActiveTab('history')} className="text-sm text-muted-foreground mt-2 hover:underline">View All Rentals</button>
            </div>
            
             <div>
                <h2 className="text-xl font-bold mb-4">Last Quote</h2>
                <Card>
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div className="flex-1">
                            {lastQuote ? (
                                <>
                                    <p className="text-sm text-muted-foreground">Quote Amount</p>
                                    <p className="text-2xl font-bold">₹{lastQuote.estimatedCost.toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground">Date: {format(lastQuote.createdAt as Date, 'yyyy-MM-dd')}</p>
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground">No quotes yet.</p>
                            )}
                        </div>
                        <div className="relative h-20 w-20 rounded-md overflow-hidden">
                           <Image 
                                src={lastQuote ? 'https://i.ibb.co/rfnf20M/image.png' : 'https://placehold.co/100x100.png'} 
                                alt="Last Quote Generator" 
                                fill
                                className="object-cover"
                                data-ai-hint="generator"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div>
                <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="secondary" className="w-full h-12" onClick={() => setActiveTab('history')}>Renew/Rebook</Button>
                        <Button variant="secondary" className="w-full h-12" disabled>Cancel Booking</Button>
                    </div>
                    <Button variant="secondary" className="w-full h-12" onClick={() => setActiveTab('support')}>Contact Support</Button>
                </div>
            </div>
        </div>
    );
}
