
'use client';

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useBookings } from '@/hooks/use-bookings';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';

export function WelcomeSection() {
    const { name } = useAuth();
    const { bookings, loading } = useBookings({});
    
    // Example usage data
    const rentalsThisMonth = bookings.filter(b => new Date(b.createdAt as Date).getMonth() === new Date().getMonth()).length;
    const rentalLimit = 5; // An example limit
    const progressValue = (rentalsThisMonth / rentalLimit) * 100;

    return (
        <motion.div 
            className="text-center py-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
        >
            <h1 className="text-4xl font-bold">👋 Hi {name ? name.split(' ')[0] : 'there'}, welcome back!</h1>
            
            <div className="max-w-md mx-auto mt-6 space-y-2">
                <div className="flex justify-between text-sm font-medium text-muted-foreground">
                    <span>Monthly Rental Usage</span>
                    <span>{rentalsThisMonth} of {rentalLimit} rentals</span>
                </div>
                <Progress value={progressValue} className="h-3" />
            </div>
        </motion.div>
    );
}
