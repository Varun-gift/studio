"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { createBooking } from '@/app/actions'; // Assuming createBooking is in actions.ts
import { getAvailableVehicles, getAvailableDrivers, getGeneratorByVehicleId } from '@/lib/api'; // Assuming these functions exist
import { Vehicle, Driver, Generator } from '@/lib/types'; // Assuming types are defined

const formSchema = z.object({
  generator_id: z.string().min(1, { message: 'Generator is required.' }),
  vehicle_id: z.string().min(1, { message: 'Vehicle is required.' }),
  driver_id: z.string().min(1, { message: 'Driver is required.' }),
  imei: z.string().min(1, { message: 'IMEI is required.' }),
  start_time: z.date({ required_error: 'Start time is required.' }),
  end_time: z.date({ required_error: 'End time is required.' }),
});

export default function BookRentalPage() {
  const router = useRouter();
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedGenerator, setSelectedGenerator] = useState<Generator | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      generator_id: '',
      vehicle_id: '',
      driver_id: '',
      imei: '',
      start_time: undefined,
      end_time: undefined,
    },
  });

  useEffect(() => {
    // Fetch available vehicles and drivers
    const fetchAvailableResources = async () => {
      try {
        const vehicles = await getAvailableVehicles();
        setAvailableVehicles(vehicles);
        const drivers = await getAvailableDrivers();
        setAvailableDrivers(drivers);
      } catch (error) {
        console.error('Error fetching available resources:', error);
        toast({
          title: 'Error',
          description: 'Failed to load available vehicles and drivers.',
          variant: 'destructive',
        });
      }
    };

    fetchAvailableResources();
  }, []);

  useEffect(() => {
    // Dynamically pull IMEI when vehicle is selected
    const vehicleId = form.watch('vehicle_id');
    const fetchGeneratorImei = async () => {
      if (vehicleId) {
        try {
          const generator = await getGeneratorByVehicleId(vehicleId);
          if (generator) {
            setSelectedGenerator(generator);
            form.setValue('generator_id', generator.id);
            form.setValue('imei', generator.imei || ''); // Assuming generator has an imei field
          } else {
            setSelectedGenerator(null);
            form.setValue('generator_id', '');
            form.setValue('imei', '');
            toast({
              title: 'Warning',
              description: 'No generator found for the selected vehicle.',
              variant: 'default',
            });
          }
        } catch (error) {
          console.error('Error fetching generator IMEI:', error);
          setSelectedGenerator(null);
          form.setValue('generator_id', '');
          form.setValue('imei', '');
          toast({
            title: 'Error',
            description: 'Failed to fetch generator information.',
            variant: 'destructive',
          });
        }
      } else {
        setSelectedGenerator(null);
        form.setValue('generator_id', '');
        form.setValue('imei', '');
      }
    };

    fetchGeneratorImei();
  }, [form.watch('vehicle_id')]); // Trigger when vehicle_id changes

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Runtime capture rules alignment can be added here or in backend logic
    // For now, we'll just submit the form data

    try {
      // You might want to generate a unique booking_id here or in the backend
      const bookingData = {
        ...values,
        booking_id: `booking_${Date.now()}`, // Example booking_id generation
      };
      await createBooking(bookingData);
      toast({
        title: 'Booking Successful',
        description: 'Your rental has been booked.',
      });
      router.push('/user'); // Redirect to user dashboard
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: 'Error',
        description: 'Failed to create booking. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Add validation for start and end times based on runtime capture rules
  // This is a placeholder and should be implemented based on your specific rules
  const validateTimeAlignment = (startDate: Date | undefined, endDate: Date | undefined) => {
    if (startDate && endDate) {
      // Example rule: Start time must be before end time
      if (startDate >= endDate) {
        return 'End time must be after start time.';
      }
      // Add more complex rules based on Fleetop API or other requirements
    }
    return null; // Valid if no issues
  };

  useEffect(() => {
    const startTime = form.watch('start_time');
    const endTime = form.watch('end_time');
    const timeError = validateTimeAlignment(startTime, endTime);
    if (timeError) {
      form.setError('end_time', { message: timeError });
    } else {
      form.clearErrors('end_time');
    }
  }, [form.watch('start_time'), form.watch('end_time')]);


  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Book a Rental</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="vehicle_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vehicle</FormLabel>
                <Select onValueChange={(value) => {
                   field.onChange(value);
                   const vehicle = availableVehicles.find(v => v.id === value);
                   setSelectedVehicle(vehicle || null);
                 }} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a vehicle" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableVehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>{vehicle.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedGenerator && (
             <FormField
               control={form.control}
               name="generator_id"
               render={({ field }) => (
                 <FormItem>
                   <FormLabel>Generator</FormLabel>
                   <Input {...field} disabled value={selectedGenerator.name} />
                   <FormMessage />
                 </FormItem>
               )}
             />
           )}

           <FormField
             control={form.control}
             name="imei"
             render={({ field }) => (
               <FormItem>
                 <FormLabel>IMEI</FormLabel>
                 <Input {...field} disabled />
                 <FormMessage />
               </FormItem>
             )}
           />

          <FormField
            control={form.control}
            name="driver_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Driver</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a driver" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableDrivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>{driver.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="start_time"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Time</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={`w-[240px] pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                      >
                        {field.value ? (
                          format(field.value, "PPP HH:mm")
                        ) : (
                          <span>Pick a date and time</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                    {/* Add time picker if needed */}
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_time"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Time</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={`w-[240px] pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                      >
                        {field.value ? (
                          format(field.value, "PPP HH:mm")
                        ) : (
                          <span>Pick a date and time</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                    {/* Add time picker if needed */}
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit">Book Rental</Button>
        </form>
      </Form>
    </div>
  );
}