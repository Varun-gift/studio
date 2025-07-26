
'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GENERATORS_DATA } from '@/lib/generators';

export function ProductList() {
    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Our Generators</h1>
                <p className="text-muted-foreground">Browse our selection of reliable power solutions.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {GENERATORS_DATA.map(generator => (
                    <Card key={generator.id} className="flex flex-col overflow-hidden">
                        <CardHeader className="p-0">
                            <div className="aspect-video relative">
                                <Image
                                    src={generator.imageUrl}
                                    alt={generator.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 flex-1 flex flex-col">
                            <CardTitle className="text-xl mb-1">{generator.name}</CardTitle>
                            <CardDescription>{generator.kva} KVA</CardDescription>
                            <div className="flex-1 mt-4">
                                <p className="text-sm text-muted-foreground line-clamp-3">
                                    {generator.description}
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter className="p-4 flex justify-between items-center">
                            <div>
                                <span className="font-bold text-lg">₹{generator.pricePerHour.toLocaleString()}</span>
                                <span className="text-xs text-muted-foreground">/hour</span>
                            </div>
                            <Button asChild>
                                <Link href={`/products/${generator.id}`}>View Details</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}
