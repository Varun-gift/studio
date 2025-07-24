
'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, Pie, PieChart, Cell } from 'recharts';

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
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { useAdminStats } from '@/hooks/use-admin-stats';
import { Skeleton } from '@/components/ui/skeleton';

export function AnalyticsCharts() {
  const { stats, loading } = useAdminStats();

  if (loading) {
    return (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[250px] w-full" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                     <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[250px] w-full" />
                </CardContent>
            </Card>
        </div>
    );
  }

  const lineChartConfig = {
    total: {
      label: 'Bookings',
      color: 'hsl(var(--chart-1))',
    },
  };
  
  const pieChartConfig = stats.bookingStatusDistribution.reduce((acc, entry) => {
    acc[entry.name] = { label: entry.name, color: entry.fill };
    return acc;
  }, {} as any);

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Bookings Over Time</CardTitle>
          <CardDescription>
            A monthly overview of total bookings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={lineChartConfig} className="h-[250px] w-full">
            <BarChart accessibilityLayer data={stats.bookingsOverTime}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar dataKey="total" fill="var(--color-total)" radius={8} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Booking Status Distribution</CardTitle>
          <CardDescription>
            A breakdown of all bookings by their current status.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
            <ChartContainer config={pieChartConfig} className="h-[250px] w-full">
                <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                    <Pie data={stats.bookingStatusDistribution} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
                        {stats.bookingStatusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </PieChart>
            </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
