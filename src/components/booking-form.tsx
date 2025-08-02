// File: BookingForm.tsx

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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { GENERATORS_DATA } from '@/lib/generators';
import { Trash, Plus, Download, Send } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { AmgLogo } from './amg-logo';

const generatorGroupSchema = z.object({
  kvaCategory: z.string(),
  additionalHours: z.coerce.number().min(0).optional(),
});

const bookingFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  companyName: z.string().optional(),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email(),
  location: z.string().min(10, 'Please provide a detailed location'),
  bookingDate: z.date(),
  generators: z.array(generatorGroupSchema).min(1).refine(
    gens => gens.some(g => g.kvaCategory),
    { message: 'Please select at least one generator category.' }
  ),
  additionalNotes: z.string().optional(),
});

// Booking summary modal
const BookingSummary = ({ bookingDetails, onClose, onSubmit, estimate, onDownload }) => {
  if (!bookingDetails) return null;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col shadow-lg border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Booking Summary</h2>
        <Button variant="ghost" onClick={onClose}>Close</Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <h3 className="font-semibold">Contact Details</h3>
        <p><b>Name:</b> {bookingDetails.name}</p>
        <p><b>Email:</b> {bookingDetails.email}</p>
        <p><b>Phone:</b> {bookingDetails.phone}</p>
        <p><b>Company:</b> {bookingDetails.companyName || 'N/A'}</p>
        <p><b>Location:</b> {bookingDetails.location}</p>

        <Separator />

        <h3 className="font-semibold mt-4">Selected Generators</h3>
        {estimate.items.map((item, idx) => (
           <div key={idx} className="text-sm border-b pb-2">
             <p className="font-bold">🔹 {item.name}</p>
             <div className="pl-4">
               <p>Base Cost (incl. 5 hours): ₹{item.baseCost.toLocaleString()}</p>
               <p>Additional Cost ({item.additionalHours} hrs): ₹{item.additionalCost.toLocaleString()}</p>
               <p className="font-semibold">Total: ₹{item.totalCost.toLocaleString()}</p>
             </div>
           </div>
        ))}

        <p className="font-semibold text-xl mt-4 text-right">Grand Total: ₹{estimate.grandTotal.toLocaleString()}</p>
      </div>
      <div className="p-4 border-t flex justify-end space-x-2">
        <Button variant="outline" onClick={onDownload}>
          <Download className="h-4 w-4 mr-2" /> Download Estimate
        </Button>
        <Button onClick={onSubmit}>
          <Send className="h-4 w-4 mr-2" /> Send Booking Request
        </Button>
      </div>
    </div>
  );
};

