
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addDays, format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2, Download } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import jsPDF from 'jspdf';

import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from './ui/textarea';

const generatorPrices: { [key: string]: number } = {
  'Cummins': 5500,
  'Tata': 6200,
  'Ashoka Leyland': 7100,
  'Kirloskar': 8000
};
const generatorTypes = Object.keys(generatorPrices);
const kvaCategories = ['62', '125', '180', '250', '320', '380', '500'];

const formSchema = z.object({
  generatorType: z.string().min(1, 'Please select a generator type.'),
  kvaCategory: z.string().min(1, 'Please select a KVA category.'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1.'),
  usageHours: z.coerce.number().min(1, 'Usage hours must be at least 1.'),
  bookingDate: z.date({
    required_error: 'A booking date is required.',
  }),
  location: z.string().min(10, 'Please enter a complete address.').min(1, "Location is required."),
});

type FormValues = z.infer<typeof formSchema>;

export function BookingForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      generatorType: '',
      kvaCategory: '',
      quantity: 1,
      usageHours: 8,
      bookingDate: addDays(new Date(), 7),
      location: '',
    },
  });

  const { watch } = form;
  const watchedGeneratorType = watch('generatorType');
  const watchedHours = watch('usageHours');
  const watchedQuantity = watch('quantity');

  useEffect(() => {
    const price = generatorPrices[watchedGeneratorType] || 0;
    const hours = parseFloat(watchedHours as any);
    const quantity = parseInt(watchedQuantity as any);
    if (!isNaN(price) && price > 0 && !isNaN(hours) && !isNaN(quantity)) {
      // Simple daily rate calculation for now
      // Assuming usageHours is per day, and price is per day
      const days = Math.ceil(hours / 24);
      setEstimatedCost(price * quantity * days);
    } else {
      setEstimatedCost(0);
    }
  }, [watchedGeneratorType, watchedHours, watchedQuantity]);

  const handlePdfDownload = () => {
    const values = form.getValues();
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.text('Booking Estimate', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Generator Type: ${values.generatorType}`, 20, 40);
    doc.text(`KVA Category: ${values.kvaCategory} KVA`, 20, 50);
    doc.text(`Quantity: ${values.quantity}`, 20, 60);
    doc.text(`Usage Hours (total): ${values.usageHours} hours`, 20, 70);
    doc.text(`Booking Date: ${format(values.bookingDate, 'PPP')}`, 20, 80);
    doc.text(`Location: ${values.location}`, 20, 90);

    doc.setFontSize(16);
    doc.text(`Estimated Cost: ₹${estimatedCost.toFixed(2)}`, 20, 110);

    doc.save('booking-estimate.pdf');
  };

  async function onSubmit(values: FormValues) {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in to book.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'bookings'), {
        ...values,
        userId: user.uid,
        userEmail: user.email,
        status: 'Pending',
        estimatedCost: estimatedCost,
        createdAt: new Date(),
      });
      toast({
        title: 'Booking Submitted',
        description: 'Your booking request has been received. We will contact you shortly.',
      });
      form.reset();
    } catch (error) {
      console.error('Error adding document: ', error);
      toast({
        title: 'Submission Failed',
        description: 'There was an error submitting your booking. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Book a Generator</CardTitle>
        <CardDescription>Select your generator and enter booking details below.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="generatorType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Generator Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {generatorTypes.map((type) => (
                            <SelectItem key={type} value={type}>{type} (₹{generatorPrices[type]}/day)</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="kvaCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category (KVA)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select KVA" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {kvaCategories.map((kva) => (
                            <SelectItem key={kva} value={kva}>{kva} KVA</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 1" {...field} min="1"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="usageHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Usage Hours</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 24" {...field} min="1"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Controller
                  control={form.control}
                  name="bookingDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Pre-booking Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < addDays(new Date(), 7) || date < new Date('1900-01-01')}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Location</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter the full delivery address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>

            <div>
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-lg">Dynamic Cost Estimate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Estimated Total:</span>
                    <span className="text-2xl font-bold">₹{estimatedCost.toFixed(2)}</span>
                  </div>
                </CardContent>
                <CardFooter>
                    <Button type="button" variant="outline" onClick={handlePdfDownload} className="w-full">
                        <Download className="mr-2"/>
                        Download Estimate as PDF
                    </Button>
                </CardFooter>
              </Card>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Submit Booking Request'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
