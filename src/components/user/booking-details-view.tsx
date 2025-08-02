
'use client';

import React from 'react';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, User, Phone, MapPin, Package, Timer, Truck, UserCheck, BadgeIndianRupee, FileText, CheckCircle } from 'lucide-react';
import type { Booking } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getStatusVariant } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

import { Progress } from '@/components/ui/progress';
// ... (rest of the existing code)
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

const TimelineItem = ({ label, time, isActual = false }: { label: string; time: Date | null; isActual?: boolean }) => {
    if (!time) return null;
    return (
        <div className="flex flex-col items-start gap-1">
            <p className={`text-xs font-semibold ${isActual ? 'text-primary' : 'text-muted-foreground'}`}>{label}</p>
            <p className={`text-sm ${isActual ? 'font-medium' : 'text-foreground'}`}>{format(time, 'MMM dd, p')}</p>
        </div>
    );
};

const TimelineView = ({ booking }: { booking: Booking }) => {
    const { bookingDate, estimatedEndTime, runtime_stats } = booking;

    const actualStartTime = runtime_stats?.Engine_ON_hours?.find(log => log.Status === 'ON')?.Timestamp;
    const actualEndTime = runtime_stats?.Engine_ON_hours?.find(log => log.Status === 'OFF')?.Timestamp; // Assuming the last OFF time is the end

    const totalRuntimeSeconds = runtime_stats?.Engine_ON_hours?.reduce((total, log, index, arr) => {
        if (log.Status === 'ON' && arr[index + 1]?.Status === 'OFF') {
            const startTime = new Date(log.Timestamp);
            const endTime = new Date(arr[index + 1].Timestamp);
            return total + (endTime.getTime() - startTime.getTime()) / 1000;
        }
        return total;
    }, 0) || 0;
    const formatTotalRuntime = (seconds: number) => {
        if (!seconds || seconds <= 0) return '0s';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return [
            hours > 0 ? `${hours}h` : '',
            minutes > 0 ? `${minutes}m` : '',
        ].filter(Boolean).join(' ');
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Rental Timeline & Runtime</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-4 overflow-x-auto pb-2">
                    <TimelineItem label="Booking Start" time={bookingDate} />
                    {actualStartTime && <TimelineItem label="Engine Start (Actual)" time={new Date(actualStartTime)} isActual />}
                    {actualEndTime && <TimelineItem label="Engine Stop (Actual)" time={new Date(actualEndTime)} isActual />}
                    {estimatedEndTime && <TimelineItem label="Booking End (Est.)" time={estimatedEndTime} />}
                </div>
                <Separator/>
                <DetailItem icon={Timer} label="Total Engine Runtime">
                    <p className="text-lg font-semibold">{formatTotalRuntime(totalRuntimeSeconds)}</p>
                </DetailItem>
            </CardContent>
        </Card>
    );
};

const BookingProgressBar = ({ booking, currentRuntime }: { booking: Booking, currentRuntime: any }) => {
    const stages = ['Request Received', 'Approved', 'Generator ON'];
    const currentStageIndex = (() => {
        if (currentRuntime?.Current_Status === 'ON') return 2;
        if (booking.status === 'Approved' || booking.status === 'Active') return 1;
        if (booking.status !== 'Pending') return 0;
        return -1;
    })();

    const progressValue = ((currentStageIndex + 1) / stages.length) * 100;

    return (
        <Card>
            <CardHeader><CardTitle>Booking Progress</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                    {stages.map((stage, index) => (
                        <React.Fragment key={stage}>
                            <div className={`flex items-center gap-1 ${index <= currentStageIndex ? 'text-primary' : ''}`}>
                                <CheckCircle className={`h-4 w-4 ${index <= currentStageIndex ? 'fill-primary text-primary-foreground' : 'text-muted-foreground'}`} />
                                <span>{stage}</span>
                            </div>
                            {index < stages.length - 1 && (
                                <Separator orientation="vertical" className="h-4" />
                            )}
                        </React.Fragment>
                    ))}
                </div>
                <Progress value={progressValue} className="w-full" />
            </CardContent>
        </Card>
    );
};
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
        timers, // Ensure timers is included in the destructuring
        currentRuntime, // Ensure currentRuntime is included
        runtime_stats
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

                {/* Timeline View */}
                <TimelineView booking={booking} />
                {additionalNotes && (

                    <>
                        <Separator/>
                        <DetailItem icon={FileText} label="Additional Notes" value={additionalNotes}/>
                    </>
                )}
            </CardContent>
        </Card>

        {/* Booking Progress Bar */}
        <BookingProgressBar booking={booking} currentRuntime={currentRuntime} />
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
