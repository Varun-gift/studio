
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { PlusCircle, MoreHorizontal, Loader2 } from 'lucide-react';
import Image from 'next/image';

import { useAddons } from '@/hooks/use-addons';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Addon } from '@/lib/types';
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
import { Skeleton } from '@/components/ui/skeleton';

const addonSchema = z.object({
  name: z.string().min(1, 'Add-on name is required.'),
  price: z.number().min(0, 'Price cannot be negative.'),
  unit: z.string().min(1, 'Unit is required (e.g., per item, per set).'),
  imageUrl: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
});

type AddonFormValues = z.infer<typeof addonSchema>;

export function AddonManager() {
  const { addons, loading: loadingAddons } = useAddons();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingAddon, setEditingAddon] = React.useState<Addon | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<AddonFormValues>({
    resolver: zodResolver(addonSchema),
    defaultValues: {
      name: '',
      price: 0,
      unit: '',
      imageUrl: '',
    },
  });

  React.useEffect(() => {
    if (editingAddon) {
      form.reset({
          name: editingAddon.name,
          price: editingAddon.price,
          unit: editingAddon.unit,
          imageUrl: editingAddon.imageUrl,
      });
    } else {
      form.reset({
        name: '',
        price: 0,
        unit: '',
        imageUrl: '',
      });
    }
  }, [editingAddon, form]);

  const handleAddNew = () => {
    setEditingAddon(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (addon: Addon) => {
    setEditingAddon(addon);
    setIsDialogOpen(true);
  };

  const handleDelete = async (addonId: string) => {
    if (!window.confirm('Are you sure you want to delete this add-on?')) return;
    try {
      await deleteDoc(doc(db, 'addons', addonId));
      toast({ title: 'Add-on Deleted', description: 'The add-on has been removed.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete add-on.', variant: 'destructive' });
    }
  };

  async function onSubmit(values: AddonFormValues) {
    setIsLoading(true);
    const dataToSave = { ...values, price: Number(values.price) };
    try {
      if (editingAddon) {
        const addonRef = doc(db, 'addons', editingAddon.id);
        await updateDoc(addonRef, dataToSave);
        toast({ title: 'Add-on Updated', description: 'Add-on details have been saved.' });
      } else {
        await addDoc(collection(db, 'addons'), dataToSave);
        toast({ title: 'Add-on Added', description: 'New add-on has been added.' });
      }
      setIsDialogOpen(false);
      setEditingAddon(null);
    } catch (error) {
      console.error('Error saving add-on:', error);
      toast({ title: 'Error', description: 'Failed to save add-on details.', variant: 'destructive' });
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
              <CardTitle>Add-on Management</CardTitle>
              <CardDescription>
                Add, edit, and manage rental add-on items.
              </CardDescription>
            </div>
            <Button size="sm" className="gap-1" onClick={handleAddNew}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Add Item
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
                <TableHead>Price</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingAddons ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : addons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No add-ons found.
                  </TableCell>
                </TableRow>
              ) : (
                addons.map((addon) => (
                  <TableRow key={addon.id}>
                    <TableCell className="hidden sm:table-cell">
                      <Image
                        alt={addon.name}
                        className="aspect-square rounded-md object-cover"
                        height="64"
                        src={addon.imageUrl || '/placeholder.svg'}
                        width="64"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{addon.name}</TableCell>
                    <TableCell>₹{addon.price.toLocaleString()}</TableCell>
                    <TableCell>{addon.unit}</TableCell>
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
                          <DropdownMenuItem onClick={() => handleEdit(addon)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(addon.id)}>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAddon ? 'Edit Add-on' : 'Add New Add-on'}</DialogTitle>
            <DialogDescription>
              Fill in the details for the item below.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Metal Lights" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., per set" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingAddon ? 'Save Changes' : 'Add Item'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
