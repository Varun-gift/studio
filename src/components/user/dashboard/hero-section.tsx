
'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Autoplay from "embla-carousel-autoplay"
import Image from 'next/image';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"

interface HeroSectionProps {
    onCTAClick: () => void;
}

const banners = [
    { 
        src: "https://placehold.co/1200x500", 
        alt: "A powerful generator ready for industrial use.", 
        hint: "industrial generator",
        headline: "Powering Your World",
    },
    { 
        src: "https://placehold.co/1200x500", 
        alt: "A generator powering a large outdoor event at night.", 
        hint: "outdoor event",
        headline: "Reliability On-Site",
    },
    { 
        src: "https://placehold.co/1200x500", 
        alt: "A compact backup generator for a modern home.", 
        hint: "home backup",
        headline: "Uninterrupted Service",
    },
]

const subtitles = ["Industrial", "Events", "Backup"];

export function HeroSection({ onCTAClick }: HeroSectionProps) {
    const plugin = React.useRef(
        Autoplay({ delay: 5000, stopOnInteraction: true })
    );

    const [currentSubtitle, setCurrentSubtitle] = React.useState(0);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSubtitle((prev) => (prev + 1) % subtitles.length);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative w-full overflow-hidden rounded-b-3xl">
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
                             <div className="relative h-[60vh] md:h-[70vh] w-full">
                                <Image
                                    src={banner.src}
                                    alt={banner.alt}
                                    fill
                                    className="object-cover"
                                    data-ai-hint={banner.hint}
                                    priority={index === 0}
                                />
                                <div 
                                    className="absolute inset-0"
                                    style={{ background: 'linear-gradient(to top, hsla(202, 78%, 58%, 0.1), hsla(206, 88%, 97%, 0.3))' }}
                                />
                                <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-4">
                                    <motion.h1 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
                                        className="text-4xl md:text-6xl font-extrabold text-black"
                                    >
                                        {banner.headline}
                                    </motion.h1>
                                    <motion.p
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
                                      className="mt-4 text-lg md:text-xl font-medium text-brand-blue-darker"
                                    >
                                      <AnimatePresence mode="wait">
                                        <motion.span
                                            key={currentSubtitle}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.3 }}
                                            className="inline-block"
                                        >
                                            {subtitles[currentSubtitle]}
                                        </motion.span>
                                      </AnimatePresence>
                                    </motion.p>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 0.6 }}
                                        className="mt-8"
                                    >
                                        <Button 
                                            size="lg" 
                                            onClick={onCTAClick} 
                                            className="bg-brand-orange-primary text-white hover:bg-brand-orange-light rounded-full shadow-lg shadow-brand-orange-primary/30 h-14 px-8 text-base"
                                        >
                                            Explore Options
                                        </Button>
                                    </motion.div>
                                </div>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </div>
    );
}
