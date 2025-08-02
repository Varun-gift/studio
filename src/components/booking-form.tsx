
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addDays, format } from 'date-fns';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

import { GENERATORS_DATA } from '@/lib/generators';
import { Trash, Plus, Download, Send, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const generatorGroupSchema = z.object({
  kvaCategory: z.string(),
  additionalHours: z.coerce.number().min(0).optional(),
});

const bookingFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  companyName: z.string().optional(),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email(),
  location: z.string().min(10, "Please provide a detailed location"),
  bookingDate: z.date(),
  generators: z.array(generatorGroupSchema),
  additionalNotes: z.string().optional(),
});

type FormValues = z.infer<typeof bookingFormSchema>;

const BookingSummary = ({ bookingDetails, estimate, onBack, onSubmit }: { bookingDetails: FormValues, estimate: any, onBack: () => void, onSubmit: () => void }) => (
    <div className="fixed inset-0 bg-background z-50 p-4 overflow-y-auto">
      <Card>
        <CardHeader>
          <CardTitle>Booking Summary</CardTitle>
          <CardDescription>Please review your booking details before submitting.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
             <p><b>Name:</b> {bookingDetails.name}</p>
             <p><b>Company:</b> {bookingDetails.companyName || 'N/A'}</p>
             <p><b>Email:</b> {bookingDetails.email}</p>
             <p><b>Phone:</b> {bookingDetails.phone}</p>
             <p><b>Booking Date:</b> {format(bookingDetails.bookingDate, 'PPP')}</p>
             <p><b>Location:</b> {bookingDetails.location}</p>

             <Separator />

             <h3 className="font-semibold mt-4">Selected Generators</h3>
             {estimate.items.map((item: any, idx: number) => (
                <div key={idx} className="p-2 border rounded-md">
                   <p className="font-medium">{item.name}</p>
                   <div className="flex justify-between text-xs text-muted-foreground">
                       <span>Base Cost ({item.quantity} x ₹{item.basePrice.toLocaleString()})</span>
                       <span>₹{item.baseCost.toLocaleString()}</span>
                   </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                       <span>Additional Cost ({item.additionalHours} hrs x ₹{item.pricePerAdditionalHour}/hr)</span>
                       <span>₹{item.additionalCost.toLocaleString()}</span>
                   </div>
                     <div className="flex justify-between text-xs font-bold">
                       <span>Subtotal</span>
                       <span>₹{item.total.toLocaleString()}</span>
                   </div>
                </div>
             ))}
             
             <Separator />
             <div className="flex justify-between font-bold text-lg pt-2">
                 <span>Grand Total</span>
                 <span>₹{estimate.grandTotal.toLocaleString()}</span>
             </div>
          </div>
        </CardContent>
        <CardFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onBack} className="w-full sm:w-auto">Back to Edit</Button>
          <Button onClick={onSubmit} className="w-full sm:w-auto"><Send className="mr-2 h-4 w-4" /> Send Booking Request</Button>
        </CardFooter>
      </Card>
    </div>
);


