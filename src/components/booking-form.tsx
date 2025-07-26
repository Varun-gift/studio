

'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addDays, format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2, Download, Clock, MapPin, CalendarDays, PlusCircle, XCircle } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import jsPDF from 'jspdf';

import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

// Price per hour per KVA
const KVA_PRICE_PER_HOUR = 4;
const GST_RATE = 0.18;

const kvaCategories = ['62', '125', '180', '250', '320', '380', '500'];

const bookedGeneratorSchema = z.object({
  kvaCategory: z.string().min(1, 'Please select a KVA category.'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1.'),
  usageHours: z.coerce.number().min(1, 'Usage hours must be at least 1.'),
});

const formSchema = z.object({
  generators: z.array(bookedGeneratorSchema).min(1, 'Please add at least one generator to the booking.'),
  bookingDate: z.date({
    required_error: 'A booking date is required.',
  }),
  location: z.string().min(10, 'Please enter a complete address.').min(1, "Location is required."),
});

type FormValues = z.infer<typeof formSchema>;

export function BookingForm() {
  const { user, name } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [subtotal, setSubtotal] = useState(0);
  const [gstAmount, setGstAmount] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      generators: [
        { kvaCategory: '62', quantity: 1, usageHours: 8 }
      ],
      bookingDate: addDays(new Date(), 7),
      location: '',
    },
  });

  const { control, watch } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "generators"
  });

  const watchedGenerators = watch('generators');

  useEffect(() => {
    const calculateTotal = () => {
      let currentSubtotal = 0;
      for (const gen of watchedGenerators) {
        const kva = parseInt(gen.kvaCategory);
        const quantity = parseInt(gen.quantity as any);
        const hours = parseFloat(gen.usageHours as any);

        if (!isNaN(kva) && !isNaN(quantity) && !isNaN(hours)) {
          // Simplified pricing: KVA * price_per_kva_hour * quantity * hours
          currentSubtotal += kva * KVA_PRICE_PER_HOUR * quantity * hours;
        }
      }
      
      const currentGst = currentSubtotal * GST_RATE;
      const currentTotal = currentSubtotal + currentGst;
      
      setSubtotal(currentSubtotal);
      setGstAmount(currentGst);
      setTotalCost(currentTotal);
    };
    calculateTotal();
  }, [watchedGenerators]);


  const handlePdfDownload = () => {
    const values = form.getValues();
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.text('Booking Estimate', 20, 20);
    
    doc.setFontSize(12);
    let yPos = 40;
    values.generators.forEach((gen, index) => {
      doc.text(`Generator ${index + 1}: ${gen.kvaCategory} KVA`, 20, yPos);
      doc.text(`- Quantity: ${gen.quantity}`, 25, yPos + 7);
      doc.text(`- Usage: ${gen.usageHours} hours`, 25, yPos + 14);
      yPos += 24;
    });

    doc.text(`Booking Date: ${format(values.bookingDate, 'PPP')}`, 20, yPos);
    yPos += 10;
    doc.text(`Location: ${values.location}`, 20, yPos);
    yPos += 20;

    doc.setFontSize(14);
    doc.text(`Subtotal: ₹${subtotal.toFixed(2)}`, 20, yPos);
    yPos += 10;
    doc.text(`GST (18%): ₹${gstAmount.toFixed(2)}`, 20, yPos);
    yPos += 10;
    
    doc.setFontSize(16);
    doc.text(`Total Cost: ₹${totalCost.toFixed(2)}`, 20, yPos);

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
        userName: name || 'N/A',
        status: 'Pending',
        subtotal: subtotal,
        gstAmount: gstAmount,
        estimatedCost: totalCost,
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generator Selection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {fields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-lg relative space-y-4 bg-muted/20">
                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => remove(index)}>
                        <XCircle className="h-5 w-5 text-destructive" />
                    </Button>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      control={control}
                      name={`generators.${index}.kvaCategory`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Generator Type (KVA)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select KVA" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {kvaCategories.map(kva => (
                                <SelectItem key={kva} value={kva}>{kva} KVA</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`generators.${index}.quantity`}
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
                      control={control}
                      name={`generators.${index}.usageHours`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Usage Hours</FormLabel>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <FormControl>
                                    <Input type="number" placeholder="e.g., 24" {...field} min="1" className="pl-10"/>
                                </FormControl>
                            </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => append({ kvaCategory: '62', quantity: 1, usageHours: 8 })}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Another Generator
              </Button>
              <FormMessage>{form.formState.errors.generators?.message}</FormMessage>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
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
                                      'pl-3 text-left font-normal justify-start',
                                      !field.value && 'text-muted-foreground'
                                  )}
                                  >
                                  <CalendarDays className="mr-2 h-4 w-4" />
                                  {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
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
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <FormControl>
                              <Textarea placeholder="Enter the full delivery address" {...field} className="pl-10"/>
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Estimate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded-lg space-y-4 bg-muted/20">
                  <div className="flex justify-between items-center text-muted-foreground">
                      <span>Subtotal</span>
                      <span className="font-medium text-foreground">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                      <span>GST (18%)</span>
                      <span className="font-medium text-foreground">₹{gstAmount.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                      <Button type="button" variant="outline" onClick={handlePdfDownload} disabled={!form.formState.isValid}>
                          <Download className="mr-2 h-4 w-4"/>
                          Download Estimate as PDF
                      </Button>
                      <span className="text-2xl font-bold">₹{totalCost.toFixed(2)}</span>
                  </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Button type="submit" disabled={loading} className="w-full text-lg py-6">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Submit Booking Request'}
        </Button>
      </form>
    </Form>
  );
}
