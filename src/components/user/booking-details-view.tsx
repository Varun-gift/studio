
'use client';

import React from 'react';
import { format, addDays } from 'date-fns';
import { ArrowLeft, Calendar, User, Phone, MapPin, Package, Timer, Truck, UserCheck, BadgeIndianRupee, FileText, Cpu, Car } from 'lucide-react';
import type { Booking } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getStatusVariant } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

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

const TimerLogCard = ({ timer }: { timer: NonNullable<Booking['timers']>[0] }) => {
    const formatDuration = (seconds: number) => {
        if (!seconds || seconds <= 0) return '0s';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return [
            hours > 0 ? `${hours}h` : '',
            minutes > 0 ? `${minutes}m` : '',
            secs > 0 ? `${secs}s` : '',
        ].filter(Boolean).join(' ');
    };

    return (
        <div className="p-3 rounded-lg bg-muted/50 space-y-2">
            <p className="font-semibold text-sm">{timer.generatorId}</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                    <p className="text-muted-foreground">Start</p>
                    <p>{timer.startTime ? format(timer.startTime, 'p') : 'N/A'}</p>
                </div>
                <div>
                    <p className="text-muted-foreground">End</p>
                    <p>{timer.endTime ? format(timer.endTime, 'p') : 'N/A'}</p>
                </div>
                 <div className="col-span-2">
                    <p className="text-muted-foreground">Duration</p>
                    <p className="font-mono">{formatDuration(timer.duration || 0)}</p>
                </div>
            </div>
        </div>
    )
}

export function BookingDetailsView({ booking, onBack }: BookingDetailsViewProps) {
    const { toast } = useToast();
    const [ignitionData, setIgnitionData] = React.useState<any>(null);
    const [isLoadingData, setIsLoadingData] = React.useState(false);
    
    const {
        id,
        bookingDate,
        createdAt,
        status,
        location,
        estimatedCost,
        generators,
        driverInfo,
        vehicleInfo,
        additionalNotes,
        timers,
        dutyStartTime,
        dutyEndTime,
        runtimeHoursFleetop
    } = booking;

    const formatGeneratorDetails = (gen: Booking['generators'][0]) => {
        const baseHours = 5;
        const additional = gen.additionalHours || 0;
        const totalHours = baseHours + additional;
        return `Usage: ${totalHours} hours (5 base + ${additional} additional)`;
    };
    
    const fetchIgnitionData = async () => {
        const imeiNumber = vehicleInfo?.imeiNumber;
        if (!imeiNumber) {
            toast({
                title: "IMEI not found",
                description: "No vehicle with an IMEI number has been assigned to this booking.",
                variant: "destructive"
            });
            return;
        }

        setIsLoadingData(true);
        try {
            const startDate = new Date(bookingDate);
            const endDate = addDays(startDate, 1);

            const res = await fetch('/api/fleetop/ignition-summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  start_date_time: format(startDate, 'dd-MM-yyyy HH:mm:ss'),
                  end_date_time: format(endDate, 'dd-MM-yyyy HH:mm:ss'),
                  imei_nos: imeiNumber,
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to fetch ignition data.");
            }

            const data = await res.json();
            if (data.data && data.data.length > 0) {
                 setIgnitionData(data.data[0]);
                 toast({ title: "Success", description: "Runtime data fetched successfully."});
            } else {
                 setIgnitionData(null);
                 toast({ title: "No Data", description: "No runtime data found for the specified period."});
            }

        } catch (error: any) {
            console.error("Error fetching ignition data:", error);
            toast({
                title: "Error",
                description: error.message || "An unexpected error occurred.",
                variant: "destructive"
            });
        } finally {
            setIsLoadingData(false);
        }
    };


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
                            Booked on {format(createdAt as Date, 'PPP')}
                        </CardDescription>
                    </div>
                    <Badge variant={getStatusVariant(status)}>{status}</Badge>
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
                <CardTitle>Generators</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {generators.map((gen, index) => (
                    <DetailItem key={index} icon={Package} label={`1 x ${gen.kvaCategory} KVA`}>
                        <p className="text-xs text-muted-foreground">
                             {formatGeneratorDetails(gen)}
                        </p>
                    </DetailItem>
                ))}
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
                <DetailItem icon={Timer} label="Duty Start Time" value={dutyStartTime ? format(dutyStartTime, 'Pp') : 'Not started'} />
                <Separator />
                <DetailItem icon={Timer} label="Duty End Time" value={dutyEndTime ? format(dutyEndTime, 'Pp') : 'Not ended'} />
                <Separator />
                 <DetailItem icon={Cpu} label="Fleetop Runtime" value={runtimeHoursFleetop || 'Not fetched'} />
            </CardContent>
        </Card>

        {timers && timers.length > 0 && (
            <Card>
                <CardHeader><CardTitle>Manual Usage Logs</CardTitle></CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    {timers.map(timer => (
                        <TimerLogCard key={timer.id} timer={timer} />
                    ))}
                </CardContent>
            </Card>
        )}
        
        <Card>
            <CardHeader>
                <CardTitle>Fleetop Runtime Data</CardTitle>
                <CardDescription>Fetch live ignition data from the Fleetop API.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={fetchIgnitionData} disabled={isLoadingData || !vehicleInfo}>
                    {isLoadingData ? 'Loading...' : 'Fetch Runtime Data'}
                </Button>
                {ignitionData && (
                    <div className="mt-4 space-y-2 text-sm">
                        <p><span className="font-semibold">Distance:</span> {ignitionData.distance} km</p>
                        <p><span className="font-semibold">Average Speed:</span> {ignitionData.avg_speed} km/h</p>
                        <p><span className="font-semibold">Stop Duration:</span> {ignitionData.stop_duration}</p>
                        <p><span className="font-semibold">Idle Duration:</span> {ignitionData.idle_duration}</p>
                        <p><span className="font-semibold">Run Duration:</span> {ignitionData.run_duration}</p>
                        <p><span className="font-semibold">Inactive Duration:</span> {ignitionData.inactive_duration}</p>
                    </div>
                )}
            </CardContent>
        </Card>

    </div>
  );
}
