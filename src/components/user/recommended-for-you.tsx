
'use client';

import * as React from 'react';
import { useBookings } from '@/hooks/use-bookings';
import { useGenerators } from '@/hooks/use-generators';
import { Generator } from '@/lib/types';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem } from '../ui/carousel';

interface RecommendedForYouProps {
    setActiveTab: (tab: string) => void;
}

export function RecommendedForYou({ setActiveTab }: RecommendedForYouProps) {
    const { bookings, loading: loadingBookings } = useBookings({ status: null });
    const { generators, loading: loadingGenerators } = useGenerators();
    const [recommendations, setRecommendations] = React.useState<Generator[]>([]);

    React.useEffect(() => {
        const loading = loadingBookings || loadingGenerators;
        if (!loading && generators.length > 0) {
            if (bookings.length > 0) {
                const kvaFrequency: { [key: string]: number } = {};

                bookings.forEach(booking => {
                    booking.generators.forEach(genGroup => {
                        kvaFrequency[genGroup.kvaCategory] = (kvaFrequency[genGroup.kvaCategory] || 0) + 1; // Simplified from quantity
                    });
                });

                const sortedKva = Object.keys(kvaFrequency).sort((a, b) => kvaFrequency[b] - kvaFrequency[a]);
                const topKva = sortedKva.slice(0, 5);

                const recommendedGenerators = generators.filter(gen => topKva.includes(gen.kva));
                
                setRecommendations(recommendedGenerators.length > 0 ? recommendedGenerators : generators.slice(0, 5));
            } else {
                setRecommendations(generators.slice(0, 5));
            }
        }
    }, [bookings, generators, loadingBookings, loadingGenerators]);

    if (loadingGenerators) {
        return (
            <div>
                <Skeleton className="h-8 w-1/3 mb-4" />
                <div className="flex gap-4 overflow-hidden">
                    <Skeleton className="h-64 w-60" />
                    <Skeleton className="h-64 w-60" />
                    <Skeleton className="h-64 w-60" />
                </div>
            </div>
        );
    }
    
    if (recommendations.length === 0) {
        return null;
    }

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">
                Recommended for You
            </h2>
            <Carousel opts={{ align: "start", loop: false }}>
                <CarouselContent className="-ml-4">
                    {recommendations.map((gen, index) => (
                        <CarouselItem key={index} className="pl-4 basis-2/3 sm:basis-1/3 lg:basis-1/4">
                             <Card className="flex flex-col overflow-hidden h-full">
                                <CardContent className="p-0">
                                    <div className="relative h-32 w-full">
                                        <Image src={gen.imageUrl} alt={gen.name} fill className="object-cover" />
                                    </div>
                                    <div className="p-4 space-y-2 flex flex-col flex-1">
                                        <div>
                                            <p className="font-semibold">{gen.kva} KVA</p>
                                            <p className="text-sm text-muted-foreground">{gen.name.split(' ')[0]}</p>
                                            <p className="text-xs text-muted-foreground">{gen.description.split('.')[0]}</p>
                                        </div>
                                        <div className="flex-grow"></div>
                                        <Button size="sm" variant="secondary" className="w-full mt-auto" onClick={() => setActiveTab('booking')}>
                                            Book Now
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </div>
    );
}