export function BookingForm() {
  const { user, name, email, company, phone } = useAuth();
  const { toast } = useToast();
  const [showSummary, setShowSummary] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const form = useForm<FormValues>({
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
  const watchedGenerators = watch('generators');
  const formValues = watch();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'generators',
  });

  useEffect(() => {
    if (user) {
      form.reset({
        ...form.getValues(),
        name: name || '',
        email: user.email || '',
        companyName: company || '',
        phone: phone || '',
      });
    }
  }, [user, name, email, company, phone, form]);

  const estimate = useMemo(() => {
    const validGenerators = watchedGenerators.filter(g => g.kvaCategory);

    const items = validGenerators.map(genGroup => {
      const data = GENERATORS_DATA.find(g => g.kva === genGroup.kvaCategory);
      if (!data) return null;
      
      const quantity = 1; // Each row is one unit
      const additionalHours = Number(genGroup.additionalHours) || 0;
      
      const baseCost = data.basePrice * quantity;
      const additionalCost = data.pricePerAdditionalHour * additionalHours * quantity;
      const total = baseCost + additionalCost;

      return {
        name: `${data.kva} KVA Generator`,
        kva: data.kva,
        quantity,
        basePrice: data.basePrice,
        pricePerAdditionalHour: data.pricePerAdditionalHour,
        additionalHours,
        baseCost,
        additionalCost,
        total,
      };
    }).filter(Boolean);

    const grandTotal = items.reduce((acc, item) => acc + (item?.total ?? 0), 0);

    return { items, grandTotal };
  }, [watchedGenerators]);

  const generatorsInCart = watchedGenerators.length > 0;

  const handleDownloadEstimate = () => {
    const doc = new jsPDF();
    doc.text('Booking Estimate', 14, 20);
    doc.setFontSize(10);
    doc.text(`Name: ${form.getValues('name')}`, 14, 30);
    doc.text(`Email: ${form.getValues('email')}`, 14, 35);
    doc.text(`Date: ${format(form.getValues('bookingDate'), 'PPP')}`, 14, 40);

    autoTable(doc, {
      startY: 45,
      head: [['Generator', 'Base Cost (5hrs)', 'Add. Hours', 'Add. Cost', 'Total']],
      body: estimate.items.map(item => [
        item.name,
        `₹${item.baseCost.toLocaleString()}`,
        item.additionalHours,
        `₹${item.additionalCost.toLocaleString()}`,
        `₹${item.total.toLocaleString()}`,
      ]),
      foot: [
        [{ content: 'Grand Total', colSpan: 4, styles: { halign: 'right' } }, `₹${estimate.grandTotal.toLocaleString()}`],
      ],
    });

    doc.save('AMG-Estimate.pdf');
  };

  const submitBooking = async () => {
    if (!user) {
      toast({ title: 'Authentication Error', description: 'You must be logged in to create a booking.', variant: 'destructive' });
      return;
    }
    setLoading(true);

    try {
      const { generators, ...restOfForm } = form.getValues();
      const validGenerators = generators.filter(g => g.kvaCategory).map(g => ({
        kvaCategory: g.kvaCategory,
        quantity: 1, // Each item is one unit
        additionalHours: Number(g.additionalHours) || 0,
      }));

      const bookingData = {
        ...restOfForm,
        userId: user.uid,
        userName: restOfForm.name,
        userEmail: restOfForm.email,
        generators: validGenerators,
        estimatedCost: estimate.grandTotal,
        status: 'Pending' as const,
        createdAt: serverTimestamp(),
      };
      
      await addDoc(collection(db, 'bookings'), bookingData);
      
      toast({ title: 'Booking Request Sent!', description: "We've received your request and will get back to you shortly." });
      form.reset();
      setShowSummary(false);
    } catch (error) {
      console.error('Booking submission error:', error);
      toast({ title: 'Submission Failed', description: 'There was an error submitting your booking. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="pb-24"> {/* Padding bottom to avoid overlap with sticky bar */}
      <Form {...form}>
        <form onSubmit={handleSubmit(() => setShowSummary(true))} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact & Booking Details</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <FormField control={control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
               <FormField control={control} name="companyName" render={({ field }) => (
                <FormItem><FormLabel>Company (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={control} name="bookingDate" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>Booking Date</FormLabel><FormControl><Input type="date" {...field} onChange={e => field.onChange(new Date(e.target.value))} value={format(field.value, 'yyyy-MM-dd')} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={control} name="location" render={({ field }) => (
                <FormItem className="md:col-span-2"><FormLabel>Full Location & Address</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Generator Selection</CardTitle>
              <CardDescription>Add the generators you need for your booking. Each row is one unit.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-2 p-4 border rounded-lg bg-muted/50">
                  <div className="grid sm:grid-cols-2 gap-4 flex-1">
                    <FormField
                      control={control}
                      name={`generators.${index}.kvaCategory`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>KVA Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select KVA" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {GENERATORS_DATA.map(g => (
                                <SelectItem key={g.kva} value={g.kva}>
                                  {g.kva} KVA (₹{g.basePrice.toLocaleString()})
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
                          <FormLabel>Add. Hours (+5hrs)</FormLabel>
                          <FormControl><Input type="number" min="0" {...field} /></FormControl>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}><Trash className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => append({ kvaCategory: '', additionalHours: 0 })}>
                <Plus className="h-4 w-4 mr-2" /> Add Another Generator
              </Button>
            </CardContent>
          </Card>
          
          <Card>
              <CardHeader><CardTitle>Booking Estimate</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                  {estimate.items.length === 0 ? (
                      <p className="text-muted-foreground">Select a generator to see your booking estimate.</p>
                  ) : (
                      <>
                        {estimate.items.map((item, idx) => (
                            <div key={idx} className="space-y-1 pb-2 border-b last:border-b-0">
                                <p className="font-medium">{item.name}</p>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Base Cost (incl. 5 hours)</span>
                                    <span>₹{item.baseCost.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Additional Cost ({item.additionalHours} hours)</span>
                                    <span>₹{item.additionalCost.toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                        <div className="flex justify-between font-bold text-lg pt-2">
                            <span>Grand Total</span>
                            <span>₹{estimate.grandTotal.toLocaleString()}</span>
                        </div>
                      </>
                  )}
              </CardContent>
          </Card>
        </form>
      </Form>
      
      {generatorsInCart && (
        <div className="fixed bottom-0 left-0 right-0 bg-primary/95 text-primary-foreground p-4 backdrop-blur-sm shadow-lg border-t md:hidden">
            <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold">{estimate.items.length} Generator{estimate.items.length !== 1 && 's'} Selected</p>
                  <p className="text-sm">Total: ₹{estimate.grandTotal.toLocaleString()}</p>
                </div>
                <Button 
                    variant="secondary" 
                    onClick={() => setShowSummary(true)}
                    disabled={estimate.items.length === 0}
                >
                    Proceed to Summary
                </Button>
            </div>
        </div>
      )}
      
      <div className="hidden md:block sticky bottom-4">
        <Card className="max-w-md ml-auto shadow-xl">
             <CardHeader>
                <CardTitle>Next Steps</CardTitle>
             </CardHeader>
             <CardContent className="flex flex-col gap-2">
                 <Button onClick={handleDownloadEstimate} variant="outline" disabled={estimate.items.length === 0}>
                    <Download className="mr-2 h-4 w-4" /> Download Estimate
                 </Button>
                 <Button onClick={handleSubmit(() => setShowSummary(true))} disabled={estimate.items.length === 0}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Proceed to Summary'}
                 </Button>
             </CardContent>
        </Card>
      </div>

      {showSummary && <BookingSummary bookingDetails={formValues} estimate={estimate} onBack={() => setShowSummary(false)} onSubmit={submitBooking} />}
    </div>
  );
}
