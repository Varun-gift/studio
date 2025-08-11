

'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, User, Phone, MapPin, Package, BadgeIndianRupee, Cpu, Truck, Clock, Wrench, FileText } from 'lucide-react';
import type { Booking, Timer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getStatusVariant } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { ADDONS_DATA } from '@/lib/addons';

interface BookingDetailsProps {
  booking: Booking;
  onBack: () => void;
}

export function BookingDetails({ booking, onBack }: BookingDetailsProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);
    const [liveHours, setLiveHours] = React.useState<string | null>(null);

    const fetchLiveEngineHours = async () => {
        if (!booking.vehicleInfo?.imeiNumber) {
            toast({ title: "Error", description: "No IMEI number assigned to this booking.", variant: "destructive"});
            return;
        }
        if (!booking.timers || booking.timers.length === 0) {
            toast({ title: "Error", description: "Duty has not started yet.", variant: "destructive"});
            return;
        }

        setIsLoading(true);
        setLiveHours(null);
        try {
            const res = await fetch('/api/fleetop/hours', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    imei: booking.vehicleInfo.imeiNumber,
                    start: booking.timers[0].startTime.toISOString(),
                    end: new Date().toISOString()
                })
            });
             if (!res.ok) {
                const errorData = await res.json();
                const errorMessage = errorData.error === 'No ignition data' 
                    ? 'No ignition data from Fleetop for the active period.' 
                    : 'API request failed.';
                throw new Error(errorMessage);
            }
            const data = await res.json();
            const hours = data.engineOnHours || "N/A";
            setLiveHours(hours);
            toast({ title: "Live Engine Hours", description: `Current reading from Fleetop: ${hours}`});
        } catch(e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive"});
        } finally {
            setIsLoading(false);
        }
    };
    
    const calculateTotalRuntime = (timers: Timer[] = []): string => {
        const totalMilliseconds = timers.reduce((acc, timer) => {
            if (timer.startTime && timer.endTime) {
                return acc + (timer.endTime.getTime() - timer.startTime.getTime());
            }
            return acc;
        }, 0);
        
        if(totalMilliseconds === 0) return '0 minutes';

        const totalSeconds = Math.floor(totalMilliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);

        return `${hours}h ${minutes}m`;
    }

  const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: React.ReactNode }) => (
    <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 text-muted-foreground mt-1" />
        <div className="flex-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-medium">{value || 'N/A'}</p>
        </div>
    </div>
  );
  
  const getAddonName = (addonId: string) => {
      return ADDONS_DATA.find(a => a.id === addonId)?.name || 'Unknown Item';
  }

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
                <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={getStatusVariant(booking.status) as any}>{booking.status}</Badge>
                    {booking.status === 'Active' && booking.isPaused && (
                       <Badge variant="secondary">Paused</Badge>
                    )}
                    <span className="text-sm text-muted-foreground">
                        Booked on {booking.createdAt ? format(booking.createdAt as Date, 'PPP') : 'N/A'}
                    </span>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                    <DetailItem icon={Calendar} label="Booking Date" value={format(booking.bookingDate, 'PPP')} />
                    <DetailItem icon={MapPin} label="Location" value={booking.location} />
                    <DetailItem icon={BadgeIndianRupee} label="Estimated Cost" value={`₹${booking.estimatedCost.toLocaleString()}`} />
                     {booking.additionalNotes && <DetailItem icon={FileText} label="Additional Notes" value={booking.additionalNotes} />}
                </div>
                <Separator/>
                <div className="space-y-4">
                    <h4 className="font-semibold text-foreground flex items-center gap-2"><Package className="h-5 w-5"/> Generators Requested</h4>
                    <div className="space-y-2">
                    {booking.generators.map((genGroup, index) => (
                        <div key={index} className="flex justify-between items-start text-sm p-3 rounded-md bg-muted/50">
                           <p className="font-semibold">1 x {genGroup.kvaCategory} KVA</p>
                           <p className="text-xs text-muted-foreground">Addtl. Hours: {genGroup.additionalHours || 0}</p>
                        </div>
                    ))}
                    </div>
                </div>
                 {booking.addons && booking.addons.length > 0 && (
                     <>
                        <Separator/>
                        <div className="space-y-4">
                            <h4 className="font-semibold text-foreground flex items-center gap-2"><Wrench className="h-5 w-5"/> Add-ons Requested</h4>
                            <div className="space-y-2">
                                {booking.addons.map((addon, index) => (
                                    <div key={index} className="flex justify-between items-center text-sm p-3 rounded-md bg-muted/50">
                                        <p>{getAddonName(addon.addonId)}</p>
                                        <p className="text-muted-foreground">Qty: {addon.quantity}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                 )}
            </CardContent>
        </Card>

        <Card>
          <CardHeader> <CardTitle>Customer</CardTitle> </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
                <Avatar> <AvatarFallback>{booking.userName?.charAt(0) || 'U'}</AvatarFallback> </Avatar>
                <DetailItem icon={User} label="Name" value={booking.userName} />
            </div>
            <Separator />
            <DetailItem icon={Phone} label="Email" value={booking.userEmail} />
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader> <CardTitle>Driver & Vehicle</CardTitle> </CardHeader>
            <CardContent className="space-y-4">
                {booking.driverInfo ? ( <> <DetailItem icon={Truck} label="Driver Name" value={booking.driverInfo.name} /> <Separator /> <DetailItem icon={Phone} label="Driver Contact" value={booking.driverInfo.contact} /> </> ) : ( <p className="text-sm text-muted-foreground text-center py-4">No driver assigned.</p> )}
                {booking.vehicleInfo ? ( <> <Separator /> <DetailItem icon={Truck} label="Vehicle" value={`${booking.vehicleInfo.vehicleName} (${booking.vehicleInfo.plateNumber})`} /> </> ) : ( <p className="text-sm text-muted-foreground text-center py-4">No vehicle assigned.</p> )}
            </CardContent>
        </Card>

        <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Duty & Engine Hours</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <DetailItem icon={Clock} label="Calculated Runtime" value={calculateTotalRuntime(booking.timers)} />
                <DetailItem icon={Clock} label="Final Runtime (Fleetop)" value={booking.runtimeHoursFleetop} />
                 {liveHours && ( <DetailItem icon={Cpu} label="Live Engine Hours (from Fleetop)" value={liveHours} /> )}
            </CardContent>
            {['Active', 'Completed'].includes(booking.status) && (
                <CardFooter>
                    <Button onClick={fetchLiveEngineHours} disabled={isLoading}>
                         {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Fetch Live Engine Hours
                    </Button>
                </CardFooter>
            )}
        </Card>
      </div>
    </div>
  );
}
