
'use client';

import React from 'react';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, User, Phone, MapPin, Package, Truck, BadgeIndianRupee, FileText, Cpu, Car, Clock, Wrench, Pause } from 'lucide-react';
import type { Booking, BookedGenerator } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getStatusVariant } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
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
    const {
        id,
        bookingDate,
        createdAt,
        status,
        location,
        estimatedCost,
        generators,
        addons,
        additionalNotes,
    } = booking;

    const calculateTotalRuntime = (gen: BookedGenerator): string => {
        const timers = gen.timers || [];
        if (timers.length === 0) return gen.runtimeHoursFleetop || '0h 0m';
        
        const isActive = gen.status === 'Active';

        const totalMilliseconds = timers.reduce((acc, timer) => {
            const startTime = timer.startTime instanceof Date ? timer.startTime : new Date((timer.startTime as any).seconds * 1000);
            const endTime = !timer.endTime 
              ? (isActive ? new Date() : startTime) 
              : (timer.endTime instanceof Date ? timer.endTime : new Date((timer.endTime as any).seconds * 1000));
            
            if (startTime) {
                 return acc + (endTime.getTime() - startTime.getTime());
            }
            return acc;
        }, 0);
        
        if (totalMilliseconds <= 0 && gen.runtimeHoursFleetop) return gen.runtimeHoursFleetop;
        if (totalMilliseconds <= 0) return '0h 0m';

        const totalSeconds = Math.floor(totalMilliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);

        return `${hours}h ${minutes}m`;
    }

    const formatGeneratorDetails = (gen: BookedGenerator) => {
        const baseHours = 5;
        const additional = gen.additionalHours || 0;
        const totalHours = baseHours + additional;
        return `Usage: ${totalHours} hours (5 base + ${additional} additional)`;
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
                <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {generators.map((gen, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold">{gen.kvaCategory} KVA Generator</p>
                                <p className="text-sm text-muted-foreground">{formatGeneratorDetails(gen)}</p>
                            </div>
                            <Badge variant={getStatusVariant(gen.status, true) as any}>{gen.status}</Badge>
                        </div>
                        <Separator className="my-3"/>
                        <div className="space-y-3">
                             {gen.driverInfo && (
                                <DetailItem icon={User} label="Assigned Driver" value={gen.driverInfo.name} />
                             )}
                             {gen.vehicleInfo && (
                                 <DetailItem icon={Truck} label="Assigned Vehicle" value={`${gen.vehicleInfo.vehicleName} (${gen.vehicleInfo.plateNumber})`} />
                             )}
                             {gen.status === 'Completed' ? (
                                <DetailItem icon={Clock} label="Final Runtime" value={gen.runtimeHoursFleetop} />
                             ) : ['Active', 'Paused'].includes(gen.status) && (
                                <DetailItem icon={Clock} label="Current Runtime" value={calculateTotalRuntime(gen)} />
                             )}
                        </div>
                    </div>
                ))}

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
    </div>
  );
}
