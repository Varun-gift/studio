
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

import { useUsers } from '@/hooks/use-users';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Booking, User } from '@/lib/types';
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
});

type FormValues = z.infer<typeof formSchema>;

interface AssignDriverDialogProps {
  booking: Booking;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function AssignDriverDialog({ booking, isOpen, onOpenChange }: AssignDriverDialogProps) {
  const { users, loading: driversLoading } = useUsers({ role: 'driver' });
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  // Filter out any users who might have the 'driver' role but are also admins or something else unintended.
  const drivers = users.filter(u => u.role === 'driver');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      driverId: booking.driverInfo?.driverId || '',
    },
  });
  
  React.useEffect(() => {
      form.reset({ driverId: booking.driverInfo?.driverId || '' });
  }, [booking, form]);

  async function onSubmit(values: FormValues) {
    setLoading(true);

    try {
        const driverDocRef = doc(db, 'users', values.driverId);
        const driverDoc = await getDoc(driverDocRef);

        if (!driverDoc.exists()) {
            toast({ title: 'Error', description: 'Selected driver not found.', variant: 'destructive' });
            setLoading(false);
            return;
        }

        const selectedDriver = driverDoc.data() as User;
        
        const bookingRef = doc(db, 'bookings', booking.id);
        await updateDoc(bookingRef, {
            driverInfo: {
            driverId: values.driverId,
            name: selectedDriver.name,
            contact: selectedDriver.phone || selectedDriver.email,
            vehicleNumber: selectedDriver.vehicleNumber || 'N/A',
            electricianName: selectedDriver.electricianName || 'N/A',
            electricianContact: selectedDriver.electricianContact || 'N/A',
            },
            status: 'Approved',
        });
        toast({
            title: 'Driver Assigned',
            description: `${selectedDriver.name} has been assigned to the booking.`,
        });
        onOpenChange(false);
        form.reset();
    } catch (error) {
      console.error('Error assigning driver:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign driver. Please check the console for details.',
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
          <DialogTitle>Assign Driver</DialogTitle>
          <DialogDescription>
            Select a driver to assign to this booking. The booking status will be automatically set to &quot;Approved&quot;.
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Assign Driver
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
