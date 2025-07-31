
'use client';

import * as React from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addDays, format } from 'date-fns';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
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
import { CalendarDays, Download, Loader2, Plus, Trash } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { GENERATORS_DATA } from '@/lib/generators';

const generatorGroupSchema = z.object({
    kvaCategory: z.string({ required_error: 'Please select a KVA category.'}),
    quantity: z.coerce.number().min(1, 'Quantity must be at least 1.'),
    additionalHours: z.coerce.number().min(0, 'Additional hours cannot be negative.').optional(),
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
    
    const quantity = useWatch({
        control,
        name: `generators.${index}.quantity`,
        defaultValue: 1
    });

    const kvaCategory = useWatch({
        control,
        name: `generators.${index}.kvaCategory`,
    });

    return (
        <AccordionItem value={`item-${index}`} className="border rounded-lg px-4 bg-muted/20">
            <div className="flex items-center w-full">
                <AccordionTrigger className="flex-1">
                    <div className="font-semibold">{kvaCategory ? `${quantity} x ${kvaCategory} KVA` : 'New Generator Group'}</div>
                </AccordionTrigger>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="h-8 w-8 hover:bg-destructive/10 shrink-0 ml-2"
                >
                    <Trash className="h-4 w-4 text-destructive" />
                </Button>
            </div>
            <AccordionContent className="pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
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
                                        {GENERATORS_DATA.map(gen => (
                                          <SelectItem key={gen.kva} value={gen.kva}>
                                            {gen.kva} KVA (₹{gen.pricePerAdditionalHour}/hr)
                                          </SelectItem>
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
                                    <Input type="number" placeholder="e.g., 5" {...field} min="1" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={control}
                        name={`generators.${index}.additionalHours`}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Additional Hours</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g., 2" {...field} min="0" />
                                </FormControl>
                                <FormDescription className="text-xs">
                                    Each unit runs 5hrs minimum.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
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
  
  const GST_RATE = 0.18;

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      name: '',
      companyName: '',
      phone: '',
      email: '',
      location: '',
      bookingDate: addDays(new Date(), 7),
      generators: [{ kvaCategory: '62', quantity: 1, additionalHours: 0 }],
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
        const genData = GENERATORS_DATA.find(g => g.kva === genGroup.kvaCategory);
        if(!genData) return acc;
        
        const pricePerHour = genData.pricePerAdditionalHour;
        const quantity = Number(genGroup.quantity) || 0;
        const additionalHours = Number(genGroup.additionalHours) || 0;

        if (quantity > 0 && additionalHours > 0) {
            return acc + (quantity * additionalHours * pricePerHour);
        }
        return acc;
    }, 0);

    const gst = total * GST_RATE;
    setSubtotal(total);
    setGstAmount(gst);
    setEstimatedCost(total + gst);
  }, [watchedGenerators, GST_RATE]);


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


    const handleDownloadEstimate = () => {
        const doc = new jsPDF();
        const formData = form.getValues();

        doc.setFontSize(20);
        doc.text("Booking Estimate", 14, 22);
        doc.setFontSize(12);
        doc.text("Ashik Mobile Generators", 14, 30);

        doc.setFontSize(10);
        doc.text(`Name: ${formData.name}`, 14, 40);
        doc.text(`Date: ${format(new Date(), 'PPP')}`, 140, 40);
        doc.text(`Booking Date: ${format(formData.bookingDate, 'PPP')}`, 14, 45);
        doc.text(`Location: ${formData.location.substring(0,50)}...`, 14, 50);

        const tableColumn = ["KVA Category", "Quantity", "Additional Hours", "Rate/Hr", "Cost"];
        const tableRows: any[] = [];

        formData.generators.forEach(gen => {
            const genData = GENERATORS_DATA.find(g => g.kva === gen.kvaCategory);
            const rate = genData ? genData.pricePerAdditionalHour : 0;
            const cost = (gen.quantity || 0) * (gen.additionalHours || 0) * rate;

            const row = [
                gen.kvaCategory,
                gen.quantity,
                gen.additionalHours || 0,
                `₹${rate}`,
                `₹${cost.toFixed(2)}`
            ];
            tableRows.push(row);
        });

        (doc as any).autoTable({
            startY: 55,
            head: [tableColumn],
            body: tableRows,
            foot: [
                ['', '', '', 'Subtotal', `₹${subtotal.toFixed(2)}`],
                ['', '', '', `GST (${GST_RATE * 100}%)`, `₹${gstAmount.toFixed(2)}`],
                ['', '', '', 'Total Estimate', `₹${estimatedCost.toFixed(2)}`],
            ],
            theme: 'striped',
            headStyles: { fillColor: [255, 79, 0] },
            footStyles: { fontStyle: 'bold' }
        });
        
        const finalY = (doc as any).lastAutoTable.finalY;
        doc.setFontSize(8);
        doc.text("Note: This estimate is based on additional hours only. The base 5-hour rental has a separate charge not included here.", 14, finalY + 10);


        doc.save("AMG_Estimate.pdf");
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
        userId: user.uid,
        userName: data.name,
        userEmail: data.email,
        companyName: data.companyName,
        phone: data.phone,
        location: data.location,
        bookingDate: data.bookingDate,
        generators: data.generators.map(g => ({ ...g, additionalHours: Number(g.additionalHours) || 0, kvaCategory: g.kvaCategory })),
        needsElectrician: data.needsElectrician,
        additionalNotes: data.additionalNotes,
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
                    Each generator runs for a minimum of 5 hours. Additional hours will be charged.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Accordion type="multiple" className="w-full space-y-4" defaultValue={['item-0']}>
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
                    onClick={() => append({ kvaCategory: '62', quantity: 1, additionalHours: 0 })}
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
                    Based on additional hours only.
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
                   <Button variant="outline" onClick={handleDownloadEstimate} className="w-full">
                     <Download className="mr-2 h-4 w-4" />
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
