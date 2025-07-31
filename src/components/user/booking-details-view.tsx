
'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, User, Phone, MapPin, Package, Timer, Truck, UserCheck, BadgeIndianRupee, FileText } from 'lucide-react';
import type { Booking } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getStatusVariant } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

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
    const {
        id,
        bookingDate,
        createdAt,
        status,
        location,
        estimatedCost,
        generators,
        driverInfo,
        additionalNotes,
        timers
    } = booking;

    const formatGeneratorDetails = (gen: Booking['generators'][0]) => {
        const baseHours = 5;
        const additional = gen.additionalHours || 0;
        const totalHours = baseHours + additional;
        return `Usage: ${totalHours} hours (5 base + ${additional} additional)`;
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
                {additionalNotes && (
                    <>
                        <Separator/>
                        <DetailItem icon={FileText} label="Additional Notes" value={additionalNotes}/>
                    </>
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Generators</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {generators.map((gen, index) => (
                    <DetailItem key={index} icon={Package} label={`${gen.quantity} x ${gen.kvaCategory} KVA`}>
                        <p className="text-xs text-muted-foreground">
                             {formatGeneratorDetails(gen)}
                        </p>
                    </DetailItem>
                ))}
            </CardContent>
        </Card>
        
        {driverInfo && (
            <Card>
                <CardHeader><CardTitle>Driver & Team</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                     <DetailItem icon={Truck} label="Assigned Driver" value={driverInfo.name} />
                     <Separator/>
                     <DetailItem icon={Phone} label="Driver Contact" value={driverInfo.contact} />
                     {driverInfo.electricianName && (
                        <>
                            <Separator/>
                            <DetailItem icon={UserCheck} label="Electrician" value={driverInfo.electricianName}/>
                            {driverInfo.electricianContact && <DetailItem icon={Phone} label="Electrician Contact" value={driverInfo.electricianContact}/>}
                        </>
                     )}
                </CardContent>
            </Card>
        )}
        
        {timers && timers.length > 0 && (
            <Card>
                <CardHeader><CardTitle>Usage Logs</CardTitle></CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    {timers.map(timer => (
                        <TimerLogCard key={timer.id} timer={timer} />
                    ))}
                </CardContent>
            </Card>
        )}

    </div>
  );
}

    