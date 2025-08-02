// File: BookingForm.tsx

'use client';

import * as React from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addDays } from 'date-fns';
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

const generatorGroupSchema = z.object({
  kvaCategory: z.string(),
  additionalHours: z.coerce.number().min(0).optional(),
});

const bookingFormSchema = z.object({
  name: z.string().min(1),
  companyName: z.string().optional(),
  phone: z.string().min(1),
  email: z.string().email(),
  location: z.string().min(10),
  bookingDate: z.date(),
  generators: z.array(generatorGroupSchema).min(1).refine(
    gens => gens.some(g => g.kvaCategory),
    { message: 'Please select at least one generator category.' }
  ),
  additionalNotes: z.string().optional(),
});

// Booking summary modal
const BookingSummary = ({ bookingDetails, onClose, onSubmit, estimate }) => {
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
        <p><b>Company:</b> {bookingDetails.companyName}</p>
        <p><b>Location:</b> {bookingDetails.location}</p>

        <Separator />

        <h3 className="font-semibold mt-4">Selected Generators</h3>
        {estimate.items.map((item, idx) => (
          <div key={idx} className="text-sm">
            🔹 {item.name} – ₹{item.totalCost} (₹{item.baseCost} base + ₹{item.additionalCost} extra)
          </div>
        ))}

        <p className="font-semibold mt-4">Total Estimate: ₹{estimate.grandTotal}</p>
      </div>
      <div className="p-4 border-t flex justify-end space-x-2">
        <Button variant="outline">
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
          <div className="font-semibold">{kvaCategory ? `${kvaCategory} KVA Generator` : 'New Generator'}</div>
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
                        {gen.kva} KVA (₹{gen.basePrice} for 5hrs)
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
  const [generatorsInCart, setGeneratorsInCart] = React.useState(0);
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
      bookingDate: addDays(new Date(), 7),
      generators: [{ kvaCategory: '', additionalHours: 0 }],
      additionalNotes: '',
    },
  });

  const { control, watch, reset, handleSubmit } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'generators' });
  const watchedGenerators = watch('generators');

  const estimate = React.useMemo(() => {
    const items = watchedGenerators.filter(g => g.kvaCategory).map((gen) => {
      const genData = GENERATORS_DATA.find(g => g.kva === gen.kvaCategory);
      if (!genData) return null;
      const additionalHours = Number(gen.additionalHours) || 0;
      const baseCost = genData.basePrice;
      const additionalCost = additionalHours * genData.pricePerAdditionalHour;
      const totalCost = baseCost + additionalCost;
      return { name: `${genData.kva} KVA Generator`, baseCost, additionalCost, totalCost };
    }).filter(Boolean);
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
  }, [user]);

  React.useEffect(() => {
    setGeneratorsInCart(watchedGenerators.filter(g => g.kvaCategory).length);
  }, [watchedGenerators]);

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
          quantity: 1,
        })),
        additionalNotes: data.additionalNotes,
        status: 'Pending',
        estimatedCost: estimate.grandTotal,
        createdAt: new Date(),
      };
      await addDoc(collection(db, 'bookings'), bookingData);
      toast({ title: 'Booking Submitted', description: 'We will contact you soon.' });
      form.reset();
      setShowSummary(false);
    } catch (err) {
      toast({ title: 'Error', description: 'Booking failed.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  const formValues = watch();

  return (
    <div className="max-w-4xl mx-auto py-8">
      <Form {...form}>
        <form className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Generator Booking</CardTitle>
              <CardDescription>Select generator and enter hours.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems}>
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
            <CardHeader><CardTitle>Contact Info</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField control={control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
              <FormField control={control} name="companyName" render={({ field }) => (
                <FormItem><FormLabel>Company</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
              <FormField control={control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
              <FormField control={control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
              <FormField control={control} name="location" render={({ field }) => (
                <FormItem><FormLabel>Location</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Estimate Summary</CardTitle></CardHeader>
            <CardContent>
              {estimate.items.map((item, idx) => (
                <div key={idx} className="text-sm">
                  ✅ {item.name} – ₹{item.totalCost} (₹{item.baseCost} base + ₹{item.additionalCost} extra)
                </div>
              ))}
              <div className="font-semibold mt-2">Total: ₹{estimate.grandTotal}</div>
            </CardContent>
          </Card>
        </form>
      </Form>

      {/* Sticky cart */}
      {generatorsInCart > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 bg-primary text-primary-foreground p-4 text-center cursor-pointer z-40"
          onClick={() => setShowSummary(true)}
        >
          <div className="flex items-center justify-center space-x-2">
            <span>{generatorsInCart} Generator{generatorsInCart > 1 ? 's' : ''} Added to Cart</span>
            <Plus className="h-4 w-4" />
          </div>
        </div>
      )}

      {/* Summary modal */}
      <BookingSummary
        bookingDetails={showSummary ? formValues : null}
        onClose={() => setShowSummary(false)}
        onSubmit={handleSubmit(submitBooking)}
        estimate={estimate}
      />
    </div>
  );
}
