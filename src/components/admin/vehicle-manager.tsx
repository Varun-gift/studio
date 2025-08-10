
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { collection, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { PlusCircle, MoreHorizontal, Loader2 } from 'lucide-react';

import { useVehicles } from '@/hooks/use-vehicles';
import { db } from '@/lib/firebase/client';
import { useToast } from '@/hooks/use-toast';
import type { Vehicle } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const vehicleSchema = z.object({
  vehicleName: z.string().min(1, 'Vehicle name is required.'),
  plateNumber: z.string().min(1, 'Plate number is required.'),
  imeiNumber: z.string().min(1, 'IMEI number is required.'),
  vehicleModel: z.string().min(1, 'Vehicle model is required.'),
  status: z.enum(['active', 'inactive', 'in-maintenance']),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

export function VehicleManager() {
  const { vehicles, loading: loadingVehicles } = useVehicles();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingVehicle, setEditingVehicle] = React.useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      vehicleName: '',
      plateNumber: '',
      imeiNumber: '',
      vehicleModel: '',
      status: 'active',
    },
  });

  React.useEffect(() => {
    if (editingVehicle) {
      form.reset(editingVehicle);
    } else {
      form.reset({
        vehicleName: '',
        plateNumber: '',
        imeiNumber: '',
        vehicleModel: '',
        status: 'active',
      });
    }
  }, [editingVehicle, form]);

  const handleAddNew = () => {
    setEditingVehicle(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setIsDialogOpen(true);
  };

  const handleDelete = async (vehicleId: string) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await deleteDoc(doc(db, 'vehicles', vehicleId));
      toast({ title: 'Vehicle Deleted', description: 'The vehicle has been removed.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete vehicle.', variant: 'destructive' });
    }
  };

  async function onSubmit(values: VehicleFormValues) {
    setIsLoading(true);
    try {
      if (editingVehicle) {
        // Update existing vehicle
        const vehicleRef = doc(db, 'vehicles', editingVehicle.id);
        await updateDoc(vehicleRef, values);
        toast({ title: 'Vehicle Updated', description: 'Vehicle details have been saved.' });
      } else {
        // Add new vehicle
        await addDoc(collection(db, 'vehicles'), {
          ...values,
          createdAt: serverTimestamp(),
        });
        toast({ title: 'Vehicle Added', description: 'New vehicle has been added to the fleet.' });
      }
      setIsDialogOpen(false);
      setEditingVehicle(null);
    } catch (error) {
      console.error('Error saving vehicle:', error);
      toast({ title: 'Error', description: 'Failed to save vehicle details.', variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  }

  const getStatusVariant = (status: Vehicle['status']) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'in-maintenance':
        return 'secondary';
      case 'inactive':
      default:
        return 'outline';
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Vehicle Fleet Management</CardTitle>
              <CardDescription>
                Add, edit, and manage your fleet of vehicles.
              </CardDescription>
            </div>
            <Button size="sm" className="gap-1" onClick={handleAddNew}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Add Vehicle
              </span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Plate No.</TableHead>
                <TableHead>IMEI No.</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingVehicles ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : vehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No vehicles found.
                  </TableCell>
                </TableRow>
              ) : (
                vehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-medium">{vehicle.vehicleName}</TableCell>
                    <TableCell>{vehicle.plateNumber}</TableCell>
                    <TableCell>{vehicle.imeiNumber}</TableCell>
                    <TableCell>{vehicle.vehicleModel}</TableCell>
                    <TableCell>
                       <Badge variant={getStatusVariant(vehicle.status) as any}>{vehicle.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEdit(vehicle)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(vehicle.id)}>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
            <DialogDescription>
              Fill in the details for the vehicle below.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="vehicleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Truck 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="plateNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plate Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., KA-01-AB-1234" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="imeiNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IMEI Number</FormLabel>
                      <FormControl>
                        <Input placeholder="15-digit number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="vehicleModel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Model</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Tata Ace" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="in-maintenance">In Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingVehicle ? 'Save Changes' : 'Add Vehicle'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
