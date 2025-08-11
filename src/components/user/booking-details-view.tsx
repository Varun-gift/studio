

'use client';

import React from 'react';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, User, Phone, MapPin, Package, Truck, BadgeIndianRupee, FileText, Cpu, Car, Clock, Wrench, Pause } from 'lucide-react';
import type { Booking } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getStatusVariant } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { ADDONS_DATA } from '@/lib/addons';


interface BookingDetailsViewProps {
  booking: Booking;
  onBack: () => void;
}

const DetailItem = ({ icon: Icon, label, value, children }: { icon: React.ElementType, label: string, value?: React.ReactNode, children?: React.ReactNode }) => (
    <div className="flex items-start gap-4">
        <Icon className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
        <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{label}</p>
            {value && <p className="text-muted-foreground">{value}</p>}
            {children}
        </div>
    </div>
);


export function BookingDetailsView({ booking, onBack }: BookingDetailsViewProps) {
    const { toast } = useToast();
    const [isLoadingData, setIsLoadingData] = React.useState(false);
    const [liveHours, setLiveHours] = React.useState<string | null>(null);
    
    const {
        id,
        bookingDate,
        createdAt,
        status,
        location,
        estimatedCost,
        generators,
        addons,
        driverInfo,
        vehicleInfo,
        additionalNotes,
        runtimeHoursFleetop,
        isPaused,
    } = booking;

    const formatGeneratorDetails = (gen: Booking['generators'][0]) => {
        const baseHours = 5;
        const additional = gen.additionalHours || 0;
        const totalHours = baseHours + additional;
        return `Usage: ${totalHours} hours (5 base + ${additional} additional)`;
    };
    
    const fetchLiveEngineHours = async () => {
        if (!vehicleInfo?.imeiNumber) {
            toast({ title: "IMEI not found", description: "No vehicle assigned to this booking.", variant: "destructive"});
            return;
        }

        if (!booking.timers || booking.timers.length === 0) {
            toast({ title: "Error", description: "Duty has not started yet.", variant: "destructive"});
            return;
        }

        setIsLoadingData(true);
        setLiveHours(null);
        try {
            const res = await fetch('/api/fleetop/hours', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    imei: vehicleInfo.imeiNumber,
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
            setIsLoadingData(false);
        }
    };
    
    const getAddonName = (addonId: string) => {
      return ADDONS_DATA.find(a => a.id === addonId)?.name || 'Unknown Item';
    }


  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
                <h1 className="text-2xl font-bold">Booking Details</h1>
                <p className="text-xs text-muted-foreground">ID: {id}</p>
            </div>
        </div>

        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Booking Summary</CardTitle>
                        <CardDescription>
                            Booked on {createdAt ? format(createdAt as Date, 'PPP') : 'N/A'}
                        </CardDescription>
                    </div>
                     <div className="flex items-center gap-2">
                        {status === 'Active' && isPaused && (
                           <Badge variant="secondary"><Pause className="h-3 w-3 mr-1" />Paused</Badge>
                        )}
                        <Badge variant={getStatusVariant(status)}>{status}</Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <DetailItem icon={Calendar} label="Setup Date" value={format(bookingDate, 'PPP')} />
                <Separator/>
                <DetailItem icon={MapPin} label="Location" value={location} />
                <Separator/>
                <DetailItem icon={BadgeIndianRupee} label="Estimated Cost" value={`₹${estimatedCost.toLocaleString()}`} />
                {additionalNotes && <><Separator/><DetailItem icon={FileText} label="Additional Notes" value={additionalNotes}/></>}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Items Requested</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <DetailItem icon={Package} label="Generators">
                     <div className="text-sm text-muted-foreground space-y-2 pt-2">
                         {generators.map((gen, index) => (
                            <div key={index}>
                                <p>1 x {gen.kvaCategory} KVA</p>
                                <p className="text-xs">{formatGeneratorDetails(gen)}</p>
                            </div>
                        ))}
                    </div>
                </DetailItem>
                {addons && addons.length > 0 && (
                    <>
                        <Separator/>
                        <DetailItem icon={Wrench} label="Add-ons">
                            <div className="text-sm text-muted-foreground space-y-2 pt-2">
                                {addons.map((addon, index) => (
                                    <p key={index}>{addon.quantity} x {getAddonName(addon.addonId)}</p>
                                ))}
                            </div>
                        </DetailItem>
                    </>
                )}
            </CardContent>
        </Card>
        
        {driverInfo && (
            <Card>
                <CardHeader><CardTitle>Assigned Team</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                     <DetailItem icon={Truck} label="Assigned Driver" value={driverInfo.name} />
                     <Separator/>
                     <DetailItem icon={Phone} label="Driver Contact" value={driverInfo.contact} />
                </CardContent>
            </Card>
        )}

        {vehicleInfo && (
             <Card>
                <CardHeader><CardTitle>Assigned Vehicle</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                     <DetailItem icon={Car} label="Vehicle" value={vehicleInfo.vehicleName} />
                     <Separator/>
                     <DetailItem icon={Car} label="Plate Number" value={vehicleInfo.plateNumber} />
                      <Separator/>
                     <DetailItem icon={Cpu} label="IMEI" value={vehicleInfo.imeiNumber} />
                </CardContent>
            </Card>
        )}
        
         <Card>
            <CardHeader>
                <CardTitle>Duty & Runtime</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <DetailItem icon={Clock} label="Final Runtime (from Fleetop)" value={runtimeHoursFleetop} />
                 {liveHours && (
                     <DetailItem icon={Cpu} label="Live Engine Hours (from Fleetop)" value={liveHours} />
                 )}
            </CardContent>
            {['Active', 'Completed'].includes(status) && (
                 <CardFooter>
                    <Button onClick={fetchLiveEngineHours} disabled={isLoadingData || !vehicleInfo}>
                        {isLoadingData ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Cpu className="mr-2 h-4 w-4" />}
                        Fetch Live Engine Hours
                    </Button>
                </CardFooter>
            )}
        </Card>
    </div>
  );
}
