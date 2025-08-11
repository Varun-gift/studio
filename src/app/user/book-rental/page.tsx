

"use client";

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import Image from 'next/image';

import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { GENERATORS_DATA } from '@/lib/generators';
import { ADDONS_DATA } from '@/lib/addons';


import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Trash, Plus, Download, Send, Loader2, Package, Wrench } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';


const generatorGroupSchema = z.object({
  kvaCategory: z.string().min(1, 'Please select a KVA category.'),
  additionalHours: z.number().min(0, 'Additional hours cannot be negative.').optional().default(0),
});

const addonSchema = z.object({
  addonId: z.string(),
  quantity: z.number().min(1, "Quantity must be at least 1."),
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
  addons: z.array(addonSchema).optional(),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface Estimate {
  generatorItems: {
    kvaCategory: string;
    baseCost: number;
    additionalHours: number;
    additionalCost: number;
    total: number;
  }[];
  addonItems: {
      name: string;
      quantity: number;
      price: number;
      total: number;
  }[];
  generatorsTotal: number;
  addonsTotal: number;
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
      generators: [{ kvaCategory: '', additionalHours: 0 }],
      addons: [],
    },
  });

  const { fields: generatorFields, append: appendGenerator, remove: removeGenerator } = useFieldArray({
    control: form.control,
    name: "generators",
  });

  const { fields: addonFields, append: appendAddon, remove: removeAddon, update: updateAddon } = useFieldArray({
      control: form.control,
      name: "addons",
  });
  
  const watchedGenerators = useWatch({ control: form.control, name: 'generators' });
  const watchedAddons = useWatch({ control: form.control, name: 'addons' });
  
  const handleAddonCheckedChange = (checked: boolean, addonId: string) => {
    const existingIndex = addonFields.findIndex(field => field.addonId === addonId);
    if (checked) {
        if (existingIndex === -1) {
            appendAddon({ addonId, quantity: 1 });
        }
    } else {
        if (existingIndex !== -1) {
            removeAddon(existingIndex);
        }
    }
  };


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

  const estimate = React.useMemo<Estimate>(() => {
    const generatorItems = watchedGenerators
      .filter(gen => gen.kvaCategory)
      .map(gen => {
        const generatorData = GENERATORS_DATA.find(g => g.kva === gen.kvaCategory);
        if (!generatorData) return null;

        const additionalHours = gen.additionalHours || 0;
        const baseCost = generatorData.basePrice;
        const additionalCost = generatorData.pricePerAdditionalHour * additionalHours;
        const total = baseCost + additionalCost;
        
        return { kvaCategory: gen.kvaCategory, baseCost, additionalHours, additionalCost, total };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const generatorsTotal = generatorItems.reduce((acc, item) => acc + item.total, 0);

    const addonItems = (watchedAddons ?? [])
        .map(item => {
            const addonData = ADDONS_DATA.find(a => a.id === item.addonId);
            if (!addonData) return null;
            return {
                name: addonData.name,
                quantity: item.quantity,
                price: addonData.price,
                total: addonData.price * item.quantity,
            };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);
    
    const addonsTotal = addonItems.reduce((acc, item) => acc + item.total, 0);

    const grandTotal = generatorsTotal + addonsTotal;
    
    return { generatorItems, addonItems, generatorsTotal, addonsTotal, grandTotal };
  }, [watchedGenerators, watchedAddons]);


  const submitBooking = async (data: BookingFormValues) => {
    if (!user) {
      toast({ title: 'Authentication Error', description: 'You must be logged in to book.', variant: 'destructive' });
      return;
    }
    
    setIsSubmitting(true);

    try {
      const bookingData = {
        userId: user.uid,
        userEmail: user.email,
        userName: data.name,
        phone: data.phone,
        companyName: data.company,
        location: data.location,
        bookingDate: data.bookingDate,
        additionalNotes: data.additionalNotes,
        status: 'Pending' as const,
        estimatedCost: estimate.grandTotal,
        createdAt: serverTimestamp(),
        generators: data.generators.map((g, index) => ({
            id: `gen_${index + 1}`,
            kvaCategory: g.kvaCategory,
            additionalHours: g.additionalHours,
            status: 'Pending' as const,
        })),
        addons: data.addons?.filter(a => a.quantity > 0) || [],
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

   const handleDownloadEstimate = () => {
        const doc = new jsPDF();
        const bookingDetails = form.getValues();

        // Constants for layout
        const pageMargin = 14;
        const primaryColor = '#FF4F00';
        const blackColor = '#000000';
        const grayColor = '#808080';

        // --- HEADER ---
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor);
        doc.text('AMG', pageMargin, 20);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(blackColor);
        doc.text('ASHIK MOBILE GENERATORS', pageMargin + 12, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(grayColor);
        doc.text('POWER ALWAYS', pageMargin, 25);
        
        doc.setFontSize(9);
        doc.setTextColor(blackColor);
        doc.text('Supply of Power Generators (Sound Proof Only)', pageMargin, 30);
        doc.text('PAN : ACTPR5143E, GSTIN : 29ACTPR5143E1Z5', pageMargin, 34);

        doc.text('Tel : 41464355', 200, 20, { align: 'right' });
        doc.text('Telefax : 26780168', 200, 24, { align: 'right' });
        doc.text('Mobile : 98450 38487', 200, 28, { align: 'right' });
        
        doc.setLineWidth(0.5);
        doc.setDrawColor(primaryColor);
        doc.line(pageMargin, 38, 210 - pageMargin, 38);
        
        doc.setFontSize(8);
        doc.text('# 848, 85, N.S. Palya Main Road, 3rd Cross, Bannerghatta Road, Near Shopper\'s Stop, Bangalore - 76. Email : ashikmobilegenerators@gmail.com&amgen@mail.com', 105, 42, { align: 'center' });
        
        doc.setLineWidth(0.8);
        doc.setDrawColor(blackColor);
        doc.line(pageMargin, 45, 210 - pageMargin, 45);

        // --- QUOTATION TITLE ---
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('QUOTATION', 105, 53, { align: 'center' });
        doc.line(90, 54, 120, 54);

        // --- CUSTOMER & BOOKING INFO ---
        autoTable(doc, {
            startY: 60,
            body: [
                [
                    { content: `To,\n${bookingDetails.phone}`, styles: { cellWidth: 91 } },
                    { content: `Date : ${format(new Date(), 'dd-MM-yyyy')}\nPlace of Supply : ${bookingDetails.location}\nState Code : 29\nClient's GST No :\nClient's PAN No :`, styles: { cellWidth: 91 } }
                ]
            ],
            theme: 'grid',
            styles: {
                fontSize: 10,
                valign: 'top',
                lineWidth: 0.2,
                lineColor: [0, 0, 0]
            }
        });
        
        // --- ITEMS TABLE ---
        const tableBody = [];
        let serialNumber = 1;

        // Generator Items
        if (estimate.generatorItems.length > 0) {
            tableBody.push([
                { content: 'Service Providing for Soundproof Mobile Generators', colSpan: 4, styles: { fontStyle: 'bold', halign: 'center' } }
            ]);
            estimate.generatorItems.forEach(item => {
                const totalHours = 5 + item.additionalHours;
                const description = 
                    `${item.kvaCategory} KVA Rent On ${format(bookingDetails.bookingDate, 'dd-MM-yyyy')}\n` +
                    `Genset Running ${totalHours} Hours 00 Minutes\n` +
                    `(Total ${totalHours} Hours 00 Minutes)`;

                const cost = `Rs. ${item.baseCost.toLocaleString()}\nRs. ${item.additionalCost.toLocaleString()}`;
                
                tableBody.push([
                    { content: serialNumber++, styles: { halign: 'center' } },
                    { content: description },
                    { content: cost, styles: { halign: 'right' } },
                    { content: `Rs. ${item.total.toLocaleString()}`, styles: { halign: 'right' } }
                ]);
            });
        }
        
        // Addon Items
        if (estimate.addonItems.length > 0) {
             tableBody.push([
                { content: 'Additional Items & Services', colSpan: 4, styles: { fontStyle: 'bold', halign: 'center' } }
            ]);
            estimate.addonItems.forEach(item => {
                 const description = `${item.name} (Qty: ${item.quantity})`;
                 const cost = `Rs. ${item.price.toLocaleString()}`;
                 tableBody.push([
                    { content: serialNumber++, styles: { halign: 'center' } },
                    { content: description },
                    { content: cost, styles: { halign: 'right' } },
                    { content: `Rs. ${item.total.toLocaleString()}`, styles: { halign: 'right' } }
                ]);
            });
        }
        
        // Grand Total Row
         tableBody.push([
                { content: 'Grand Total', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
                { content: `Rs. ${estimate.grandTotal.toLocaleString()}`, styles: { halign: 'right', fontStyle: 'bold' } }
        ]);

        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY,
            head: [['S.No', 'Description', 'Cost', 'Amount']],
            body: tableBody,
            theme: 'grid',
            headStyles: {
                fillColor: [220, 220, 220],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                halign: 'center'
            },
            columnStyles: {
                0: { cellWidth: 10, halign: 'center' }, // S.No
                1: { cellWidth: 90 }, // Description
                2: { cellWidth: 38, halign: 'right' }, // Cost
                3: { cellWidth: 38, halign: 'right' }  // Amount
            },
            didParseCell: function(data) {
                if(data.cell.section === 'head') {
                    data.cell.styles.lineColor = [0,0,0];
                    data.cell.styles.lineWidth = 0.2;
                }
            }
        });

        doc.save('quotation.pdf');
  };

  return (
    <div className="container mx-auto p-4 pb-24 md:pb-4">
      <Card>
        <CardHeader>
          <CardTitle>Book a Generator Rental</CardTitle>
          <CardDescription>Fill in the details below to request your generators and any add-ons.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(submitBooking)} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader> <CardTitle>Customer Information</CardTitle> </CardHeader>
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
                      <Input type="date" {...form.register('bookingDate', { valueAsDate: true })} min={new Date().toISOString().split("T")[0]} />
                       {form.formState.errors.bookingDate && <p className="text-destructive text-sm">{form.formState.errors.bookingDate.message}</p>}
                   </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="generators" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="generators"><Package className="mr-2 h-4 w-4"/>Generators</TabsTrigger>
                    <TabsTrigger value="addons"><Wrench className="mr-2 h-4 w-4"/>Add-ons</TabsTrigger>
                </TabsList>
                <TabsContent value="generators">
                    <Card>
                        <CardHeader>
                        <CardTitle>Generator Selection</CardTitle>
                        <CardDescription>Add each generator unit you require individually.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                        {generatorFields.map((field, index) => (
                            <div key={field.id} className="p-4 border rounded-lg space-y-4 relative">
                            {generatorFields.length > 1 && (
                                <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => removeGenerator(index)}>
                                    <Trash className="h-4 w-4 text-destructive" />
                                </Button>
                            )}
                            <div className="grid sm:grid-cols-3 gap-4">
                                <div className="grid gap-2 sm:col-span-3">
                                <Label>Generator (KVA)</Label>
                                <Select onValueChange={(value) => form.setValue(`generators.${index}.kvaCategory`, value)} defaultValue={field.kvaCategory}>
                                    <SelectTrigger> <SelectValue placeholder="Select KVA" /> </SelectTrigger>
                                    <SelectContent>
                                        {GENERATORS_DATA.map(gen => ( <SelectItem key={gen.id} value={gen.kva}> {gen.kva} KVA (Base: ₹{gen.basePrice.toLocaleString()}) </SelectItem> ))}
                                    </SelectContent>
                                </Select>
                                {form.formState.errors.generators?.[index]?.kvaCategory && <p className="text-destructive text-sm">{form.formState.errors.generators[index]?.kvaCategory?.message}</p>}
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
                        <Button type="button" variant="outline" onClick={() => appendGenerator({ kvaCategory: '', additionalHours: 0 })}>
                            <Plus className="mr-2 h-4 w-4"/> Add Another Generator
                        </Button>
                        {form.formState.errors.generators && !form.formState.errors.generators.root && <p className="text-destructive text-sm">{form.formState.errors.generators.message}</p>}
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="addons">
                    <Card>
                        <CardHeader>
                            <CardTitle>Add-on Items</CardTitle>
                            <CardDescription>Select any additional items you require.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {ADDONS_DATA.map((addon) => {
                                const selectedAddonIndex = addonFields.findIndex(field => field.addonId === addon.id);
                                const isSelected = selectedAddonIndex !== -1;
                                return (
                                    <div key={addon.id} className="relative p-3 border rounded-lg flex flex-col items-start gap-4">
                                        <div className="relative w-full h-24 rounded-md overflow-hidden mb-2">
                                            <Image 
                                                src={addon.imageUrl} 
                                                alt={addon.name} 
                                                fill
                                                className="object-cover"
                                                data-ai-hint={addon['data-ai-hint']}
                                            />
                                        </div>
                                        <div className="flex items-start gap-3 w-full">
                                            <Checkbox
                                                id={`addon-${addon.id}`}
                                                checked={isSelected}
                                                onCheckedChange={(checked) => handleAddonCheckedChange(!!checked, addon.id)}
                                                className="mt-1"
                                            />
                                            <div className="flex-1">
                                                <Label htmlFor={`addon-${addon.id}`} className="font-medium">{addon.name}</Label>
                                                <p className="text-xs text-muted-foreground">₹{addon.price.toLocaleString()} {addon.unit}</p>
                                            </div>
                                        </div>
                                        {isSelected && (
                                             <div className="grid gap-2 w-full pt-2 mt-2 border-t">
                                                <Label htmlFor={`quantity-${addon.id}`} className="text-sm">Quantity</Label>
                                                <Input
                                                    id={`quantity-${addon.id}`}
                                                    type="number"
                                                    min="1"
                                                    className="h-8"
                                                    {...form.register(`addons.${selectedAddonIndex}.quantity`, { valueAsNumber: true })}
                                                    defaultValue={1}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </TabsContent>
              </Tabs>
              
              <Card>
                  <CardHeader><CardTitle>Additional Notes</CardTitle></CardHeader>
                  <CardContent>
                      <Textarea placeholder="Any special instructions or details?" {...form.register('additionalNotes')} />
                  </CardContent>
              </Card>
            </div>

            <div className="md:col-span-1">
              <Card className="sticky top-4">
                <CardHeader> <CardTitle>Booking Estimate</CardTitle> </CardHeader>
                <CardContent className="space-y-4">
                  {estimate.generatorItems.length === 0 && estimate.addonItems.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Select items to see your estimate.</p>
                  ) : (
                    <>
                     {estimate.generatorItems.length > 0 && (
                        <div className="space-y-4">
                            <h4 className="font-semibold">Generators</h4>
                            {estimate.generatorItems.map((item, index) => (
                                <div key={index} className="space-y-2 pb-2">
                                    <p className="font-semibold text-sm">1 x {item.kvaCategory} KVA</p>
                                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Base Cost (5 hrs)</span><span>₹{item.baseCost.toLocaleString()}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Additional ({item.additionalHours} hrs)</span><span>₹{item.additionalCost.toLocaleString()}</span></div>
                                </div>
                            ))}
                            <Separator/>
                            <div className="flex justify-between font-medium"><p>Generators Total</p><p>₹{estimate.generatorsTotal.toLocaleString()}</p></div>
                        </div>
                     )}
                     {estimate.addonItems.length > 0 && (
                         <div className="space-y-4 pt-4">
                             <h4 className="font-semibold">Add-ons</h4>
                             {estimate.addonItems.map((item, index) => (
                                 <div key={index} className="flex justify-between text-sm">
                                     <span className="text-muted-foreground">{item.name} (x{item.quantity})</span>
                                     <span>₹{item.total.toLocaleString()}</span>
                                 </div>
                             ))}
                             <Separator/>
                             <div className="flex justify-between font-medium"><p>Add-ons Total</p><p>₹{estimate.addonsTotal.toLocaleString()}</p></div>
                         </div>
                     )}
                      <Separator className="my-4" />
                      <div className="flex justify-between font-bold text-lg pt-2">
                          <span>Grand Total</span>
                          <span>₹{estimate.grandTotal.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </CardContent>
                <CardFooter className="flex-col gap-2 items-stretch">
                   <Button type="button" variant="outline" onClick={handleDownloadEstimate} disabled={isSubmitting || estimate.grandTotal === 0}>
                       <Download className="mr-2 h-4 w-4" /> Download Estimate
                   </Button>
                    <Button type="submit" className="w-full" disabled={isSubmitting || estimate.grandTotal === 0}>
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
