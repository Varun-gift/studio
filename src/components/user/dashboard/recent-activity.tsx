
'use client';

import * as React from 'react';
import { useBookings } from '@/hooks/use-bookings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Calendar, Power, RefreshCw, BadgeCheck, BadgeX, BadgeHelp } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

interface RecentActivityProps {
    onCTAClick: () => void;
}

const getStatusInfo = (status: string) => {
    switch (status) {
        case 'Approved':
            return { icon: BadgeCheck, color: 'bg-green-500', label: 'Approved' };
        case 'Pending':
            return { icon: BadgeHelp, color: 'bg-orange-500', label: 'Pending' };
        case 'Completed':
             return { icon: BadgeCheck, color: 'bg-blue-500', label: 'Completed' };
        default:
            return { icon: BadgeX, color: 'bg-red-500', label: status };
    }
}


export function RecentActivity({ onCTAClick }: RecentActivityProps) {
    const { bookings, loading } = useBookings({});
    const recentBooking = bookings.length > 0 ? bookings[0] : null;

    const formatUsageHours = (usageHours: number | number[]) => {
        if (Array.isArray(usageHours)) {
            return usageHours.join(', ');
        }
        return usageHours;
    }
    
    const StatusBadge = ({ status }: { status: string }) => {
        const { icon: Icon, color, label } = getStatusInfo(status);
        return (
            <Badge className={`text-white ${color}`}>
                <Icon className="h-4 w-4 mr-2" />
                {label}
            </Badge>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-3xl font-bold text-center">Your Last Booking</h2>
            <Card className="shadow-lg rounded-2xl bg-card overflow-hidden">
                <CardHeader>
                    {loading ? (
                       <Skeleton className="h-6 w-3/4" />
                    ) : !recentBooking ? (
                        <CardTitle className="text-muted-foreground">You haven't made any bookings yet.</CardTitle>
                    ) : (
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-muted-foreground" />
                                <span className="font-semibold">{format(recentBooking.bookingDate, 'PPP')}</span>
                            </div>
                            <StatusBadge status={recentBooking.status} />
                        </div>
                    )}
                </CardHeader>
                {loading ? (
                    <CardContent className="space-y-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                ) : recentBooking && (
                    <CardContent className="space-y-6">
                        <div className="space-y-3">
                            {recentBooking.generators.map((gen, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-background rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-primary/10 p-2 rounded-full">
                                            <Power className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">{gen.quantity} x {gen.kvaCategory} KVA</p>
                                            <p className="text-xs text-muted-foreground">{formatUsageHours(gen.usageHours)} hours per unit</p>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="ghost" className="text-primary">
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Rebook
                                    </Button>
                                </div>
                            ))}
                        </ul>
                    </CardContent>
                )}
                 <CardContent>
                    <div className="text-center">
                        <Button variant="link" onClick={onCTAClick} className="text-muted-foreground hover:text-primary">
                            <Calendar className="mr-2 h-4 w-4" />
                            View All Rentals
                            <span className="sr-only">. See your rental journey</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
