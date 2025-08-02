
'use client';

import * as React from 'react';
import { DashboardCards } from './dashboard-cards';
import { RecommendedForYou } from './recommended-for-you';
import { useAuth } from '@/hooks/use-auth';
import { useBookings } from '@/hooks/use-bookings';
import { HeroBanner } from './hero-banner';
import { Button } from '../ui/button';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, CircleDashed } from 'lucide-react';
import { Separator } from '../ui/separator';

interface UserDashboardProps {
    setActiveTab: (tab: string) => void;
}

export function UserDashboard({ setActiveTab }: UserDashboardProps) {
    const { name } = useAuth();
    const { bookings, loading, error } = useBookings();
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

                {/* Booking History Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Booking History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <p>Loading bookings...</p>
                        ) : error ? (
                            <p>Error loading bookings: {error.message}</p>
                        ) : bookings && bookings.length > 0 ? (
                            <div className="space-y-4">
                                {bookings.map((booking) => (
                                    <div key={booking.id} className="border p-4 rounded-md space-y-2">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-lg font-semibold">{booking.generators.map(g => `${g.quantity}x ${g.kvaCategory}KVA`).join(', ')}</h3>
                                            {booking.runtime_stats ? (
                                                booking.runtime_stats.Current_Status === 'ON' ? (
                                                    <Badge variant="default" className="bg-green-500 hover:bg-green-500/90">
                                                        <CheckCircle2 className="mr-1 h-4 w-4" /> ON
                                                    </Badge>
                                                ) : booking.runtime_stats.Current_Status === 'OFF' ? (
                                                    <Badge variant="secondary" className="bg-red-500 hover:bg-red-500/90 text-white">
                                                        <XCircle className="mr-1 h-4 w-4" /> OFF
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline">
                                                        <CircleDashed className="mr-1 h-4 w-4" /> Unknown
                                                    </Badge>
                                                )
                                            ) : (
                                                <Badge variant="outline" className="bg-yellow-500/20 text-yellow-700">
                                                    <CircleDashed className="mr-1 h-4 w-4" /> Awaiting Sync
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm text-muted-foreground">Booking ID: {booking.id}</p>
                                        </div>
                                        <p className="text-sm">Dates: {format(booking.bookingDate, 'MMM dd, yyyy')}</p>
                                        {booking.driverInfo && (
                                             <p className="text-sm">Driver: {booking.driverInfo.name}</p>
                                        )}
                                        {booking.runtime_stats && (
                                            <div className="text-sm">Runtime Stats: Engine ON Hours - {booking.runtime_stats.Engine_ON_hours || 'N/A'}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>No booking history found.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
