

'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, User, Phone, MapPin, Hash, Power, Clock, Truck, Timer as TimerIcon, Package } from 'lucide-react';
import type { Booking } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getStatusVariant } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface BookingDetailsProps {
  booking: Booking;
  onBack: () => void;
  onViewTimers: () => void;
}

export function BookingDetails({ booking, onBack, onViewTimers }: BookingDetailsProps) {

  const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: React.ReactNode }) => (
    <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 text-muted-foreground mt-1" />
        <div className="flex-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-medium">{value || 'N/A'}</p>
        </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Booking Details</h1>
          <p className="text-muted-foreground">ID: {booking.id}</p>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Booking Information</CardTitle>
                <div className="flex items-center gap-2">
                    <Badge variant={getStatusVariant(booking.status) as any}>{booking.status}</Badge>
                    <span className="text-sm text-muted-foreground">
                        Booked on {format(booking.createdAt as Date, 'PPP')}
                    </span>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                    <DetailItem icon={Calendar} label="Booking Date" value={format(booking.bookingDate, 'PPP')} />
                    <DetailItem icon={MapPin} label="Location" value={booking.location} />
                    <DetailItem icon={Power} label="Estimated Cost" value={`₹${booking.estimatedCost.toLocaleString()}`} />
                </div>
                <div className="space-y-4">
                    <h4 className="font-semibold text-foreground">Generators Requested</h4>
                    <div className="space-y-2">
                    {booking.generators.map((gen, index) => (
                        <div key={index} className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/50">
                            <div className="flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                <span>{gen.kvaCategory} KVA</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-muted-foreground">Qty: 1</span>
                                <span className="text-muted-foreground">Usage: {gen.usageHours} hrs</span>
                            </div>
                        </div>
                    ))}
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
                <Avatar>
                    <AvatarFallback>{booking.userName.charAt(0)}</AvatarFallback>
                </Avatar>
                <DetailItem icon={User} label="Name" value={booking.userName} />
            </div>
            <Separator />
            <DetailItem icon={Phone} label="Email" value={booking.userEmail} />
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Driver Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {booking.driverInfo ? (
                    <>
                        <DetailItem icon={Truck} label="Driver Name" value={booking.driverInfo.name} />
                        <Separator />
                        <DetailItem icon={Phone} label="Contact" value={booking.driverInfo.contact} />
                        <DetailItem icon={User} label="Electrician" value={booking.driverInfo.electricianName} />
                        <DetailItem icon={Phone} label="Electrician Contact" value={booking.driverInfo.electricianContact} />
                    </>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No driver assigned yet.</p>
                )}
            </CardContent>
        </Card>

        <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle>Timer Logs</CardTitle>
                <CardDescription>Real-time usage tracking for each generator.</CardDescription>
            </CardHeader>
            <CardContent>
                {booking.timers && booking.timers.length > 0 ? (
                    <Button onClick={onViewTimers}>
                        <TimerIcon className="mr-2 h-4 w-4" />
                        View Timer Logs
                    </Button>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No timer logs available for this booking.</p>
                )}
            </CardContent>
        </Card>

      </div>
    </div>
  );
}
