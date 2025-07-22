
'use client';
import type { Dispatch, SetStateAction } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeneratorSizingTool } from '@/components/generator-sizing-tool';
import type { Rental } from '@/lib/types';
import { Badge } from './ui/badge';
import { FileText } from 'lucide-react';
import { BookingForm } from './booking-form';

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
          <TabsTrigger value="dashboard">New Booking</TabsTrigger>
          <TabsTrigger value="history">Rental History</TabsTrigger>
          <TabsTrigger value="sizing">Generator Sizing</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard">
          <BookingForm />
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
