

'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { Checkbox } from './ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

// Price per hour per KVA
const KVA_PRICE_PER_HOUR = 4;
const GST_RATE = 0.18;

const kvaCategories = ['62', '125', '180', '250', '320', '380', '500'];

const formSchema = z.object({
  selectedKva: z.array(z.string()).refine(value => value.length > 0, {
    message: "You have to select at least one generator type.",
  }),
  generators: z.record(z.object({
    quantity: z.coerce.number().min(1, "Min 1"),
    usageHours: z.coerce.number().min(1, "Min 1hr"),
  })),
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
      selectedKva: [],
      generators: {},
      bookingDate: addDays(new Date(), 7),
      location: '',
    },
  });

  const { watch, setValue } = form;
  const watchedGenerators = watch('generators');
  const selectedKva = watch('selectedKva');

  useEffect(() => {
    const calculateTotal = () => {
      let currentSubtotal = 0;
      for (const kva of selectedKva) {
        const gen = watchedGenerators[kva];
        if (gen) {
          const quantity = gen.quantity;
          const hours = gen.usageHours;
          if (!isNaN(parseInt(kva)) && !isNaN(quantity) && !isNaN(hours)) {
            currentSubtotal += parseInt(kva) * KVA_PRICE_PER_HOUR * quantity * hours;
          }
        }
      }
      
      const currentGst = currentSubtotal * GST_RATE;
      const currentTotal = currentSubtotal + currentGst;
      
      setSubtotal(currentSubtotal);
      setGstAmount(currentGst);
      setTotalCost(currentTotal);
    };
    calculateTotal();
  }, [watchedGenerators, selectedKva]);

  const handlePdfDownload = () => {
    const values = form.getValues();
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.text('Booking Estimate', 20, 20);
    
    doc.setFontSize(12);
    let yPos = 40;

    const finalGenerators = values.selectedKva.map(kva => ({
      kvaCategory: kva,
      quantity: values.generators[kva]?.quantity || 0,
      usageHours: values.generators[kva]?.usageHours || 0,
    })).filter(g => g.quantity > 0 && g.usageHours > 0);

    finalGenerators.forEach((gen, index) => {
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

    // Transform the form data to the desired structure
    const finalGenerators = values.selectedKva.map(kva => ({
      kvaCategory: kva,
      quantity: values.generators[kva]?.quantity || 0,
      usageHours: values.generators[kva]?.usageHours || 0,
    })).filter(g => g.quantity > 0 && g.usageHours > 0);

    if (finalGenerators.length === 0) {
      toast({ title: 'Error', description: 'Please select at least one generator with quantity and usage hours.', variant: 'destructive' });
      setLoading(false);
      return;
    }

    try {
      const { selectedKva, ...restOfValues } = values;
      await addDoc(collection(db, 'bookings'), {
        ...restOfValues,
        generators: finalGenerators,
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
              <FormField
                control={form.control}
                name="selectedKva"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {kvaCategories.map((item) => (
                        <FormField
                          key={item}
                          control={form.control}
                          name="selectedKva"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={item}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, item])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== item
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {item} KVA
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {selectedKva.length > 0 && <Separator />}

              <div className="space-y-4">
                {selectedKva.map((kva) => (
                   <div key={kva} className="p-4 border rounded-lg relative space-y-4 bg-muted/20">
                     <h4 className="font-semibold">{kva} KVA Generators</h4>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`generators.${kva}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantity</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="e.g., 1" {...field} min="1" onChange={(e) => {
                                    field.onChange(e);
                                    setValue(`generators.${kva}.quantity`, parseInt(e.target.value));
                                }}/>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                         <FormField
                          control={form.control}
                          name={`generators.${kva}.usageHours`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Usage Hours</FormLabel>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <FormControl>
                                        <Input type="number" placeholder="e.g., 24" {...field} min="1" className="pl-10" onChange={(e) => {
                                            field.onChange(e);
                                            setValue(`generators.${kva}.usageHours`, parseInt(e.target.value));
                                        }}/>
                                    </FormControl>
                                </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                     </div>
                   </div>
                ))}
              </div>

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
