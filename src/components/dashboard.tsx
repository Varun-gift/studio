'use client';
import type { Dispatch, SetStateAction } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeneratorSizingTool } from '@/components/generator-sizing-tool';
import type { Generator, Rental } from '@/lib/types';
import { Badge } from './ui/badge';
import { FileText, Fuel, Zap } from 'lucide-react';

const availableGenerators: Generator[] = [
  { id: '1', model: 'GenMax 5000D', capacity: '5 kW', fuelType: 'Diesel', imageUrl: 'https://placehold.co/600x400', hourlyRate: 15, status: 'Available' },
  { id: '2', model: 'PowerUp 10000G', capacity: '10 kW', fuelType: 'Gasoline', imageUrl: 'https://placehold.co/600x400', hourlyRate: 25, status: 'Available' },
  { id: '3', model: 'QuietForce 3500P', capacity: '3.5 kW', fuelType: 'Propane', imageUrl: 'https://placehold.co/600x400', hourlyRate: 12, status: 'Rented' },
  { id: '4', model: 'MegaWatt 20D', capacity: '20 kW', fuelType: 'Diesel', imageUrl: 'https://placehold.co/600x400', hourlyRate: 40, status: 'Maintenance' },
];

const rentalHistory: Rental[] = [
  { id: 'R1', generatorModel: 'GenMax 5000D', startDate: '2023-05-01', endDate: '2023-05-05', status: 'Completed', totalCost: 1800 },
  { id: 'R2', generatorModel: 'PowerUp 10000G', startDate: '2023-06-10', endDate: '2023-06-15', status: 'Completed', totalCost: 3000 },
  { id: 'R3', generatorModel: 'GenMax 5000D', startDate: '2023-07-20', endDate: '2023-07-22', status: 'Completed', totalCost: 720 },
  { id: 'R4', generatorModel: 'QuietForce 3500P', startDate: '2023-08-01', endDate: '2023-08-10', status: 'Active', totalCost: 2880 },
];

interface DashboardProps {
  activeTab: string;
  setActiveTab: Dispatch<SetStateAction<string>>;
}

export function Dashboard({ activeTab, setActiveTab }: DashboardProps) {
  return (
    <main className="flex-1 overflow-auto p-4 md:p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="dashboard">Book a Generator</TabsTrigger>
          <TabsTrigger value="history">Rental History</TabsTrigger>
          <TabsTrigger value="sizing">Generator Sizing</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {availableGenerators.map((gen) => (
              <Card key={gen.id} className="flex flex-col">
                <CardHeader className="p-0">
                  <div className="relative h-48 w-full">
                    <Image
                      src={gen.imageUrl}
                      alt={gen.model}
                      layout="fill"
                      objectFit="cover"
                      className="rounded-t-lg"
                      data-ai-hint="generator industrial"
                    />
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-4">
                  <CardTitle>{gen.model}</CardTitle>
                  <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <span>{gen.capacity}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Fuel className="h-4 w-4 text-primary" />
                      <span>{gen.fuelType}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between items-center">
                  <p className="text-lg font-semibold">${gen.hourlyRate}<span className="text-sm font-normal text-muted-foreground">/hr</span></p>
                  <Button disabled={gen.status !== 'Available'} variant={gen.status !== 'Available' ? "secondary" : "default"}>
                    {gen.status === 'Available' ? 'Rent Now' : gen.status}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Your Rentals</CardTitle>
              <CardDescription>A log of your past and current generator rentals.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Invoice</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rentalHistory.map((rental) => (
                    <TableRow key={rental.id}>
                      <TableCell>{rental.generatorModel}</TableCell>
                      <TableCell>{rental.startDate}</TableCell>
                      <TableCell>{rental.endDate}</TableCell>
                      <TableCell>
                        <Badge variant={rental.status === 'Completed' ? 'secondary' : 'default'}>{rental.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">${rental.totalCost.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="icon" disabled={rental.status !== 'Completed'}>
                          <FileText className="h-4 w-4" />
                          <span className="sr-only">Download Invoice</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sizing">
          <GeneratorSizingTool />
        </TabsContent>
      </Tabs>
    </main>
  );
}
