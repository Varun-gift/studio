"use client";

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { GENERATORS_DATA } from '@/lib/generators';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash, Plus, Download, Send, Loader2 } from 'lucide-react';

const generatorGroupSchema = z.object({
  kvaCategory: z.string().min(1, 'Please select a KVA category.'),
  quantity: z.number().min(1, 'Quantity must be at least 1.'),
  additionalHours: z.number().min(0, 'Additional hours cannot be negative.').optional().default(0),
});

const bookingFormSchema = z.object({
  name: z.string().min(1, "Name is required."),
  email: z.string().email(),
  phone: z.string().min(1, "Phone number is required."),
  location: z.string().min(1, "Location is required."),
  company: z.string().optional(),
  additionalNotes: z.string().optional(),
  bookingDate: z.date({ required_error: "Booking date is required." }),
  generators: z.array(generatorGroupSchema).min(1, "Please add at least one generator."),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface Estimate {
  items: {
    kvaCategory: string;
    quantity: number;
    baseCost: number;
    additionalHours: number;
    additionalCost: number;
    total: number;
  }[];
  grandTotal: number;
}

export default function BookRentalPage() {
  const { user, name, email, phone, company } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
      location: '',
      additionalNotes: '',
      bookingDate: new Date(),
      generators: [{ kvaCategory: '', quantity: 1, additionalHours: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "generators",
  });

  useEffect(() => {
    if (user) {
      form.reset({
        ...form.getValues(),
        name: name || '',
        email: email || '',
        phone: phone || '',
        company: company || '',
      });
    }
  }, [user, name, email, phone, company, form]);
  
  const watchedGenerators = useWatch({
    control: form.control,
    name: 'generators',
  });

  const estimate = React.useMemo<Estimate>(() => {
    const items = watchedGenerators
      .filter(gen => gen.kvaCategory)
      .map(gen => {
        const generatorData = GENERATORS_DATA.find(g => g.kva === gen.kvaCategory);
        if (!generatorData) return null;

        const quantity = gen.quantity || 1;
        const additionalHours = gen.additionalHours || 0;

        const baseCost = generatorData.basePrice * quantity;
        const additionalCost = generatorData.pricePerAdditionalHour * additionalHours * quantity;
        const total = baseCost + additionalCost;
        
        return {
          kvaCategory: gen.kvaCategory,
          quantity,
          baseCost,
          additionalHours,
          additionalCost,
          total,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const grandTotal = items.reduce((acc, item) => acc + item.total, 0);
    
    return { items, grandTotal };
  }, [watchedGenerators]);


  const submitBooking = async (data: BookingFormValues) => {
    if (!user) {
      toast({ title: 'Authentication Error', description: 'You must be logged in to book.', variant: 'destructive' });
      return;
    }
    
    setIsSubmitting(true);

    try {
      const bookingData = {
        ...data,
        bookingDate: data.bookingDate,
        userId: user.uid,
        userEmail: user.email,
        userName: data.name,
        phone: data.phone,
        companyName: data.company,
        status: 'Pending' as const,
        estimatedCost: estimate.grandTotal,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'bookings'), bookingData);
      toast({ title: 'Booking Request Sent!', description: 'Your request has been sent successfully. We will contact you shortly.' });
      router.push('/user');
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({ title: 'Error', description: 'Failed to create booking. Please try again.', variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  };


  return (
    <div className="container mx-auto p-4 pb-24 md:pb-4">
      <Card>
        <CardHeader>
          <CardTitle>Book a Generator Rental</CardTitle>
          <CardDescription>Fill in the details below to request your generators.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(submitBooking)} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left side - Form inputs */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" {...form.register('name')} />
                    {form.formState.errors.name && <p className="text-destructive text-sm">{form.formState.errors.name.message}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" {...form.register('email')} />
                     {form.formState.errors.email && <p className="text-destructive text-sm">{form.formState.errors.email.message}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" {...form.register('phone')} />
                     {form.formState.errors.phone && <p className="text-destructive text-sm">{form.formState.errors.phone.message}</p>}
                  </div>
                   <div className="grid gap-2">
                    <Label htmlFor="company">Company (Optional)</Label>
                    <Input id="company" {...form.register('company')} />
                  </div>
                   <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="location">Location / Address</Label>
                    <Input id="location" {...form.register('location')} />
                     {form.formState.errors.location && <p className="text-destructive text-sm">{form.formState.errors.location.message}</p>}
                  </div>
                   <div className="grid gap-2 sm:col-span-2">
                      <Label htmlFor="bookingDate">Booking Date</Label>
                      <Input 
                        type="date"
                        {...form.register('bookingDate', { valueAsDate: true })}
                        min={new Date().toISOString().split("T")[0]}
                      />
                       {form.formState.errors.bookingDate && <p className="text-destructive text-sm">{form.formState.errors.bookingDate.message}</p>}
                   </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Generator Selection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-lg space-y-4 relative">
                       {fields.length > 1 && (
                         <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => remove(index)}>
                            <Trash className="h-4 w-4 text-destructive" />
                         </Button>
                       )}
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div className="grid gap-2 sm:col-span-2">
                          <Label>Generator (KVA)</Label>
                           <Select onValueChange={(value) => form.setValue(`generators.${index}.kvaCategory`, value)} defaultValue={field.kvaCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select KVA" />
                            </SelectTrigger>
                            <SelectContent>
                                {GENERATORS_DATA.map(gen => (
                                <SelectItem key={gen.id} value={gen.kva}>
                                    {gen.kva} KVA (Base: ₹{gen.basePrice.toLocaleString()})
                                </SelectItem>
                                ))}
                            </SelectContent>
                           </Select>
                           {form.formState.errors.generators?.[index]?.kvaCategory && <p className="text-destructive text-sm">{form.formState.errors.generators[index]?.kvaCategory?.message}</p>}
                        </div>
                        <div className="grid gap-2">
                          <Label>Quantity</Label>
                          <Input type="number" min="1" {...form.register(`generators.${index}.quantity`, { valueAsNumber: true })} />
                          {form.formState.errors.generators?.[index]?.quantity && <p className="text-destructive text-sm">{form.formState.errors.generators[index]?.quantity?.message}</p>}
                        </div>
                      </div>
                       <div className="grid gap-2">
                          <Label>Additional Hours (after first 5)</Label>
                          <Input type="number" min="0" {...form.register(`generators.${index}.additionalHours`, { valueAsNumber: true })} placeholder="0" />
                          <p className="text-xs text-muted-foreground">First 5 hours included. Additional hours at ₹850/hr.</p>
                          {form.formState.errors.generators?.[index]?.additionalHours && <p className="text-destructive text-sm">{form.formState.errors.generators[index]?.additionalHours?.message}</p>}
                        </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={() => append({ kvaCategory: '', quantity: 1, additionalHours: 0 })}>
                    <Plus className="mr-2 h-4 w-4"/>
                    Add Another Generator
                  </Button>
                   {form.formState.errors.generators && !form.formState.errors.generators.root && <p className="text-destructive text-sm">{form.formState.errors.generators.message}</p>}
                </CardContent>
              </Card>
              
              <Card>
                  <CardHeader><CardTitle>Additional Notes</CardTitle></CardHeader>
                  <CardContent>
                      <Textarea placeholder="Any special instructions or details?" {...form.register('additionalNotes')} />
                  </CardContent>
              </Card>

            </div>

            {/* Right side - Estimate */}
            <div className="md:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Booking Estimate</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {estimate.items.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Select a generator to see your estimate.</p>
                  ) : (
                    estimate.items.map((item, index) => (
                      <div key={index} className="space-y-2 pb-2">
                        <p className="font-semibold">{item.quantity} x {item.kvaCategory} KVA</p>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Base Cost (incl. 5 hrs)</span>
                          <span>₹{item.baseCost.toLocaleString()}</span>
                        </div>
                         <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Additional ({item.additionalHours} hrs)</span>
                          <span>₹{item.additionalCost.toLocaleString()}</span>
                        </div>
                         <div className="flex justify-between text-sm font-medium">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>₹{item.total.toLocaleString()}</span>
                        </div>
                         {index < estimate.items.length - 1 && <Separator className="mt-4" />}
                      </div>
                    ))
                  )}
                  {estimate.items.length > 0 && (
                     <>
                        <Separator />
                        <div className="flex justify-between font-bold text-lg pt-2">
                            <span>Grand Total</span>
                            <span>₹{estimate.grandTotal.toLocaleString()}</span>
                        </div>
                     </>
                  )}
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={isSubmitting || estimate.items.length === 0}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Send Booking Request
                    </Button>
                </CardFooter>
              </Card>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
