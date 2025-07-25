
'use client';

import * as React from 'react';
import { format, formatDistanceStrict } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import type { Booking, TimerLog } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface TimerLogsViewProps {
  booking: Booking;
  onBack: () => void;
}

export function TimerLogsView({ booking, onBack }: TimerLogsViewProps) {

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0m';
    return formatDistanceStrict(new Date(0), new Date(seconds * 1000), { unit: 'minutes' });
  };
  
  const formatTime = (date?: Date) => {
      if(!date) return 'N/A';
      return format(date, 'hh:mm a');
  }

  const DetailRow = ({ label, value }: { label: string, value: React.ReactNode }) => (
      <div className="flex justify-between items-center py-3">
          <p className="text-muted-foreground">{label}</p>
          <p className="font-medium">{value}</p>
      </div>
  )

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <div className="flex items-center gap-4 p-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Timer Logs</h1>
      </div>
      
      <div className="space-y-6 px-4">
        {booking.timers && booking.timers.length > 0 ? (
            booking.timers.map((timer, index) => (
                <div key={timer.id} className="space-y-2">
                    <h2 className="text-lg font-semibold">Generator {index + 1}</h2>
                    <Card>
                        <CardContent className="p-4 divide-y">
                           <DetailRow label="Generator ID" value={timer.generatorId} />
                           <DetailRow label="Start Time" value={formatTime(timer.startTime)} />
                           <DetailRow label="End Time" value={formatTime(timer.endTime)} />
                           <DetailRow label="Duration" value={formatDuration(timer.duration || 0)} />
                           <DetailRow label="Status" value={<span className="capitalize">{timer.status}</span>} />
                        </CardContent>
                    </Card>
                </div>
            ))
        ) : (
            <p className="text-center text-muted-foreground py-8">No timer logs available.</p>
        )}
      </div>
    </div>
  );
}