// Generator card item
const GeneratorGroupItem = ({ control, index, remove }) => {
  const values = useWatch({ control, name: `generators.${index}` });
  const kvaCategory = values.kvaCategory;

  return (
    <AccordionItem value={`item-${index}`} className="border rounded-lg px-4 bg-muted/20">
      <div className="flex items-center w-full">
        <AccordionTrigger className="flex-1">
          <div className="font-semibold">{kvaCategory ? `${kvaCategory} KVA Generator` : 'Select a Generator'}</div>
        </AccordionTrigger>
        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-8 w-8 hover:bg-destructive/10 shrink-0 ml-2">
          <Trash className="h-4 w-4 text-destructive" />
        </Button>
      </div>
      <AccordionContent className="pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <FormField
            control={control}
            name={`generators.${index}.kvaCategory`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>KVA Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select KVA" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {GENERATORS_DATA.map(gen => (
                      <SelectItem key={gen.kva} value={gen.kva}>
                        {gen.kva} KVA (₹{gen.pricePerAdditionalHour}/hr extra)
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
            name={`generators.${index}.additionalHours`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Hours</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 2" {...field} min="0" />
                </FormControl>
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
  const [showSummary, setShowSummary] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const form = useForm({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      name: '',
      companyName: '',
      phone: '',
      email: '',
      location: '',
      bookingDate: addDays(new Date(), 1),
      generators: [{ kvaCategory: '', additionalHours: 0 }],
      additionalNotes: '',
    },
  });

  const { control, watch, reset, handleSubmit } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'generators' });
  const watchedGenerators = watch('generators');

  const estimate = React.useMemo(() => {
    const items = watchedGenerators
      .filter(g => g.kvaCategory) // Only include generators that have been selected
      .map((gen) => {
        const genData = GENERATORS_DATA.find(g => g.kva === gen.kvaCategory);
        if (!genData) return null;

        const additionalHours = Number(gen.additionalHours) || 0;
        
        const baseCost = genData.basePrice;
        const additionalCost = additionalHours * genData.pricePerAdditionalHour;
        const totalCost = baseCost + additionalCost;

        return { 
            name: `${genData.kva} KVA Generator`, 
            baseCost, 
            additionalCost, 
            totalCost,
            additionalHours,
            quantity: 1, // Each item is one unit
         };
      }).filter((item): item is NonNullable<typeof item> => item !== null);

    const grandTotal = items.reduce((acc, item) => acc + item.totalCost, 0);
    return { items, grandTotal };
  }, [watchedGenerators]);

  const [expandedItems, setExpandedItems] = React.useState(['item-0']);

  React.useEffect(() => {
    if (fields.length > 0) {
      setExpandedItems(prev => [...new Set([...prev, `item-${fields.length - 1}`])]);
    }
  }, [fields.length]);

  React.useEffect(() => {
    if (user) {
      reset({
        ...form.getValues(),
        name: name || '',
        email: email || '',
        companyName: company || '',
        phone: phone || '',
      });
    }
  }, [user, name, email, company, phone, reset]);


  async function submitBooking(data) {
    if (!user) {
      toast({ title: 'Not logged in', description: 'Please login to submit', variant: 'destructive' });
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
        generators: data.generators.filter(g => g.kvaCategory).map(g => ({
          kvaCategory: g.kvaCategory,
          additionalHours: Number(g.additionalHours) || 0,
          quantity: 1, // Each item is one unit
        })),
        additionalNotes: data.additionalNotes,
        status: 'Pending',
        estimatedCost: estimate.grandTotal,
        createdAt: new Date(),
      };
      await addDoc(collection(db, 'bookings'), bookingData);
      toast({ title: 'Booking Submitted', description: 'We will contact you soon.' });
      form.reset({
        name: name || '',
        email: email || '',
        companyName: company || '',
        phone: phone || '',
        location: '',
        bookingDate: addDays(new Date(), 1),
        generators: [{ kvaCategory: '', additionalHours: 0 }],
        additionalNotes: '',
      });
      setShowSummary(false);
    } catch (err) {
      console.error("Booking submission error:", err);
      toast({ title: 'Error', description: 'Booking failed. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  const handleDownloadEstimate = () => {
    const doc = new jsPDF();
    const formValues = form.getValues();
    
    // Header
    doc.setFontSize(20);
    doc.text("Booking Estimate", 14, 22);
    doc.setFontSize(12);
    doc.text(`Date: ${format(new Date(), 'PPP')}`, 14, 30);
    
    // Company Info
    doc.setFontSize(10);
    doc.text("Ashik Mobile Generators", 14, 40);
    doc.text("your-email@amg.com", 14, 45);
    doc.text("your-phone-number", 14, 50);

    // Customer Info
    doc.setFontSize(12);
    doc.text("Bill To:", 14, 65);
    doc.setFontSize(10);
    doc.text(formValues.name, 14, 70);
    doc.text(formValues.email, 14, 75);
    doc.text(formValues.location, 14, 80);

    // Estimate Table
    const tableColumn = ["Item", "Base Cost (5 hrs)", "Additional Cost", "Total"];
    const tableRows = [];

    estimate.items.forEach(item => {
        const itemData = [
            `${item.quantity} x ${item.name}`,
            `₹${item.baseCost.toLocaleString()}`,
            `₹${item.additionalCost.toLocaleString()} (${item.additionalHours} hrs)`,
            `₹${item.totalCost.toLocaleString()}`
        ];
        tableRows.push(itemData);
    });

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 90,
    });

    // Grand Total
    const finalY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(14);
    doc.text(`Grand Total: ₹${estimate.grandTotal.toLocaleString()}`, 14, finalY + 15);
    
    // Footer
    doc.setFontSize(8);
    doc.text("This is an estimate, final costs may vary. All prices inclusive of GST.", 14, doc.internal.pageSize.height - 10);

    doc.save(`Estimate-${formValues.name}.pdf`);
};


  const formValues = watch();
  const generatorsInCart = watchedGenerators.filter(g => g.kvaCategory).length;


  return (
    <div className="max-w-4xl mx-auto py-8">
      <Form {...form}>
        <form onSubmit={handleSubmit(submitBooking)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Generator Booking</CardTitle>
              <CardDescription>Add generators to your booking. Each item represents one unit. The base price includes 5 hours of usage.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems} className="space-y-2">
                {fields.map((field, index) => (
                  <GeneratorGroupItem key={field.id} control={control} index={index} remove={remove} />
                ))}
              </Accordion>
              <Button type="button" onClick={() => append({ kvaCategory: '', additionalHours: 0 })} className="mt-4">
                <Plus className="h-4 w-4 mr-2" /> Add Another Generator
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Contact & Booking Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField control={control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="Your full name" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={control} name="companyName" render={({ field }) => (
                <FormItem><FormLabel>Company (Optional)</FormLabel><FormControl><Input placeholder="Your company name" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Phone</FormLabel><FormControl><Input placeholder="Your contact number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="Your email address" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
               <FormField control={control} name="bookingDate" render={({ field }) => (
                  <FormItem><FormLabel>Booking Date</FormLabel><FormControl><Input type="date" {...field} value={field.value ? format(field.value, 'yyyy-MM-dd') : ''} onChange={(e) => field.onChange(e.target.valueAsDate)} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={control} name="location" render={({ field }) => (
                <FormItem><FormLabel>Full Location & Address</FormLabel><FormControl><Textarea placeholder="Detailed address for generator delivery and setup" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
               <FormField control={control} name="additionalNotes" render={({ field }) => (
                <FormItem><FormLabel>Additional Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Any special requirements or instructions..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>
          
           <Card>
              <CardHeader>
                <CardTitle>Booking Estimate</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {estimate.items.length > 0 ? (
                    estimate.items.map((item, index) => (
                        <div key={index} className="space-y-2 pb-2 border-b last:border-none">
                           <div className="flex justify-between font-semibold">
                                <span>{item.name}</span>
                                <span>₹{item.totalCost.toLocaleString()}</span>
                           </div>
                           <div className="text-sm text-muted-foreground pl-2">
                                <div className="flex justify-between">
                                    <span>Base Cost (incl. 5 hours)</span>
                                    <span>₹{item.baseCost.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Additional Cost ({item.additionalHours} hrs)</span>
                                     <span>₹{item.additionalCost.toLocaleString()}</span>
                                </div>
                           </div>
                        </div>
                    ))
                ) : (
                    <p className="text-muted-foreground">Select a generator to see your booking estimate.</p>
                )}

                {estimate.items.length > 0 && (
                     <div className="flex justify-between items-center pt-4 text-xl font-bold">
                        <span>Grand Total</span>
                        <span>₹{estimate.grandTotal.toLocaleString()}</span>
                    </div>
                )}
              </CardContent>
               <CardFooter>
                 <Button type="button" onClick={() => form.trigger().then(isValid => isValid && setShowSummary(true))} className="w-full" size="lg" disabled={generatorsInCart === 0}>
                    Proceed to Summary
                 </Button>
              </CardFooter>
            </Card>

        </form>
      </Form>

      {/* Sticky cart */}
      {generatorsInCart > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 bg-primary text-primary-foreground p-4 text-center cursor-pointer z-40 md:hidden"
          onClick={() => form.trigger().then(isValid => isValid && setShowSummary(true))}
        >
          <div className="flex items-center justify-center space-x-2">
            <span>{generatorsInCart} Generator{generatorsInCart > 1 ? 's' : ''} Added | Total: ₹{estimate.grandTotal.toLocaleString()}</span>
            <span className="font-bold">View Summary</span>
          </div>
        </div>
      )}

      {/* Summary modal */}
      <BookingSummary
        bookingDetails={showSummary ? formValues : null}
        onClose={() => setShowSummary(false)}
        onSubmit={handleSubmit(submitBooking)}
        estimate={estimate}
        onDownload={handleDownloadEstimate}
      />
    </div>
  );
}
