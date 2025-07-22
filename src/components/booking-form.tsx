
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addDays, format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2, Download, Clock, MapPin, CalendarDays } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import jsPDF from 'jspdf';
import Image from 'next/image';

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
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { RadioCard } from './ui/radio-card';

const generatorPrices: { [key: string]: number } = {
  'Cummins': 250,
  'Tata': 280,
  'Ashoka Leyland': 320,
  'Kirloskar': 350
};

const generatorTypes = [
    { name: 'Cummins', icon: 'https://placehold.co/40x40.png', hint: 'engine industrial' },
    { name: 'Tata', icon: 'https://placehold.co/40x40.png', hint: 'engine industrial' },
    { name: 'Ashoka Leyland', icon: 'https://placehold.co/40x40.png', hint: 'truck generator' },
    { name: 'Kirloskar', icon: 'https://placehold.co/40x40.png', hint: 'industrial engine' },
];

const kvaCategories = ['62', '125', '180', '250', '320', '380', '500'];
const GST_RATE = 0.18;

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
  const { user, name } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [subtotal, setSubtotal] = useState(0);
  const [gstAmount, setGstAmount] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      generatorType: 'Cummins',
      kvaCategory: '62',
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
    const hourlyCost = generatorPrices[watchedGeneratorType] || 0;
    
    const hours = parseFloat(watchedHours as any);
    const quantity = parseInt(watchedQuantity as any);
    
    if (hourlyCost > 0 && !isNaN(hours) && !isNaN(quantity)) {
      const currentSubtotal = hourlyCost * quantity * hours;
      const currentGst = currentSubtotal * GST_RATE;
      const currentTotal = currentSubtotal + currentGst;
      
      setSubtotal(currentSubtotal);
      setGstAmount(currentGst);
      setTotalCost(currentTotal);
    } else {
      setSubtotal(0);
      setGstAmount(0);
      setTotalCost(0);
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

    doc.setFontSize(14);
    doc.text(`Subtotal: ₹${subtotal.toFixed(2)}`, 20, 110);
    doc.text(`GST (18%): ₹${gstAmount.toFixed(2)}`, 20, 120);
    
    doc.setFontSize(16);
    doc.text(`Total Cost: ₹${totalCost.toFixed(2)}`, 20, 130);

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
            <h2 className="text-lg font-semibold">Generator Types</h2>
            <FormField
                control={form.control}
                name="generatorType"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormControl>
                            <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"
                            >
                                {generatorTypes.map((type) => (
                                    <FormItem key={type.name}>
                                        <FormControl>
                                            <RadioCard value={type.name} className="p-4">
                                                <div className="flex items-center gap-4">
                                                    <Image src={type.icon} alt={type.name} width={40} height={40} data-ai-hint={type.hint}/>
                                                    <div>
                                                        <p className="font-semibold">{type.name}</p>
                                                        <p className="text-sm text-muted-foreground">₹{generatorPrices[type.name]}/hr</p>
                                                    </div>
                                                </div>
                                            </RadioCard>
                                        </FormControl>
                                    </FormItem>
                                ))}
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <div className="space-y-4">
            <h2 className="text-lg font-semibold">Category (KVA)</h2>
            <FormField
                control={form.control}
                name="kvaCategory"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormControl>
                            <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-wrap gap-2"
                            >
                                {kvaCategories.map((kva) => (
                                    <FormItem key={kva}>
                                        <FormControl>
                                            <Button 
                                                type="button"
                                                variant={field.value === kva ? "default" : "outline"}
                                                onClick={() => field.onChange(kva)}
                                                className="rounded-full"
                                            >
                                                {field.value === kva && <div className="w-2 h-2 rounded-full bg-primary-foreground mr-2"/>}
                                                {kva} KVA
                                            </Button>
                                        </FormControl>
                                    </FormItem>
                                ))}
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        
        <div className="space-y-4">
            <h2 className="text-lg font-semibold">Booking Details Input</h2>
            <div className="grid md:grid-cols-2 gap-6">
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
        </div>
        
        <div className="space-y-4">
            <h2 className="text-lg font-semibold">Cost Estimate</h2>
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
        </div>

        <Button type="submit" disabled={loading} className="w-full text-lg py-6">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Submit Booking Request'}
        </Button>
      </form>
    </Form>
  );
}
