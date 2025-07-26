
'use client';

import * as React from 'react';
import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addDays, format } from 'date-fns';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { CalendarDays, Download, Loader2, Plus, Trash, ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

const KVA_CATEGORIES = ['62', '125', '180', '250', '320', '380', '500'];
const PRICE_PER_HOUR_PER_KVA = 4;
const GST_RATE = 0.18;

const generatorGroupSchema = z.object({
    kvaCategory: z.string({ required_error: 'Please select a KVA category.'}),
    quantity: z.coerce.number().min(1, 'Quantity must be at least 1.'),
    usageHours: z.array(z.coerce.number().min(1, 'Usage must be at least 1 hour.')),
});

const bookingFormSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  companyName: z.string().optional(),
  phone: z.string().min(1, 'Phone number is required.'),
  email: z.string().email(),
  location: z.string().min(10, 'Please enter a complete address.'),
  bookingDate: z.date(),
  generators: z.array(generatorGroupSchema).min(1, 'Please add at least one generator group.'),
  needsElectrician: z.boolean().default(false),
  additionalNotes: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

const GeneratorGroupItem = ({ control, index, remove }: { control: any, index: number, remove: (index: number) => void }) => {
    const { fields, append, remove: removeHour } = useFieldArray({
        control,
        name: `generators.${index}.usageHours`
    });

    const quantity = useWatch({
        control,
        name: `generators.${index}.quantity`,
        defaultValue: 1
    });

    const kvaCategory = useWatch({
        control,
        name: `generators.${index}.kvaCategory`,
    });

    React.useEffect(() => {
        const currentCount = fields.length;
        const targetCount = quantity || 0;
        if (currentCount < targetCount) {
            for (let i = currentCount; i < targetCount; i++) {
                append(8); // Default 8 hours
            }
        } else if (currentCount > targetCount) {
            for (let i = currentCount - 1; i >= targetCount; i--) {
                removeHour(i);
            }
        }
    }, [quantity, fields.length, append, removeHour]);

    return (
        <AccordionItem value={`item-${index}`} className="border rounded-lg px-4 bg-muted/20">
            <AccordionTrigger>
                <div className="flex justify-between w-full pr-4">
                    <span className="font-semibold">{kvaCategory ? `${quantity} x ${kvaCategory} KVA` : 'New Generator Group'}</span>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            remove(index);
                        }}
                        className="h-8 w-8 hover:bg-destructive/10"
                    >
                        <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <FormField
                        control={control}
                        name={`generators.${index}.kvaCategory`}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>KVA Category</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select KVA" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {KVA_CATEGORIES.map(kva => <SelectItem key={kva} value={kva}>{kva} KVA</SelectItem>)}
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
                                    <Input type="number" placeholder="e.g., 3" {...field} min="1" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                 <h4 className="text-sm font-medium mb-2">Usage Hours per Unit</h4>
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {fields.map((field, hourIndex) => (
                        <FormField
                            key={field.id}
                            control={control}
                            name={`generators.${index}.usageHours.${hourIndex}`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs text-muted-foreground">Unit {hourIndex + 1}</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="Hours" {...field} min="1"/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    ))}
                 </div>
            </AccordionContent>
        </AccordionItem>
    );
};


export function BookingForm() {
  const { user, name, email, company, phone } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [estimatedCost, setEstimatedCost] = React.useState(0);
  const [subtotal, setSubtotal] = React.useState(0);
  const [gstAmount, setGstAmount] = React.useState(0);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      name: '',
      companyName: '',
      phone: '',
      email: '',
      location: '',
      bookingDate: addDays(new Date(), 7),
      generators: [{ kvaCategory: '', quantity: 1, usageHours: [8] }],
      needsElectrician: false,
      additionalNotes: '',
    },
  });

  const { control, watch } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "generators"
  });

  const watchedGenerators = watch('generators');

  React.useEffect(() => {
    const total = watchedGenerators.reduce((acc, genGroup) => {
        if (genGroup.kvaCategory && genGroup.usageHours.length > 0) {
            const kvaValue = parseInt(genGroup.kvaCategory, 10);
            const totalHours = genGroup.usageHours.reduce((sum, hours) => sum + (hours || 0), 0);
            return acc + (kvaValue * PRICE_PER_HOUR_PER_KVA * totalHours);
        }
        return acc;
    }, 0);

    const gst = total * GST_RATE;
    setSubtotal(total);
    setGstAmount(gst);
    setEstimatedCost(total + gst);
  }, [watchedGenerators]);


  React.useEffect(() => {
    if (user) {
      form.reset({
        ...form.getValues(),
        name: name || '',
        email: email || '',
        companyName: company || '',
        phone: phone || '',
      });
    }
  }, [user, name, email, company, phone, form]);

  const handlePdfDownload = () => {
    const values = form.getValues();
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.text('Booking Estimate', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Name: ${values.name}`, 20, 40);
    doc.text(`Email: ${values.email}`, 20, 47);
    doc.text(`Phone: ${values.phone}`, 20, 54);
    doc.text(`Booking Date: ${format(values.bookingDate, 'PPP')}`, 20, 61);
    
    let yPos = 75;
    doc.setFontSize(14);
    doc.text('Generator Details:', 20, yPos);
    
    values.generators.forEach((genGroup, index) => {
        yPos += 7;
        doc.setFontSize(12);
        doc.text(`Group ${index + 1}: ${genGroup.quantity} x ${genGroup.kvaCategory} KVA`, 25, yPos);
        yPos += 5;
        doc.setFontSize(10);
        const hoursString = genGroup.usageHours.map((h, i) => `Unit ${i+1}: ${h}hrs`).join(', ');
        doc.text(hoursString, 30, yPos, { maxWidth: 150 });
        yPos = doc.lastAutoTable.finalY || yPos;
    });
    
    yPos += 15;
    doc.setFontSize(14);
    doc.text(`Subtotal: INR ${subtotal.toFixed(2)}`, 20, yPos);
    yPos += 10;
    doc.text(`GST (18%): INR ${gstAmount.toFixed(2)}`, 20, yPos);
    yPos += 10;
    
    doc.setFontSize(16);
    doc.text(`Total Estimated Cost: INR ${estimatedCost.toFixed(2)}`, 20, yPos);

    doc.save('booking-estimate.pdf');
  };

  async function onSubmit(data: BookingFormValues) {
    if (!user) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to submit a booking.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const bookingData = {
        ...data,
        userId: user.uid,
        userName: data.name,
        userEmail: data.email,
        status: 'Pending' as const,
        subtotal,
        gstAmount,
        estimatedCost,
        createdAt: new Date(),
      };
      
      await addDoc(collection(db, 'bookings'), bookingData);

      toast({
        title: 'Booking Request Submitted!',
        description:
          'We have received your request and will be in touch shortly.',
      });
      form.reset();
    } catch (error) {
      console.error('Error submitting booking:', error);
      toast({
        title: 'Submission Error',
        description:
          'There was an error submitting your booking. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Generator Selection</CardTitle>
                  <CardDescription>
                    Add generator groups, set quantities, and specify usage hours for each unit.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Accordion type="multiple" className="w-full space-y-4">
                        {fields.map((field, index) => (
                           <GeneratorGroupItem 
                             key={field.id}
                             control={form.control} 
                             index={index} 
                             remove={remove} 
                           />
                        ))}
                    </Accordion>
                   <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => append({ kvaCategory: '', quantity: 1, usageHours: [8] })}
                   >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Another Generator Group
                   </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Booking & Contact Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="bookingDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Setup Date</FormLabel>
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
                                {field.value ? (
                                  format(field.value, 'PPP')
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-auto p-0"
                            align="start"
                          >
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
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
                        <FormLabel>Venue Details / Address</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Enter the full delivery address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="additionalNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Any special instructions for the team..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="needsElectrician"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Request an Electrician/Operator</FormLabel>
                          <FormDescription>
                            Additional charges may apply.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Cost Estimate</CardTitle>
                  <CardDescription>
                    Based on your selection.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST (18%)</span>
                    <span>₹{gstAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t my-2"></div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{estimatedCost.toFixed(2)}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  <Button type="button" variant="outline" onClick={handlePdfDownload} className="w-full">
                    <Download className="mr-2 h-4 w-4"/>
                    Download Estimate
                  </Button>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Booking Request
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
