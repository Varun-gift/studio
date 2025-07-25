
'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, LabelList, Cell } from 'recharts';

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
import { useAdminStats } from '@/hooks/use-admin-stats';
import { Skeleton } from '@/components/ui/skeleton';

export function AnalyticsCharts() {
  const { stats, loading } = useAdminStats();

  if (loading) {
    return (
        <div className="grid gap-6 grid-cols-1">
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
  
  const statusChartConfig = stats.bookingStatusDistribution.reduce((acc, entry) => {
    acc[entry.name] = { label: entry.name, color: entry.fill };
    return acc;
  }, {} as any);

  const generatorChartConfig = stats.generatorDistribution.reduce((acc, entry) => {
    acc[entry.name] = { label: entry.name, color: entry.fill };
    return acc;
  }, {} as any);

  return (
    <div className="grid gap-6 grid-cols-1">
      <Card>
        <CardHeader>
          <CardTitle>Booking Status Overview</CardTitle>
           <CardDescription>
            <span className="text-4xl font-bold">{stats.totalBookings}</span>
            <span className="text-muted-foreground"> Total</span>
           </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={statusChartConfig} className="h-[200px] w-full">
            <BarChart
              data={stats.bookingStatusDistribution}
              layout="vertical"
              margin={{ left: 10, right: 10, top: 10, bottom: 10 }}
            >
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tick={{ fill: 'hsl(var(--foreground))' }}
              />
              <XAxis dataKey="value" type="number" hide />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar dataKey="value" layout="vertical" radius={5}>
                 {stats.bookingStatusDistribution.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                ))}
                <LabelList
                  dataKey="value"
                  position="right"
                  offset={8}
                  className="fill-foreground"
                  fontSize={12}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle>Generator Distribution</CardTitle>
          <CardDescription>
             <span className="text-4xl font-bold">{stats.generatorDistribution.reduce((acc, curr) => acc + curr.value, 0)}%</span>
            <span className="text-muted-foreground"> Total</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={generatorChartConfig} className="h-[250px] w-full">
            <BarChart
              data={stats.generatorDistribution}
              layout="vertical"
              margin={{ left: 10, right: 40, top: 10, bottom: 10 }}
            >
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tick={{ fill: 'hsl(var(--foreground))' }}
                tickFormatter={(value) => `${value} KVA`}
              />
              <XAxis dataKey="value" type="number" hide />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Bar dataKey="value" layout="vertical" radius={5}>
                {stats.generatorDistribution.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                ))}
                <LabelList
                  dataKey="value"
                  position="right"
                  offset={8}
                  className="fill-foreground"
                  fontSize={12}
                  formatter={(value: number) => `${value}%`}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
