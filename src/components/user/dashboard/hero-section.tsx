
'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

export function HeroSection() {
    return (
        <div className="relative w-full h-[25vh] md:h-[30vh]">
            <Image
                src="https://i.ibb.co/6yVw4z9/image.png"
                alt="Generator Rentals"
                fill
                className="object-cover"
                data-ai-hint="generator"
                priority
            />
            <div 
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, hsla(0, 0%, 0%, 0.6), transparent)' }}
            />
            <div className="absolute bottom-0 left-0 p-4 md:p-6">
                <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
                    className="text-3xl md:text-4xl font-bold text-white"
                >
                    Powering Your World
                </motion.h1>
            </div>
        </div>
    );
}
