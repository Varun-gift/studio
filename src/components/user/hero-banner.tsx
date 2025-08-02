
'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import Autoplay from "embla-carousel-autoplay"
import Image from 'next/image';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"

interface HeroBannerProps {
    onCTAClick: () => void;
}

const banners = [
    { src: "https://i.ibb.co/6yVw4z9/image.png", alt: "A powerful generator ready for industrial use.", hint: "industrial generator" },
    { src: "https://i.ibb.co/rfnf20M/image.png", alt: "A generator powering a large outdoor event at night.", hint: "outdoor event" },
    { src: "https://i.ibb.co/zJtBHT7/image.png", alt: "A compact backup generator for a modern home.", hint: "home backup" },
]

export function HeroBanner({ onCTAClick }: HeroBannerProps) {
    const plugin = React.useRef(
        Autoplay({ delay: 5000, stopOnInteraction: true })
    )

    return (
        <Carousel 
            plugins={[plugin.current]}
            className="w-full"
            onMouseEnter={plugin.current.stop}
            onMouseLeave={plugin.current.reset}
            opts={{
                loop: true,
            }}
        >
            <CarouselContent>
                {banners.map((banner, index) => (
                    <CarouselItem key={index}>
                         <div className="relative h-[40vh] md:h-[50vh] w-full">
                            <Image
                                src={banner.src}
                                alt={banner.alt}
                                fill
                                className="object-cover"
                                data-ai-hint={banner.hint}
                                priority={index === 0}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                            <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-4 sm:p-6 text-white">
                                <motion.h1 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                    className="text-3xl sm:text-4xl md:text-6xl font-extrabold"
                                >
                                    Reliable Power, On Demand
                                </motion.h1>
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.4 }}
                                    className="mt-4 text-base md:text-xl max-w-2xl"
                                >
                                    From construction sites to special events, we have the right generator for you.
                                </motion.p>
                            </div>
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
        </Carousel>
    );
}
