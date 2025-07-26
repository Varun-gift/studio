
'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, ResponsiveContainer, LabelList } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useBookings } from '@/hooks/use-bookings';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const chartConfig = {
  rentals: {
    label: "Rentals",
    color: "hsl(var(--chart-1))",
  },
  hours: {
    label: "Hours",
    color: "hsl(var(--chart-2))",
  },
} satisfies any;


export function UsageSummary() {
  const { bookings, loading } = useBookings({});

  const chartData = React.useMemo(() => {
    const monthlyData: { [key: string]: { month: string; rentals: number; hours: number } } = {};

    bookings.forEach(booking => {
        const month = format(new Date(booking.createdAt as Date), 'MMM');
        if (!monthlyData[month]) {
            monthlyData[month] = { month, rentals: 0, hours: 0 };
        }
        monthlyData[month].rentals += 1;
        const totalHours = booking.generators.reduce((sum, gen) => {
             if (Array.isArray(gen.usageHours)) {
                return sum + gen.usageHours.reduce((hSum, h) => hSum + (h || 0), 0);
            }
            return sum + (Number(gen.usageHours) || 0);
        }, 0);
        monthlyData[month].hours += totalHours;
    });

    return Object.values(monthlyData).slice(-6); // Last 6 months
  }, [bookings]);

  if (loading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  const totalRentals = chartData.reduce((acc, curr) => acc + curr.rentals, 0);

  return (
    <Card className="shadow-lg rounded-2xl">
      <CardHeader>
        <CardTitle>This Month’s Usage</CardTitle>
        <CardDescription>
          You powered <span className="font-bold text-primary">{totalRentals}</span> projects this month!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart data={chartData} margin={{top: 20}}>
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                />
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="rentals" fill="var(--color-rentals)" radius={8}>
                    <LabelList
                        position="top"
                        offset={12}
                        className="fill-foreground"
                        fontSize={12}
                    />
                </Bar>
            </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
