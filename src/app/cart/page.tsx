
'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addDays, format } from 'date-fns';
import { addDoc, collection } from 'firebase/firestore';
import jsPDF from 'jspdf';
import { ArrowLeft, CalendarDays, Loader2, Minus, Plus, Trash2, Download } from 'lucide-react';

import { useCart } from '@/context/cart-context';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { BookedGenerator } from '@/lib/types';

const GST_RATE = 0.18;

const formSchema = z.object({
  name: z.string().min(1, "Name is required."),
  companyName: z.string().optional(),
  phone: z.string().min(1, "Phone number is required."),
  email: z.string().email(),
  location: z.string().min(10, 'Please enter a complete address.'),
  bookingDate: z.date(),
  needsElectrician: z.boolean().default(false),
  additionalNotes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CartPage() {
  const router = useRouter();
  const { cartItems, removeFromCart, updateCartItem, clearCart } = useCart();
  const { user, name, email, company, phone } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const subtotal = React.useMemo(() => 
    cartItems.reduce((acc, item) => acc + item.pricePerHour * item.quantity * item.usageHours, 0),
    [cartItems]
  );
  const gstAmount = subtotal * GST_RATE;
  const totalCost = subtotal + gstAmount;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bookingDate: addDays(new Date(), 7),
      needsElectrician: false,
    },
  });

  React.useEffect(() => {
      if (user) {
          form.reset({
              name: name || '',
              email: email || '',
              companyName: company || '',
              phone: phone || '',
              location: '',
              bookingDate: addDays(new Date(), 7),
              needsElectrician: false,
              additionalNotes: ''
          })
      }
  }, [user, name, email, company, phone, form]);

  const handleQuantityChange = (itemId: string, currentQuantity: number, amount: number) => {
    const newQuantity = Math.max(1, currentQuantity + amount);
    const item = cartItems.find(i => i.id === itemId);
    if (item) {
        updateCartItem(itemId, newQuantity, item.usageHours);
    }
  };

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
    doc.text(`Location: ${values.location}`, 20, 68);
    
    let yPos = 85;
    doc.setFontSize(14);
    doc.text('Requested Generators:', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    cartItems.forEach(item => {
        doc.text(`- ${item.name} (${item.kva} KVA)`, 25, yPos);
        doc.text(`  Qty: ${item.quantity}, Hours: ${item.usageHours}`, 25, yPos + 5);
        yPos += 12;
    });
    
    yPos += 10;
    doc.setFontSize(14);
    doc.text(`Subtotal: INR ${subtotal.toFixed(2)}`, 20, yPos);
    yPos += 10;
    doc.text(`GST (18%): INR ${gstAmount.toFixed(2)}`, 20, yPos);
    yPos += 10;
    
    doc.setFontSize(16);
    doc.text(`Total Cost: INR ${totalCost.toFixed(2)}`, 20, yPos);

    doc.save('booking-estimate.pdf');
  };
  
  async function onSubmit(values: FormValues) {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in to book.', variant: 'destructive' });
      return;
    }
    if(cartItems.length === 0) {
        toast({ title: 'Error', description: 'Your cart is empty.', variant: 'destructive' });
        return;
    }

    setLoading(true);

    const generatorsToBook: BookedGenerator[] = cartItems.map(item => ({
        id: item.id,
        name: item.name,
        kva: item.kva,
        quantity: item.quantity,
        usageHours: item.usageHours,
    }));

    try {
      await addDoc(collection(db, 'bookings'), {
        ...values,
        generators: generatorsToBook,
        userId: user.uid,
        status: 'Pending',
        subtotal: subtotal,
        gstAmount: gstAmount,
        estimatedCost: totalCost,
        createdAt: new Date(),
      });
      
      toast({
        title: 'Booking Submitted!',
        description: 'Your booking request has been received. We will contact you shortly.',
      });
      clearCart();
      router.push('/user');

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
    <div className="min-h-screen bg-muted/40 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
           <Button variant="outline" size="sm" asChild>
                <Link href="/products">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Continue Shopping
                </Link>
            </Button>
        </div>

        {cartItems.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <h2 className="text-2xl font-semibold mb-2">Your Cart is Empty</h2>
              <p className="text-muted-foreground mb-6">Looks like you haven't added any generators yet.</p>
              <Button asChild>
                <Link href="/products">Browse Products</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Cart ({cartItems.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {cartItems.map(item => (
                      <div key={item.id} className="flex items-start gap-4">
                        <Image src={item.imageUrl} alt={item.name} width={80} height={80} className="rounded-md object-cover aspect-square"/>
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">{item.kva} KVA</p>
                          <p className="text-sm">Usage: {item.usageHours} hrs</p>
                          <p className="font-medium">₹{item.pricePerHour * item.quantity * item.usageHours}</p>
                        </div>
                        <div className="flex items-center gap-2">
                           <Button type="button" size="icon" variant="outline" onClick={() => handleQuantityChange(item.id, item.quantity, -1)} disabled={item.quantity <= 1}>
                                <Minus className="h-4 w-4"/>
                           </Button>
                           <Input readOnly value={item.quantity} className="w-12 h-9 text-center" />
                           <Button type="button" size="icon" variant="outline" onClick={() => handleQuantityChange(item.id, item.quantity, 1)}>
                                <Plus className="h-4 w-4"/>
                           </Button>
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeFromCart(item.id)}>
                            <Trash2 className="h-5 w-5 text-destructive"/>
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Booking Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="grid sm:grid-cols-2 gap-4">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="companyName" render={({ field }) => (
                                <FormItem><FormLabel>Organization (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="phone" render={({ field }) => (
                                <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input {...field} disabled /></FormControl><FormMessage /></FormItem>
                            )}/>
                         </div>
                         <Controller
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
                                        className={cn('pl-3 text-left font-normal justify-start',!field.value && 'text-muted-foreground')}>
                                        <CalendarDays className="mr-2 h-4 w-4" />
                                        {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < addDays(new Date(), 7)} initialFocus />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField control={form.control} name="location" render={({ field }) => (
                           <FormItem><FormLabel>Venue Details / Address</FormLabel><FormControl><Textarea {...field} placeholder="Enter the full delivery address" /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="additionalNotes" render={({ field }) => (
                           <FormItem><FormLabel>Additional Notes</FormLabel><FormControl><Textarea {...field} placeholder="Any special instructions for the team..." /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField
                            control={form.control}
                            name="needsElectrician"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>Request an Electrician/Operator</FormLabel>
                                    <FormDescription>Additional charges may apply.</FormDescription>
                                </div>
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-1 space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Order Summary</CardTitle>
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
                        <Separator/>
                        <div className="flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span>₹{totalCost.toFixed(2)}</span>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                         <Button type="button" variant="outline" onClick={handlePdfDownload} className="w-full">
                            <Download className="mr-2 h-4 w-4"/>
                            Download Estimate
                        </Button>
                        <Button type="submit" disabled={loading} className="w-full" size="lg">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Booking Request
                        </Button>
                    </CardFooter>
                 </Card>
              </div>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
}
