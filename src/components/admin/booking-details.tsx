
'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, User, Phone, MapPin, Package, BadgeIndianRupee, Cpu, Truck, Clock, Wrench, FileText } from 'lucide-react';
import type { Booking, BookedGenerator } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getStatusVariant, cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ADDONS_DATA } from '@/lib/addons';

interface BookingDetailsProps {
  booking: Booking;
  onBack: () => void;
}

export function BookingDetails({ booking, onBack }: BookingDetailsProps) {

  const calculateTotalRuntime = (gen: BookedGenerator): string => {
      const timers = gen.timers || [];
      if (timers.length === 0) return gen.runtimeHoursFleetop || '0h 0m'; // Use final if available
      
      const isActive = gen.status === 'Active';

      const totalMilliseconds = timers.reduce((acc, timer) => {
          const startTime = timer.startTime instanceof Date ? timer.startTime : new Date((timer.startTime as any).seconds * 1000);
          // If the timer is active, calculate up to the current time. Otherwise, use its end time.
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

  const DetailItem = ({ icon: Icon, label, value, className }: { icon: React.ElementType, label: string, value: React.ReactNode, className?: string }) => (
    <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 text-muted-foreground mt-1" />
        <div className={cn("flex-1", className)}>
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
            <DetailItem icon={Phone} label="Contact" value={booking.phone || booking.userEmail} />
          </CardContent>
        </Card>
        
        <div className="lg:col-span-3">
            <Card>
                <CardHeader>
                    <CardTitle>Generator Jobs</CardTitle>
                    <CardDescription>Status and details for each assigned generator.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {booking.generators.map(gen => (
                        <Card key={`${booking.id}-${gen.id}`} className="p-4">
                           <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-lg">{gen.kvaCategory} KVA</p>
                                    <p className="text-xs text-muted-foreground">ID: {gen.id}</p>
                                </div>
                                <Badge variant={getStatusVariant(gen.status, true) as any}>{gen.status}</Badge>
                           </div>
                           <Separator className="my-4" />
                           <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {gen.driverInfo && gen.vehicleInfo ? (
                                    <>
                                        <DetailItem icon={User} label="Driver" value={gen.driverInfo.name}/>
                                        <DetailItem icon={Truck} label="Vehicle" value={`${gen.vehicleInfo.vehicleName} (${gen.vehicleInfo.plateNumber})`} />
                                        <DetailItem icon={Cpu} label="IMEI" value={gen.vehicleInfo.imeiNumber} />
                                    </>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Unassigned</p>
                                )}
                           </div>
                           <Separator className="my-4" />
                           <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                               <DetailItem icon={Clock} label="Total Runtime" value={calculateTotalRuntime(gen)} className={cn(gen.status === 'Paused' && 'opacity-60')} />
                           </div>
                        </Card>
                    ))}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
