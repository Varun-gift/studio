
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { PlusCircle, MoreHorizontal, Loader2 } from 'lucide-react';
import Image from 'next/image';

import { useGenerators } from '@/hooks/use-generators';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Generator } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

const generatorSchema = z.object({
  name: z.string().min(1, 'Generator name is required.'),
  kva: z.string().min(1, 'KVA rating is required.'),
  imageUrl: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
  description: z.string().min(1, 'Description is required.'),
  power: z.string().min(1, 'Power output is required.'),
  output: z.string().min(1, 'Voltage/Phase is required.'),
  fuelType: z.enum(['Diesel', 'Gasoline', 'Propane']),
  basePrice: z.number().min(0, 'Base price cannot be negative.'),
  pricePerAdditionalHour: z.number().min(0, 'Price cannot be negative.'),
});

type GeneratorFormValues = z.infer<typeof generatorSchema>;

export function GeneratorManager() {
  const { generators, loading: loadingGenerators } = useGenerators();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingGenerator, setEditingGenerator] = React.useState<Generator | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<GeneratorFormValues>({
    resolver: zodResolver(generatorSchema),
    defaultValues: {
      name: '',
      kva: '',
      imageUrl: '',
      description: '',
      power: '',
      output: '',
      fuelType: 'Diesel',
      basePrice: 0,
      pricePerAdditionalHour: 0,
    },
  });

  React.useEffect(() => {
    if (editingGenerator) {
      form.reset(editingGenerator);
    } else {
      form.reset({
        name: '',
        kva: '',
        imageUrl: '',
        description: '',
        power: '',
        output: '',
        fuelType: 'Diesel',
        basePrice: 0,
        pricePerAdditionalHour: 0,
      });
    }
  }, [editingGenerator, form]);

  const handleAddNew = () => {
    setEditingGenerator(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (generator: Generator) => {
    setEditingGenerator(generator);
    setIsDialogOpen(true);
  };

  const handleDelete = async (generatorId: string) => {
    if (!window.confirm('Are you sure you want to delete this generator?')) return;
    try {
      await deleteDoc(doc(db, 'generators', generatorId));
      toast({ title: 'Generator Deleted', description: 'The generator has been removed.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete generator.', variant: 'destructive' });
    }
  };

  async function onSubmit(values: GeneratorFormValues) {
    setIsLoading(true);
    const dataToSave = { 
        ...values, 
        basePrice: Number(values.basePrice),
        pricePerAdditionalHour: Number(values.pricePerAdditionalHour),
    };
    try {
      if (editingGenerator) {
        const generatorRef = doc(db, 'generators', editingGenerator.id);
        await updateDoc(generatorRef, dataToSave);
        toast({ title: 'Generator Updated', description: 'Generator details have been saved.' });
      } else {
        await addDoc(collection(db, 'generators'), dataToSave);
        toast({ title: 'Generator Added', description: 'New generator has been added.' });
      }
      setIsDialogOpen(false);
      setEditingGenerator(null);
    } catch (error) {
      console.error('Error saving generator:', error);
      toast({ title: 'Error', description: 'Failed to save generator details.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Generator Management</CardTitle>
              <CardDescription>
                Add, edit, and manage available generators for rental.
              </CardDescription>
            </div>
            <Button size="sm" className="gap-1" onClick={handleAddNew}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Add Generator
              </span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  Image
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>KVA</TableHead>
                <TableHead>Base Price</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingGenerators ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : generators.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No generators found.
                  </TableCell>
                </TableRow>
              ) : (
                generators.map((generator) => (
                  <TableRow key={generator.id}>
                    <TableCell className="hidden sm:table-cell">
                      <Image
                        alt={generator.name}
                        className="aspect-square rounded-md object-cover"
                        height="64"
                        src={generator.imageUrl || '/placeholder.svg'}
                        width="64"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{generator.name}</TableCell>
                    <TableCell>{generator.kva}</TableCell>
                    <TableCell>₹{generator.basePrice.toLocaleString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEdit(generator)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(generator.id)}>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingGenerator ? 'Edit Generator' : 'Add New Generator'}</DialogTitle>
            <DialogDescription>
              Fill in the details for the generator below.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Generator Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Compact Powerhouse 62" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="kva"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>KVA Rating</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 62" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/image.png" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the generator..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <div className="grid grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="power"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Power (kW)</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., 49.6 kW" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="output"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Output</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., 240V, Single-Phase" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="basePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Price (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="pricePerAdditionalHour"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price Per Add. Hour (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(e.target.valueAsNumber)}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter className="sticky bottom-0 bg-background pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingGenerator ? 'Save Changes' : 'Add Generator'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
