
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { ArrowLeft, Clock, Minus, Plus, Power, ShoppingCart, Thermometer } from 'lucide-react';

import { GENERATORS_DATA } from '@/lib/generators';
import type { Generator } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useCart } from '@/context/cart-context';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

const formSchema = z.object({
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1.'),
  usageHours: z.coerce.number().min(1, 'Usage must be at least 1 hour.'),
});

type FormValues = z.infer<typeof formSchema>;

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { addToCart } = useCart();
  const [generator, setGenerator] = React.useState<Generator | null>(null);

  React.useEffect(() => {
    if (id) {
      const foundGenerator = GENERATORS_DATA.find(g => g.id === id);
      setGenerator(foundGenerator || null);
    }
  }, [id]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: 1,
      usageHours: 8,
    },
  });

  const onSubmit = (values: FormValues) => {
    if (generator) {
      addToCart(generator, values.quantity, values.usageHours);
      router.push('/cart');
    }
  };
  
  const handleQuantityChange = (amount: number) => {
      form.setValue('quantity', Math.max(1, form.getValues('quantity') + amount));
  }

  if (!generator) {
    return <ProductDetailSkeleton />;
  }

  return (
    <div className="min-h-screen bg-muted/40 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
            <Button variant="outline" size="sm" asChild>
                <Link href="/products">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Products
                </Link>
            </Button>
        </div>
        <Card className="overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="p-4 sm:p-6">
              <div className="aspect-square relative w-full overflow-hidden rounded-lg">
                <Image
                  src={generator.imageUrl}
                  alt={generator.name}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <div className="p-4 sm:p-6 flex flex-col">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-3xl font-bold">{generator.name}</CardTitle>
                <CardDescription className="text-lg text-muted-foreground">{generator.kva} KVA</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-0 space-y-6">
                <p className="text-foreground/80">{generator.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <Power className="h-5 w-5 text-primary" />
                        <div>
                            <p className="text-muted-foreground">Power</p>
                            <p className="font-semibold">{generator.power}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Thermometer className="h-5 w-5 text-primary" />
                         <div>
                            <p className="text-muted-foreground">Fuel</p>
                            <p className="font-semibold">{generator.fuelType}</p>
                        </div>
                    </div>
                </div>
                 <div>
                    <span className="text-3xl font-bold">₹{generator.pricePerHour.toLocaleString()}</span>
                    <span className="text-muted-foreground">/hour</span>
                </div>
              </CardContent>
              <CardFooter className="p-0 mt-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="quantity"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Quantity</FormLabel>
                                 <div className="flex items-center gap-2">
                                     <Button type="button" size="icon" variant="outline" onClick={() => handleQuantityChange(-1)} disabled={field.value <= 1}>
                                         <Minus className="h-4 w-4"/>
                                     </Button>
                                    <FormControl>
                                        <Input type="number" className="w-16 text-center" {...field} />
                                    </FormControl>
                                     <Button type="button" size="icon" variant="outline" onClick={() => handleQuantityChange(1)}>
                                         <Plus className="h-4 w-4"/>
                                     </Button>
                                 </div>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="usageHours"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Usage Hours</FormLabel>
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
                    </div>
                    <Button type="submit" size="lg" className="w-full">
                      <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
                    </Button>
                  </form>
                </Form>
              </CardFooter>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}


function ProductDetailSkeleton() {
    return (
        <div className="min-h-screen bg-muted/40 p-4 sm:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <Skeleton className="h-9 w-40" />
                </div>
                <Card className="overflow-hidden">
                <div className="grid md:grid-cols-2">
                    <div className="p-4 sm:p-6">
                         <Skeleton className="aspect-square w-full" />
                    </div>
                    <div className="p-4 sm:p-6 flex flex-col">
                    <CardHeader className="p-0 mb-4">
                        <Skeleton className="h-9 w-3/4" />
                        <Skeleton className="h-6 w-1/4 mt-2" />
                    </CardHeader>
                    <CardContent className="flex-1 p-0 space-y-6">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                         <Skeleton className="h-9 w-1/3" />
                    </CardContent>
                    <CardFooter className="p-0 mt-6">
                        <div className="w-full space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                               <Skeleton className="h-16 w-full" />
                               <Skeleton className="h-16 w-full" />
                            </div>
                            <Skeleton className="h-12 w-full" />
                        </div>
                    </CardFooter>
                    </div>
                </div>
                </Card>
            </div>
        </div>
    )
}
