
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

import { useUsers } from '@/hooks/use-users';
import { useVehicles } from '@/hooks/use-vehicles';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Booking, User, Vehicle } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formSchema = z.object({
  driverId: z.string().min(1, 'Please select a driver.'),
  vehicleId: z.string().min(1, 'Please select a vehicle.'),
});

type FormValues = z.infer<typeof formSchema>;

interface AssignDriverDialogProps {
  booking: Booking;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function AssignDriverDialog({ booking, isOpen, onOpenChange }: AssignDriverDialogProps) {
  const { users, loading: driversLoading } = useUsers({ role: 'driver' });
  const { vehicles, loading: vehiclesLoading } = useVehicles({ status: 'active' });
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const drivers = users.filter(u => u.role === 'driver');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      driverId: booking.driverInfo?.driverId || '',
      vehicleId: booking.vehicleInfo?.vehicleId || '',
    },
  });
  
  React.useEffect(() => {
      form.reset({ 
          driverId: booking.driverInfo?.driverId || '',
          vehicleId: booking.vehicleInfo?.vehicleId || '',
      });
  }, [booking, form]);

  async function onSubmit(values: FormValues) {
    setLoading(true);

    try {
        const driverDocRef = doc(db, 'users', values.driverId);
        const vehicleDocRef = doc(db, 'vehicles', values.vehicleId);
        
        const [driverDoc, vehicleDoc] = await Promise.all([
            getDoc(driverDocRef),
            getDoc(vehicleDocRef),
        ]);

        if (!driverDoc.exists()) {
            toast({ title: 'Error', description: 'Selected driver not found.', variant: 'destructive' });
            setLoading(false);
            return;
        }

        if (!vehicleDoc.exists()) {
            toast({ title: 'Error', description: 'Selected vehicle not found.', variant: 'destructive' });
            setLoading(false);
            return;
        }

        const selectedDriver = driverDoc.data() as User;
        const selectedVehicle = { id: vehicleDoc.id, ...vehicleDoc.data()} as Vehicle;
        
        const bookingRef = doc(db, 'bookings', booking.id);
        await updateDoc(bookingRef, {
            driverInfo: {
                driverId: values.driverId,
                name: selectedDriver.name,
                contact: selectedDriver.phone || selectedDriver.email,
            },
            vehicleInfo: {
                vehicleId: selectedVehicle.id,
                vehicleName: selectedVehicle.vehicleName,
                plateNumber: selectedVehicle.plateNumber,
                imeiNumber: selectedVehicle.imeiNumber,
                vehicleModel: selectedVehicle.vehicleModel,
            },
            // Also update the top-level fields for easier access and backward compatibility
            imeiNumber: selectedVehicle.imeiNumber,
            vehicleNumber: selectedVehicle.plateNumber,
            status: 'Approved',
        });

        toast({
            title: 'Driver and Vehicle Assigned',
            description: `${selectedDriver.name} and ${selectedVehicle.vehicleName} have been assigned.`,
        });
        
        onOpenChange(false);
        form.reset();
    } catch (error) {
      console.error('Error assigning driver:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign driver/vehicle. Please check the console for details.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Driver & Vehicle</DialogTitle>
          <DialogDescription>
            Select a driver and vehicle for this booking. The status will be set to "Approved".
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="driverId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Driver</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger disabled={driversLoading}>
                        <SelectValue placeholder="Select a driver" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {driversLoading ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : (
                        drivers.map((driver: User) => (
                          <SelectItem key={driver.id} value={driver.id}>
                            {driver.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="vehicleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger disabled={vehiclesLoading}>
                        <SelectValue placeholder="Select a vehicle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vehiclesLoading ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : (
                        vehicles.map((vehicle: Vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.vehicleName} ({vehicle.vehicleModel})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || driversLoading || vehiclesLoading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Assign
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
