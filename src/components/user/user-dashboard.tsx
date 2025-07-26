
'use client';

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useBookings } from '@/hooks/use-bookings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Package, Power } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';
import { getStatusVariant } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';

interface UserDashboardProps {
    setActiveTab: (tab: string) => void;
}

export function UserDashboard({ setActiveTab }: UserDashboardProps) {
    const { name } = useAuth();
    const { bookings, loading } = useBookings({});
    
    const recentBooking = bookings.length > 0 ? bookings[0] : null;

    const formatUsageHours = (usageHours: number | number[]) => {
        if (Array.isArray(usageHours)) {
            return usageHours.join(', ');
        }
        return usageHours;
    }

    return (
        <div className="space-y-8 py-4">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Welcome, {name ? name.split(' ')[0] : 'User'}!</h1>
                <p className="text-muted-foreground">Ready to power your next project? Let's get started.</p>
            </div>

            <Button size="lg" className="h-12 text-lg w-full sm:w-auto" onClick={() => setActiveTab('booking')}>
                <Power className="mr-2 h-5 w-5" />
                Book New Generator
            </Button>
            
            <div className="space-y-4">
                <h2 className="text-2xl font-semibold">Recent Activity</h2>
                <Card>
                    <CardHeader>
                        <CardTitle>Your Most Recent Booking</CardTitle>
                        <CardDescription>
                            {loading ? "Loading booking details..." : !recentBooking ? "You haven't made any bookings yet." : "Here are the details of your latest rental."}
                        </CardDescription>
                    </CardHeader>
                    {loading ? (
                        <CardContent>
                            <Skeleton className="h-8 w-3/4" />
                            <Skeleton className="h-4 w-1/2 mt-2" />
                        </CardContent>
                    ) : recentBooking && (
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-x-8 gap-y-4 justify-between items-center">
                                <div>
                                    <p className="text-sm text-muted-foreground">Booking Date</p>
                                    <p className="font-semibold">{format(recentBooking.bookingDate, 'PPP')}</p>
                                </div>
                                <Badge variant={getStatusVariant(recentBooking.status)} className="text-sm">{recentBooking.status}</Badge>
                            </div>
                            <div className="space-y-2 pt-4 border-t">
                                <h4 className="font-medium flex items-center gap-2"><Package className="h-5 w-5" /> Generators</h4>
                                <ul className="list-disc list-inside text-muted-foreground pl-2">
                                    {recentBooking.generators.map((gen, idx) => (
                                        <li key={idx} className="text-sm">{gen.quantity} x {gen.kvaCategory} KVA ({formatUsageHours(gen.usageHours)} hrs)</li>
                                    ))}
                                </ul>
                            </div>
                        </CardContent>
                    )}
                    <CardContent>
                        <Button variant="outline" onClick={() => setActiveTab('history')}>
                            View All Rentals
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
