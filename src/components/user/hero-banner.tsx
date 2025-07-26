
'use client';

import * as React from 'react';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';

const banners = [
  {
    src: 'https://placehold.co/1200x400.png',
    alt: 'A powerful generator ready for industrial use.',
    hint: 'industrial generator',
    title: 'Reliable Power for Any Project',
    subtitle: 'From construction sites to industrial plants, we have you covered.',
  },
  {
    src: 'https://placehold.co/1200x400.png',
    alt: 'A generator powering a large outdoor event at night.',
    hint: 'event power',
    title: 'Uninterrupted Power for Your Events',
    subtitle: 'Ensure your special occasions run smoothly with our silent generators.',
  },
  {
    src: 'https://placehold.co/1200x400.png',
    alt: 'A compact backup generator for a modern home.',
    hint: 'home backup',
    title: 'Home & Residential Backup Solutions',
    subtitle: 'Stay powered on during outages with our dependable backup generators.',
  },
];

export function HeroBanner() {
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

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
              <div className="relative h-56 sm:h-72 md:h-80 w-full">
                <Image
                  src={banner.src}
                  alt={banner.alt}
                  fill
                  className="object-cover"
                  data-ai-hint={banner.hint}
                  priority={index === 0}
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 text-white">
                  <h2 className="text-2xl md:text-4xl font-bold">{banner.title}</h2>
                  <p className="text-md md:text-lg mt-2">{banner.subtitle}</p>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
