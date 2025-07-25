
'use client';

import * as React from 'react';
import { format, formatDistanceStrict } from 'date-fns';
import { ArrowLeft, Calendar, User, Phone, MapPin, Hash, Package, Power, Clock, MoreVertical, Truck, Timer as TimerIcon } from 'lucide-react';
import type { Booking, TimerLog } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getStatusVariant } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface BookingDetailsProps {
  booking: Booking;
  onBack: () => void;
}

export function BookingDetails({ booking, onBack }: BookingDetailsProps) {

  const formatDuration = (seconds: number) => {
    if (!seconds) return 'N/A';
    return formatDistanceStrict(new Date(0), new Date(seconds * 1000));
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
            <CardContent className="grid gap-6 sm:grid-cols-2">
                <DetailItem icon={Calendar} label="Booking Date" value={format(booking.bookingDate, 'PPP')} />
                <DetailItem icon={MapPin} label="Location" value={booking.location} />
                <DetailItem icon={Package} label="Generator Type" value={`${booking.generatorType} (${booking.kvaCategory} KVA)`} />
                <DetailItem icon={Hash} label="Quantity" value={booking.quantity} />
                <DetailItem icon={Clock} label="Usage Hours" value={`${booking.usageHours} hrs`} />
                <DetailItem icon={Power} label="Estimated Cost" value={`₹${booking.estimatedCost.toLocaleString()}`} />
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

        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Timer Logs</CardTitle>
                <CardDescription>Real-time usage tracking for each generator.</CardDescription>
            </CardHeader>
            <CardContent>
                {booking.timers && booking.timers.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Generator ID</TableHead>
                                <TableHead>Start Time</TableHead>
                                <TableHead>End Time</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {booking.timers.map(timer => (
                                <TableRow key={timer.id}>
                                    <TableCell>{timer.generatorId}</TableCell>
                                    <TableCell>{timer.startTime ? format(timer.startTime, 'PPpp') : 'N/A'}</TableCell>
                                    <TableCell>{timer.endTime ? format(timer.endTime, 'PPpp') : 'N/A'}</TableCell>
                                    <TableCell>{formatDuration(timer.duration || 0)}</TableCell>
                                    <TableCell><Badge variant={timer.status === 'running' ? 'success' : 'outline'}>{timer.status}</Badge></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No timer logs available for this booking.</p>
                )}
            </CardContent>
        </Card>

      </div>
    </div>
  );
}
