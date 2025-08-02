
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { StatsCards } from './stats-cards';
import { DriverManager } from './driver-manager';
import { BookingsView } from './bookings-view';
import type { Booking } from '@/lib/types';
import { ArrowLeft, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { AnalyticsCharts } from './analytics-charts';
import { useBookings } from '@/hooks/use-bookings';
import { fetchRuntimeStats, updateBooking } from '@/app/actions';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';
import { CSVLink } from 'react-csv';

const REFETCH_INTERVAL = 60000; // 1 minute

type View = 'dashboard' | 'bookings' | 'drivers';
type BookingFilter = Booking['status'] | 'all' | null;


export function AdminDashboard() {
  const [view, setView] = useState<View>('dashboard');
  const [bookingFilter, setBookingFilter] = useState<BookingFilter>(null);
  const { bookings, loading } = useBookings();
  const [imeiFilter, setImeiFilter] = useState('');
  const [driverFilter, setDriverFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Effect to check for missing runtime_stats and fetch/update periodically
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && bookings) {
        bookings.forEach(async (booking) => {
          if (!booking.runtime_stats && booking.imei) {
            console.log(`Fetching runtime stats for booking ${booking.booking_id} with IMEI ${booking.imei}`);
            try {
              const runtimeStats = await fetchRuntimeStats(booking.imei);
              if (runtimeStats) {
                console.log('Fetched runtime stats:', runtimeStats);
                // Update the existing booking with runtime_stats
                await updateBooking({
                  ...booking,
                  runtime_stats: runtimeStats,
                });
                console.log(`Updated booking ${booking.booking_id} with runtime stats.`);
              } else {
                console.warn(`No runtime stats returned for IMEI ${booking.imei}`);
              }
            } catch (error) {
              console.error(`Error fetching or updating runtime stats for booking ${booking.booking_id}:`, error);
            }
          }
        });
      }
    }, REFETCH_INTERVAL);

    return () => clearInterval(interval);
  }, [bookings, loading]); // Re-run effect if bookings or loading state changes

  const filteredBookings = bookings?.filter(booking => {
    const imeiMatch = imeiFilter === '' || booking.imei?.toLowerCase().includes(imeiFilter.toLowerCase());
    const driverMatch = driverFilter === '' || booking.driver_id?.toLowerCase().includes(driverFilter.toLowerCase()); // Assuming driver_id is the name or can be used to filter
    const vehicleMatch = vehicleFilter === '' || booking.vehicle_id?.toLowerCase().includes(vehicleFilter.toLowerCase()); // Assuming vehicle_id can be used to filter
    const dateMatch = dateFilter === '' || (booking.start_time && format(new Date(booking.start_time), 'yyyy-MM-dd').includes(dateFilter));

    return imeiMatch && driverMatch && vehicleMatch && dateMatch;
  }) || [];

  const runtimeDataForExport = filteredBookings.map(booking => ({
    BookingID: booking.booking_id,
    IMEI: booking.imei,
    Status: booking.runtime_stats?.Current_Status,
    EngineONHours: booking.runtime_stats?.Engine_ON_hours,
    DGName: booking.runtime_stats?.DG_Name,
  }));


  const handleCardClick = (targetView: View, filter?: Booking['status']) => {
    setView(targetView);
    setBookingFilter(filter === null ? 'all' : filter);
  }
  
  const handleBack = () => {
      setView('dashboard');
      setBookingFilter(null);
  }

  if (view !== 'dashboard') {
    return (
        <div className="space-y-4">
             <Button variant="outline" size="sm" onClick={handleBack} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
             </Button>
            {view === 'bookings' && <BookingsView initialFilter={bookingFilter} />}
            {view === 'drivers' && <DriverManager />}
        </div>
    );
  }

  const renderStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'ON':
        return (
          <Badge variant="secondary" className="bg-green-500 text-white">
            <CheckCircle className="mr-1 h-3 w-3" /> ON
          </Badge>
        );
      case 'OFF':
        return (
          <Badge variant="secondary" className="bg-red-500 text-white">
            <XCircle className="mr-1 h-3 w-3" /> OFF
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-gray-500 text-white">
            <Clock className="mr-1 h-3 w-3" /> Awaiting Sync
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
        <div>
            <h2 className="text-xl font-bold mb-4">Generator Activity Summary</h2>
            <div className="flex space-x-4 mb-4">
                <Input
                    placeholder="Filter by IMEI"
                    value={imeiFilter}
                    onChange={(e) => setImeiFilter(e.target.value)}
                    className="max-w-sm"
                />
                 <Input
                    placeholder="Filter by Driver ID"
                    value={driverFilter}
                    onChange={(e) => setDriverFilter(e.target.value)}
                    className="max-w-sm"
                />
                <Input
                    placeholder="Filter by Vehicle ID"
                    value={vehicleFilter}
                    onChange={(e) => setVehicleFilter(e.target.value)}
                    className="max-w-sm"
                />
                 <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="max-w-sm"
                />
                <CSVLink data={runtimeDataForExport} filename={"generator_activity.csv"}>
                    <Button variant="outline">Export CSV</Button>
                </CSVLink>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Booking ID</TableHead>
                        <TableHead>IMEI</TableHead>
                        <TableHead>Driver ID</TableHead>
                        <TableHead>Vehicle ID</TableHead>
                        <TableHead>Start Time</TableHead>
                        <TableHead>End Time</TableHead>
                        <TableHead>Current Status</TableHead>
                        <TableHead>Engine ON Hours</TableHead>
                        <TableHead>DG Name</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredBookings.map((booking) => (
                        <TableRow key={booking.booking_id}>
                            <TableCell>{booking.booking_id}</TableCell>
                            <TableCell>{booking.imei}</TableCell>
                            <TableCell>{booking.driver_id}</TableCell>
                            <TableCell>{booking.vehicle_id}</TableCell>
                            <TableCell>{booking.start_time ? format(new Date(booking.start_time), 'yyyy-MM-dd HH:mm') : 'N/A'}</TableCell> {/* Adjusted format */}
                            <TableCell>{booking.end_time ? format(new Date(booking.end_time), 'yyyy-MM-dd HH:mm') : 'N/A'}</TableCell>
                            <TableCell>{booking.runtime_stats?.Current_Status || 'Fetching...'}</TableCell>
                            <TableCell>{booking.runtime_stats?.Engine_ON_hours || 'Fetching...'}</TableCell>
                            <TableCell>{booking.runtime_stats?.DG_Name || 'Fetching...'}</TableCell>
                        </TableRow>
                    ))}
                    {filteredBookings.length === 0 && (
                        <TableRow><TableCell colSpan={9} className="text-center">No matching activity found.</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
         <div className="flex justify-end">
            <Button
                variant="outline"
                size="sm"
                onClick={() => {
                    // Manually trigger the check and fetch for missing stats
                    bookings?.forEach(async (booking) => {
                         if (!booking.runtime_stats && booking.imei) {
                           await fetchRuntimeStats(booking.imei); // The useEffect will handle the update after fetch
                         }
                    });
                }}
            >
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh Runtime Stats
            </Button>
        </div>
        <AnalyticsCharts />
        <StatsCards onCardClick={handleCardClick} />
    </div>
  );
}
