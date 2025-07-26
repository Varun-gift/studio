
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Power, Building, Tent, Shield } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

const recommendations = [
  {
    title: 'Most Booked for Events',
    description: '125 KVA - Silent & Compact',
    icon: Tent,
    color: 'text-purple-500',
    bg: 'bg-purple-50',
  },
  {
    title: 'Top for Construction',
    description: '250 KVA - Robust & Powerful',
    icon: Building,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
  },
  {
    title: 'Reliable Home Backup',
    description: '62.5 KVA - Quiet & Efficient',
    icon: Shield,
    color: 'text-green-500',
    bg: 'bg-green-50',
  },
   {
    title: 'Industrial Standard',
    description: '500 KVA - Heavy Duty',
    icon: Power,
    color: 'text-red-500',
    bg: 'bg-red-50',
  },
];

export function Recommendations() {
  return (
    <div className="space-y-4">
        <h2 className="text-3xl font-bold text-center">Recommended for You</h2>
         <Carousel
            opts={{
                align: "start",
                loop: true,
            }}
            className="w-full"
            >
            <CarouselContent>
                {recommendations.map((rec, index) => (
                    <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                        <div className="p-1">
                            <Card className="hover:shadow-lg transition-shadow rounded-2xl">
                                <CardContent className="flex items-center gap-4 p-6">
                                    <div className={`p-4 rounded-full ${rec.bg}`}>
                                        <rec.icon className={`h-8 w-8 ${rec.color}`} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{rec.title}</CardTitle>
                                        <CardDescription className="text-primary font-semibold">{rec.description}</CardDescription>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
            </Carousel>
    </div>
  );
}
