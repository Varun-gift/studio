
'use client';

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useBookings } from '@/hooks/use-bookings';
import { GENERATORS_DATA } from '@/lib/generators';
import { Generator } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { ArrowRight, Star } from 'lucide-react';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

interface RecommendedForYouProps {
    setActiveTab: (tab: string) => void;
}

export function RecommendedForYou({ setActiveTab }: RecommendedForYouProps) {
    const { user } = useAuth();
    const { bookings, loading } = useBookings({ status: null }); // Fetch all bookings for the user
    const [recommendations, setRecommendations] = React.useState<Generator[]>([]);

    React.useEffect(() => {
        if (!loading && bookings.length > 0) {
            const kvaFrequency: { [key: string]: number } = {};

            bookings.forEach(booking => {
                booking.generators.forEach(genGroup => {
                    kvaFrequency[genGroup.kvaCategory] = (kvaFrequency[genGroup.kvaCategory] || 0) + genGroup.quantity;
                });
            });

            const sortedKva = Object.keys(kvaFrequency).sort((a, b) => kvaFrequency[b] - kvaFrequency[a]);
            const topKva = sortedKva.slice(0, 5); // Get top 5 most rented KVA types

            const recommendedGenerators = GENERATORS_DATA.filter(gen => topKva.includes(gen.kva));
            
            if (recommendedGenerators.length === 0) {
                 setRecommendations(GENERATORS_DATA.slice(0, 5));
            } else {
                 setRecommendations(recommendedGenerators);
            }
        } else if (!loading) {
             setRecommendations(GENERATORS_DATA.slice(0, 5));
        }
    }, [bookings, loading]);

    if (loading) {
        return (
            <div>
                <Skeleton className="h-8 w-1/3 mb-4" />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card><Skeleton className="h-64" /></Card>
                    <Card><Skeleton className="h-64" /></Card>
                    <Card><Skeleton className="h-64" /></Card>
                </div>
            </div>
        );
    }
    
    if (recommendations.length === 0) {
        return null;
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Star className="text-primary" />
                Recommended for You
            </h2>
             <Carousel
                opts={{
                    align: "start",
                    loop: true,
                }}
                className="w-full"
            >
                <CarouselContent className="-ml-4">
                    {recommendations.map((gen, index) => (
                         <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                            <div className="p-1">
                                <Card className="flex flex-col overflow-hidden h-full">
                                    <div className="relative h-48 w-full">
                                        <Image src={gen.imageUrl} alt={gen.name} fill className="object-cover" />
                                    </div>
                                    <CardHeader>
                                        <CardTitle>{gen.name}</CardTitle>
                                        <CardDescription>{gen.kva} KVA</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1">
                                        <p className="text-sm text-muted-foreground line-clamp-3">
                                            {gen.description}
                                        </p>
                                    </CardContent>
                                    <CardContent>
                                        <Button className="w-full" onClick={() => setActiveTab('booking')}>
                                            Book Now <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
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
