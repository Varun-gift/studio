
'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';

interface HeroSectionProps {
    onCTAClick: () => void;
}

const banners = [
  {
    src: 'https://placehold.co/1200x600',
    alt: 'A powerful generator ready for industrial use.',
    hint: 'industrial power',
    title: 'Powering Your World',
    subtitle: 'Industrial | Events | Backup',
  },
  {
    src: 'https://placehold.co/1200x600',
    alt: 'A generator powering a large outdoor event at night.',
    hint: 'outdoor event',
    title: 'Uninterrupted Excellence',
    subtitle: 'Construction | Residential | Commercial',
  },
  {
    src: 'https://placehold.co/1200x600',
    alt: 'A compact backup generator for a modern home.',
    hint: 'home generator',
    title: 'Reliability On Demand',
    subtitle: 'Quiet | Efficient | Powerful',
  },
];

const subtitles = ["Industrial", "Events", "Backup", "Construction", "Residential", "Commercial"];

export function HeroSection({ onCTAClick }: HeroSectionProps) {
    const plugin = React.useRef(Autoplay({ delay: 4000, stopOnInteraction: true }));
    const [currentSubtitle, setCurrentSubtitle] = React.useState(0);

     React.useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSubtitle((prev) => (prev + 1) % subtitles.length);
        }, 2000); // Change subtitle every 2 seconds
        return () => clearInterval(interval);
    }, []);

    const useParallax = (value: any, distance: number) => {
        // A simple parallax implementation would require more complex state management
        // and access to the carousel's scroll progress, which is outside the scope here.
        // This is a placeholder for a true parallax effect.
        return value;
    };

  return (
    <div className="w-full -mt-4 sm:-mt-8">
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
                    style={{ background: 'linear-gradient(to bottom, hsla(206, 83%, 97%, 0.1), hsla(201, 65%, 85%, 0.6))' }}
                />
                <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 md:p-10 text-black">
                  <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-4xl md:text-6xl font-extrabold"
                  >
                    Powering Your World
                  </motion.h1>
                  <motion.div
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     transition={{ duration: 0.5, delay: 0.4 }}
                     className="mt-4 text-lg md:text-xl font-medium text-brand-blue-darker"
                   >
                     <AnimatePresence mode="wait">
                        <motion.span
                            key={currentSubtitle}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            {subtitles[currentSubtitle]}
                        </motion.span>
                    </AnimatePresence>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                     className="mt-8"
                  >
                    <Button 
                        size="lg" 
                        onClick={onCTAClick}
                        className="h-12 text-lg rounded-full shadow-lg shadow-primary/40 hover:bg-brand-orange-light transform hover:scale-105 transition-all"
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
