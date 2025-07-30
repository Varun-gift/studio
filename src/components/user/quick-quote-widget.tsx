
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Download, Calculator, Loader2, ArrowRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const KVA_CATEGORIES = ['62', '125', '180', '250', '320', '380', '500'];
const PRICE_PER_HOUR_PER_KVA = 4;
const GST_RATE = 0.18;

const quickQuoteSchema = z.object({
  kvaCategory: z.string({ required_error: 'Please select a KVA category.' }),
  quantity: z.coerce.number().min(1, 'Min 1.'),
  usageHours: z.coerce.number().min(1, 'Min 1 hour.'),
});

type QuickQuoteValues = z.infer<typeof quickQuoteSchema>;

interface QuickQuoteWidgetProps {
    setActiveTab: (tab: string) => void;
}

export function QuickQuoteWidget({ setActiveTab }: QuickQuoteWidgetProps) {
  const [estimatedCost, setEstimatedCost] = React.useState(0);

  const form = useForm<QuickQuoteValues>({
    resolver: zodResolver(quickQuoteSchema),
    defaultValues: {
      kvaCategory: '125',
      quantity: 1,
      usageHours: 8,
    },
  });

  const watchedValues = form.watch();

  React.useEffect(() => {
    const { kvaCategory, quantity, usageHours } = watchedValues;
    if (kvaCategory && quantity > 0 && usageHours > 0) {
      const kvaValue = parseInt(kvaCategory, 10);
      const subtotal = kvaValue * PRICE_PER_HOUR_PER_KVA * usageHours * quantity;
      const total = subtotal * (1 + GST_RATE);
      setEstimatedCost(total);
    } else {
        setEstimatedCost(0);
    }
  }, [watchedValues]);

  const handlePdfDownload = () => {
    const values = form.getValues();
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.text('Quick Quote Estimate', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Generator: ${values.quantity} x ${values.kvaCategory} KVA`, 20, 40);
    doc.text(`Usage: ${values.usageHours} hours`, 20, 47);
    
    doc.setFontSize(16);
    doc.text(`Total Estimated Cost (incl. GST): INR ${estimatedCost.toFixed(2)}`, 20, 65);

    doc.save('quick-quote.pdf');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 hidden lg:block">
      <Card className="w-80 shadow-2xl">
        <Form {...form}>
          <form>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator className="h-5 w-5" />
                Quick Quote
              </CardTitle>
              <CardDescription>Get an instant cost estimate.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="kvaCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Generator</FormLabel>
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
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} min="1" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="usageHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hours</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} min="1" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Estimated Cost</span>
                    <span className="font-bold text-xl">₹{estimatedCost.toFixed(2)}</span>
                  </div>
                   <p className="text-xs text-muted-foreground text-right">incl. 18% GST</p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
               <Button type="button" className="w-full" onClick={() => setActiveTab('booking')}>
                  Go to Full Booking Form <ArrowRight className="ml-2 h-4 w-4" />
               </Button>
               <Button type="button" variant="outline" onClick={handlePdfDownload} className="w-full">
                 <Download className="mr-2 h-4 w-4"/>
                 Download Quote
               </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
