

'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, updateDoc, getDoc, arrayUnion } from 'firebase/firestore';
import { Loader2, Car, User as UserIcon } from 'lucide-react';

import { useUsers } from '@/hooks/use-users';
import { useVehicles } from '@/hooks/use-vehicles';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Booking, User, Vehicle, BookedGenerator } from '@/lib/types';
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
import { Badge } from '../ui/badge';
import { getStatusVariant } from '@/lib/utils';
import { Separator } from '../ui/separator';

const formSchema = z.object({
  driverId: z.string().min(1, 'Please select a driver.'),
  vehicleId: z.string().min(1, 'Please select a vehicle.'),
});

type FormValues = z.infer<typeof formSchema>;

interface AssignDriverDialogProps {
  booking: Booking | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onBookingUpdate: (updatedBooking: Booking) => void;
}

export function AssignDriverDialog({ booking, isOpen, onOpenChange, onBookingUpdate }: AssignDriverDialogProps) {
  const { users, loading: driversLoading } = useUsers({ role: 'driver' });
  const { vehicles, loading: vehiclesLoading } = useVehicles({ status: 'active' });
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [selectedGenerator, setSelectedGenerator] = React.useState<BookedGenerator | null>(null);

  const drivers = users.filter(u => u.role === 'driver');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      driverId: '',
      vehicleId: '',
    },
  });
  
  React.useEffect(() => {
    if (selectedGenerator) {
        form.reset({ 
            driverId: selectedGenerator.driverInfo?.driverId || '',
            vehicleId: selectedGenerator.vehicleInfo?.vehicleId || '',
        });
    } else {
        form.reset({ driverId: '', vehicleId: '' });
    }
  }, [selectedGenerator, form]);

  React.useEffect(() => {
    if (!isOpen) {
      setSelectedGenerator(null);
    }
  }, [isOpen]);

  async function onSubmit(values: FormValues) {
    if (!booking || !selectedGenerator) return;

    setLoading(true);

    try {
        const driverDocRef = doc(db, 'users', values.driverId);
        const vehicleDocRef = doc(db, 'vehicles', values.vehicleId);
        
        const [driverDoc, vehicleDoc] = await Promise.all([
            getDoc(driverDocRef),
            getDoc(vehicleDocRef),
        ]);

        if (!driverDoc.exists() || !vehicleDoc.exists()) {
            toast({ title: 'Error', description: 'Selected driver or vehicle not found.', variant: 'destructive' });
            setLoading(false);
            return;
        }

        const selectedDriver = driverDoc.data() as User;
        const selectedVehicle = { id: vehicleDoc.id, ...vehicleDoc.data()} as Vehicle;
        
        const bookingRef = doc(db, 'bookings', booking.id);
        
        // Create the new generator object with updated info
        const updatedGenerator: BookedGenerator = {
            ...selectedGenerator,
            driverInfo: {
                driverId: values.driverId,
                name: selectedDriver.name,
                contact: selectedDriver.phone ?? selectedDriver.email,
            },
            vehicleInfo: {
                vehicleId: selectedVehicle.id,
                vehicleName: selectedVehicle.vehicleName,
                plateNumber: selectedVehicle.plateNumber,
                imeiNumber: selectedVehicle.imeiNumber,
                vehicleModel: selectedVehicle.vehicleModel,
            },
            status: 'Assigned',
        };

        // Update the specific generator in the booking's generators array
        const updatedGenerators = booking.generators.map(g => 
            g.id === selectedGenerator.id ? updatedGenerator : g
        );

        await updateDoc(bookingRef, {
            generators: updatedGenerators,
            driverIds: arrayUnion(values.driverId),
        });

        toast({
            title: 'Assignment Successful',
            description: `${selectedDriver.name} and ${selectedVehicle.vehicleName} assigned to ${selectedGenerator.kvaCategory} KVA.`,
        });
        
        const updatedBookingData = { ...booking, generators: updatedGenerators };
        onBookingUpdate(updatedBookingData);
        setSelectedGenerator(null);

    } catch (error) {
      console.error('Error assigning driver:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign driver/vehicle.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  const renderGeneratorList = () => (
    <div className="space-y-4">
        <DialogDescription>
            Select a generator below to assign a driver and vehicle to it.
        </DialogDescription>
        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
            {booking?.generators.map(gen => (
                <div key={gen.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center">
                        <p className="font-semibold">{gen.kvaCategory} KVA</p>
                        <Badge variant={getStatusVariant(gen.status, true) as any}>{gen.status}</Badge>
                    </div>
                    {gen.driverInfo && gen.vehicleInfo ? (
                        <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                            <div className="flex items-center gap-2"><UserIcon className="h-3 w-3" />{gen.driverInfo.name}</div>
                            <div className="flex items-center gap-2"><Car className="h-3 w-3" />{gen.vehicleInfo.vehicleName}</div>
                        </div>
                    ) : null}
                    <Button size="sm" variant="link" className="p-0 h-auto mt-2" onClick={() => setSelectedGenerator(gen)}>
                        {gen.driverInfo ? 'Edit Assignment' : 'Assign'}
                    </Button>
                </div>
            ))}
        </div>
        <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
        </DialogFooter>
    </div>
  );

  const renderAssignmentForm = () => (
     <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <DialogDescription>
                You are assigning for the <strong>{selectedGenerator?.kvaCategory} KVA</strong> generator.
            </DialogDescription>
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
                        {vehicle.vehicleName} ({vehicle.plateNumber})
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
            <Button type="button" variant="outline" onClick={() => setSelectedGenerator(null)} disabled={loading}>
              Back to List
            </Button>
            <Button type="submit" disabled={loading || driversLoading || vehiclesLoading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Assignment
            </Button>
        </DialogFooter>
        </form>
    </Form>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Driver & Vehicle</DialogTitle>
        </DialogHeader>
        {selectedGenerator ? renderAssignmentForm() : renderGeneratorList()}
      </DialogContent>
    </Dialog>
  );
}
