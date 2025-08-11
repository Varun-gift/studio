'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { auth, db } from '@/lib/firebase';
import {
  doc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  getDoc,
  query,
  where
} from 'firebase/firestore';
import type { Booking, BookedGenerator } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getStatusVariant } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Loader2,
  LogOut,
  Phone,
  User as UserIcon,
  Package,
  Power,
  PowerOff,
  Car,
  Play,
  Pause
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AssignedGeneratorJob extends BookedGenerator {
  bookingId: string;
  booking: Booking;
}

export default function DriverDashboard() {
  const { user, loading, name, role } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<AssignedGeneratorJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [isUpdatingDuty, setIsUpdatingDuty] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    } else if (role && role !== 'driver') {
      router.replace(`/${role}`);
    }
  }, [user, loading, role, router]);

  useEffect(() => {
    if (user?.uid) {
      setJobsLoading(true);
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('status', 'in', ['Approved', 'Active'])
      );

      const unsubscribe = onSnapshot(
        bookingsQuery,
        async (snapshot) => {
          try {
            const assignedJobs: AssignedGeneratorJob[] = [];

            for (const bookingDoc of snapshot.docs) {
              const bookingData = bookingDoc.data() as Booking;

              const assignedGenerators =
                bookingData.generators?.filter(
                  (g) => g.driverInfo?.driverId === user.uid
                ) || [];

              if (assignedGenerators.length > 0) {
                const booking = {
                  id: bookingDoc.id,
                  ...bookingData,
                  bookingDate: (bookingData.bookingDate as any).toDate(),
                  createdAt: (bookingData.createdAt as any).toDate()
                } as Booking;

                for (const generator of assignedGenerators) {
                  assignedJobs.push({
                    ...generator,
                    bookingId: bookingDoc.id,
                    booking: booking
                  });
                }
              }
            }

            assignedJobs.sort(
              (a, b) =>
                b.booking.createdAt.getTime() - a.booking.createdAt.getTime()
            );
            setJobs(assignedJobs);
          } catch (error) {
            console.error('Error processing bookings snapshot:', error);
            toast({
              title: 'Error',
              description: 'Could not process job updates.',
              variant: 'destructive'
            });
          } finally {
            setJobsLoading(false);
          }
        },
        (error) => {
          console.error('Error fetching driver jobs:', error);
          toast({
            title: 'Error',
            description: 'Could not fetch jobs. Please try again later.',
            variant: 'destructive'
          });
          setJobsLoading(false);
        }
      );

      return () => unsubscribe();
    }
  }, [user?.uid, toast]);

  const updateGeneratorInBooking = async (
    bookingId: string,
    generatorId: string,
    updates: Partial<BookedGenerator>
  ) => {
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingSnap = await getDoc(bookingRef);
    if (!bookingSnap.exists()) throw new Error('Booking not found');

    const bookingData = bookingSnap.data() as Booking;
    const updatedGenerators = bookingData.generators.map((g) =>
      g.id === generatorId ? { ...g, ...updates } : g
    );

    const isAnyGeneratorActive = updatedGenerators.some(
      (g) => g.status === 'Active'
    );
    const newBookingStatus = isAnyGeneratorActive
      ? 'Active'
      : bookingData.status;

    await updateDoc(bookingRef, {
      generators: updatedGenerators,
      status: newBookingStatus
    });
  };

  const handleStartDuty = async (job: AssignedGeneratorJob) => {
    setIsUpdatingDuty(job.id);
    try {
      const bookingRef = doc(db, 'bookings', job.bookingId);
      const bookingSnap = await getDoc(bookingRef);
      if (!bookingSnap.exists()) throw new Error('Booking not found');

      const bookingData = bookingSnap.data() as Booking;

      const updatedGenerators = bookingData.generators.map((g) => {
        if (g.id === job.id) {
          return {
            ...g,
            status: 'Active',
            timers: [...(g.timers || []), { startTime: new Date() }] // ✅ safe in array
          };
        }
        return g;
      });

      await updateDoc(bookingRef, {
        generators: updatedGenerators,
        status: 'Active'
      });

      toast({
        title: 'Duty Started',
        description: 'Generator is now active.'
      });
    } catch (error) {
      console.error('Error starting duty: ', error);
      toast({
        title: 'Error',
        description: 'Could not start duty.',
        variant: 'destructive'
      });
    } finally {
      setIsUpdatingDuty(null);
    }
  };

  const handlePauseGenerator = async (job: AssignedGeneratorJob) => {
    const activeTimer = job.timers?.find((t) => !t.endTime);
    if (!activeTimer) {
      toast({
        title: 'Error',
        description: 'No active timer to pause.',
        variant: 'destructive'
      });
      return;
    }

    setIsUpdatingDuty(job.id);
    try {
      const bookingRef = doc(db, 'bookings', job.bookingId);
      const bookingSnap = await getDoc(bookingRef);
      const bookingData = bookingSnap.data() as Booking;

      const updatedGenerators = bookingData.generators.map((g) => {
        if (g.id === job.id) {
          const updatedTimers =
            g.timers?.map((t) =>
              t.startTime === activeTimer.startTime
                ? { ...t, endTime: new Date() } // ✅ safe
                : t
            ) || [];
          return { ...g, status: 'Paused' as const, timers: updatedTimers };
        }
        return g;
      });

      await updateDoc(bookingRef, { generators: updatedGenerators });

      toast({
        title: 'Generator Paused',
        description: 'Generator timer has been paused.'
      });
    } catch (error) {
      console.error('Error pausing generator: ', error);
      toast({
        title: 'Error',
        description: 'Could not pause generator.',
        variant: 'destructive'
      });
    } finally {
      setIsUpdatingDuty(null);
    }
  };

  const handleResumeGenerator = async (job: AssignedGeneratorJob) => {
    setIsUpdatingDuty(job.id);
    try {
      const bookingRef = doc(db, 'bookings', job.bookingId);
      const bookingSnap = await getDoc(bookingRef);
      const bookingData = bookingSnap.data() as Booking;

      const updatedGenerators = bookingData.generators.map((g) => {
        if (g.id === job.id) {
          return {
            ...g,
            status: 'Active' as const,
            timers: [...(g.timers || []), { startTime: new Date() }] // ✅ safe
          };
        }
        return g;
      });

      await updateDoc(bookingRef, { generators: updatedGenerators });

      toast({
        title: 'Generator Resumed',
        description: 'Generator timer has resumed.'
      });
    } catch (error) {
      console.error('Error resuming generator: ', error);
      toast({
        title: 'Error',
        description: 'Could not resume generator.',
        variant: 'destructive'
      });
    } finally {
      setIsUpdatingDuty(null);
    }
  };

  const handleEndDuty = async (job: AssignedGeneratorJob) => {
    setIsUpdatingDuty(job.id);

    const activeTimer = job.timers?.find((t) => !t.endTime);
    if (activeTimer) {
      await handlePauseGenerator(job);
    }

    try {
      await updateGeneratorInBooking(job.bookingId, job.id, {
        status: 'Completed'
      });
      toast({
        title: 'Duty Ended',
        description: 'Final engine hours recorded.'
      });
    } catch (error) {
      console.error('Error ending duty: ', error);
      toast({
        title: 'Error',
        description: 'Could not end duty.',
        variant: 'destructive'
      });
    } finally {
      setIsUpdatingDuty(null);
    }
  };

  if (loading || !user || (role && role !== 'driver')) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Loading & Verifying Access...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-background">
      <header className="sticky top-0 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6 z-10">
        <div className="flex items-center gap-2 font-semibold">
          <Image
            src="https://static.wixstatic.com/media/98dac2_72e59aa0510243c0936c2b4a3880c891~mv2.png"
            alt="AMG Logo"
            width={32}
            height={32}
          />
          <div className="flex flex-col">
            <span className="text-xs font-bold">AMG</span>
            <span className="text-sm">
              Welcome, {name ? name.split(' ')[0] : 'Driver'}
            </span>
          </div>
        </div>
        <Button
          onClick={async () => {
            await auth.signOut();
            router.push('/login');
          }}
          variant="outline"
          size="sm"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </header>
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <h1 className="text-2xl font-bold">Your Assigned Jobs</h1>
        {jobsLoading ? (
          <div className="flex justify-center mt-8">
            <Loader2 className="mx-auto h-8 w-8 animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                You have no jobs assigned to you yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="w-full">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-4">
              {jobs.map((job) => {
                return (
                  <Card
                    key={`${job.bookingId}-${job.id}`}
                    className="min-w-[300px] flex flex-col"
                  >
                    <CardHeader>
                      <CardTitle className="truncate">
                        {job.booking.userName}
                      </CardTitle>
                      <CardDescription>
                        {format(job.booking.bookingDate, 'PPP')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Generator Status
                        </span>
                        <Badge
                          variant={
                            getStatusVariant(job.status, true) as any
                          }
                        >
                          {job.status}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <Package className="h-4 w-4" /> Your Assigned
                          Generator
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {job.kvaCategory} KVA
                        </p>
                      </div>
                      {job.vehicleInfo && (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            <Car className="h-4 w-4" /> Vehicle
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {job.vehicleInfo.vehicleName} (
                            {job.vehicleInfo.plateNumber})
                          </p>
                        </div>
                      )}
                      <div className="space-y-2">
                        <h4 className="font-semibold">Customer Details</h4>
                        <div className="flex items-center gap-2 text-sm">
                          <UserIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">
                            {job.booking.userName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">
                            {job.booking.userEmail}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground pt-2">
                          <span className="font-semibold text-foreground">
                            Location:
                          </span>{' '}
                          <span className="line-clamp-2">
                            {job.booking.location}
                          </span>
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2 items-stretch">
                      {job.status === 'Assigned' && (
                        <Button
                          onClick={() => handleStartDuty(job)}
                          disabled={isUpdatingDuty === job.id}
                        >
                          {isUpdatingDuty === job.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Power className="mr-2 h-4 w-4" />
                          )}{' '}
                          Start Duty
                        </Button>
                      )}
                      {job.status === 'Active' && (
                        <Button
                          onClick={() => handlePauseGenerator(job)}
                          variant="secondary"
                          disabled={isUpdatingDuty === job.id}
                        >
                          {isUpdatingDuty === job.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Pause className="mr-2 h-4 w-4" />
                          )}{' '}
                          Pause
                        </Button>
                      )}
                      {job.status === 'Paused' && (
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            onClick={() => handleResumeGenerator(job)}
                            disabled={isUpdatingDuty === job.id}
                          >
                            {isUpdatingDuty === job.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Play className="mr-2 h-4 w-4" />
                            )}{' '}
                            Resume
                          </Button>
                          <Button
                            onClick={() => handleEndDuty(job)}
                            variant="destructive"
                            disabled={isUpdatingDuty === job.id}
                          >
                            {isUpdatingDuty === job.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <PowerOff className="mr-2 h-4 w-4" />
                            )}{' '}
                            End Duty
                          </Button>
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </main>
    </div>
  );
}
