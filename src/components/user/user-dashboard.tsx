
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Power, MessageSquare, Wrench } from 'lucide-react';
import { HeroSection } from './dashboard/hero-section';
import { WelcomeSection } from './dashboard/welcome-section';
import { RecentActivity } from './dashboard/recent-activity';
import { Recommendations } from './dashboard/recommendations';
import { UsageSummary } from './dashboard/usage-summary';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { GeneratorSizingTool } from '../generator-sizing-tool';
import { Dialog, DialogContent, DialogTrigger } from '../ui/dialog';

interface UserDashboardProps {
    setActiveTab: (tab: string) => void;
}

export function UserDashboard({ setActiveTab }: UserDashboardProps) {
    const [isScrolled, setIsScrolled] = React.useState(false);

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 400);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="space-y-8 md:space-y-12">
            <HeroSection onCTAClick={() => setActiveTab('booking')} />
            
            <div className="container mx-auto px-4 space-y-12">
                <WelcomeSection />

                <div className="text-center">
                     <Button 
                        size="lg" 
                        className="h-14 text-lg w-full sm:w-auto rounded-full shadow-lg shadow-primary/30 transform hover:scale-105 transition-transform" 
                        onClick={() => setActiveTab('booking')}
                    >
                        <Power className="mr-3 h-6 w-6" />
                        Book New Generator
                    </Button>
                </div>
                
                <RecentActivity onCTAClick={() => setActiveTab('history')} />
                
                <Recommendations />

                <UsageSummary />

                 <div className="text-center py-8">
                    <Dialog>
                        <DialogTrigger asChild>
                             <Button 
                                size="lg" 
                                variant="outline"
                                className="h-12 text-md w-full sm:w-auto rounded-full shadow-lg"
                            >
                                <Wrench className="mr-3 h-5 w-5" />
                                Generator Sizing Calculator
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[625px]">
                            <GeneratorSizingTool />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Floating Buttons */}
             <AnimatePresence>
                {isScrolled && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50"
                    >
                         <Button 
                            className="rounded-full h-14 w-14 shadow-xl"
                            onClick={() => setActiveTab('booking')}
                        >
                            <Power className="h-6 w-6" />
                         </Button>
                    </motion.div>
                )}
            </AnimatePresence>

             <div className="fixed bottom-6 right-4 md:bottom-6 md:right-24 z-50">
                 <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                       <Button 
                            variant="secondary"
                            className="rounded-full h-14 w-14 shadow-xl bg-secondary hover:bg-secondary/90"
                            onClick={() => setActiveTab('support')}
                        >
                            <MessageSquare className="h-6 w-6 text-secondary-foreground" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Need Help?</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
            </div>

        </div>
    );
}
