

'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, User, Phone, MapPin, Hash, Power, Clock, Truck, Timer as TimerIcon, Package, BadgeIndianRupee, Cpu } from 'lucide-react';
import type { Booking } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getStatusVariant } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface BookingDetailsProps {
  booking: Booking;
  onBack: () => void;
  onViewTimers: () => void;
}

export function BookingDetails({ booking, onBack, onViewTimers }: BookingDetailsProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);
    const [liveHours, setLiveHours] = React.useState<string | null>(null);

    const fetchLiveEngineHours = async () => {
        if (!booking.vehicleInfo?.imeiNumber) {
            toast({ title: "Error", description: "No IMEI number assigned.", variant: "destructive"});
            return;
        }
        setIsLoading(true);
        setLiveHours(null);
        try {
            const res = await fetch('/api/fleetop/hours', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imei: booking.vehicleInfo.imeiNumber })
            });
            if (!res.ok) throw new Error("API request failed");
            const data = await res.json();
            setLiveHours(data.engineOnHours || "N/A");
            toast({ title: "Live Engine Hours", description: `Current reading: ${data.engineOnHours}`});
        } catch(e) {
            toast({ title: "Error", description: "Failed to fetch live hours.", variant: "destructive"});
        } finally {
            setIsLoading(false);
        }
    };

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
                    <DetailItem icon={BadgeIndianRupee} label="Estimated Cost" value={`₹${booking.estimatedCost.toLocaleString()}`} />
                </div>
                <div className="space-y-4">
                    <h4 className="font-semibold text-foreground">Generators Requested</h4>
                    <div className="space-y-2">
                    {booking.generators.map((genGroup, index) => (
                        <div key={index} className="flex justify-between items-start text-sm p-3 rounded-md bg-muted/50">
                            <div className="flex items-start gap-3">
                                <Package className="h-5 w-5 mt-1" />
                                <div>
                                    <p className="font-semibold">1 x {genGroup.kvaCategory} KVA</p>
                                    <p className="text-xs text-muted-foreground">
                                       Additional Hours: {genGroup.additionalHours || 0}
                                    </p>
                                </div>
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
                <CardTitle>Driver & Vehicle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {booking.driverInfo ? (
                    <>
                        <DetailItem icon={Truck} label="Driver Name" value={booking.driverInfo.name} />
                        <Separator />
                        <DetailItem icon={Phone} label="Driver Contact" value={booking.driverInfo.contact} />
                    </>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No driver assigned.</p>
                )}
                 {booking.vehicleInfo ? (
                    <>
                       <Separator />
                       <DetailItem icon={Truck} label="Vehicle" value={`${booking.vehicleInfo.vehicleName} (${booking.vehicleInfo.plateNumber})`} />
                    </>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No vehicle assigned.</p>
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle>Duty & Engine Hours</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <DetailItem icon={Clock} label="Engine Start Hours" value={booking.engineStartHours} />
                <DetailItem icon={Clock} label="Engine End Hours" value={booking.engineEndHours} />
                <DetailItem icon={Power} label="Final Engine Duration" value={booking.finalEngineDuration} />
                 {liveHours && (
                     <DetailItem icon={Cpu} label="Live Engine Hours" value={liveHours} />
                 )}
            </CardContent>
            {booking.status === 'Active' && (
                <CardFooter>
                    <Button onClick={fetchLiveEngineHours} disabled={isLoading}>
                         {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Fetch Live Engine Hours
                    </Button>
                </CardFooter>
            )}
        </Card>

        <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle>Manual Timer Logs</CardTitle>
                <CardDescription>Manual usage tracking for each generator.</CardDescription>
            </CardHeader>
            <CardContent>
                {booking.timers && booking.timers.length > 0 ? (
                    <Button onClick={onViewTimers}>
                        <TimerIcon className="mr-2 h-4 w-4" />
                        View Manual Timer Logs
                    </Button>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No manual timer logs available for this booking.</p>
                )}
            </CardContent>
        </Card>

      </div>
    </div>
  );
}

