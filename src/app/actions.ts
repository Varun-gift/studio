
'use server';

import { auth, sendPasswordResetEmail, db, adminDb } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, Timestamp, updateDoc } from 'firebase/firestore';
import { schedule } from '@firebase/functions'; // Assuming you're using Firebase Functions for scheduling
import type { Booking, TimerLog } from '@/lib/types';


export async function sendPasswordResetLink(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    // To avoid user enumeration, we don't reveal if the email exists or not.
    // The client-side will show a generic success message.
    // For debugging, we can check the error code.
    if (error.code === 'auth/user-not-found') {
      // Still resolve successfully to not leak information.
      return;
    }
    // For other errors, we might want to throw them.
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

export async function getDriverBookings(driverId: string): Promise<Booking[]> {
  // Removed orderBy to prevent Firestore index error. Sorting will be done client-side.
  const bookingsQuery = query(
    collection(db, 'bookings'),
    where('driverInfo.driverId', '==', driverId)
  );

  try {
    const snapshot = await getDocs(bookingsQuery);
    
    const bookingsPromises = snapshot.docs.map(async (bookingDoc) => {
      const bookingData = bookingDoc.data();
      const timersCollectionRef = collection(db, 'bookings', bookingDoc.id, 'timers');
      const timersSnapshot = await getDocs(timersCollectionRef);
      
      const timers = timersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: (doc.data().startTime as any).toDate(),
        endTime: doc.data().endTime ? (doc.data().endTime as any).toDate() : null,
      } as TimerLog));

      return {
        id: bookingDoc.id,
        ...bookingData,
        bookingDate: (bookingData.bookingDate as any).toDate(),
        createdAt: (bookingData.createdAt as any).toDate(),
        timers,
      } as Booking;
    });

    return Promise.all(bookingsPromises);
  } catch (error) {
    console.error('Error fetching driver bookings in action:', error);
    // In a real app, you might want to handle this more gracefully
    // For now, we'll re-throw to let the client know something went wrong.
    throw new Error('Failed to fetch driver bookings.');
  }
}

// Modify the createBooking action to check if a booking with the same booking_id already exists in the \"bookings\" collection. If it exists, update the fields imei, driver_id, vehicle_id, start_time, end_time, and runtime_stats. If it does not exist, create a new document with all the required fields for a booking.
export async function createBooking(bookingData: Partial<Booking> & { booking_id: string; driver_id?: string; vehicle_id?: string }) {
  const bookingRef = adminDb.collection('bookings');
  const driversRef = adminDb.collection('drivers');
  const vehiclesRef = adminDb.collection('vehicles');

  let driverRef;
  let vehicleRef;

  try {
    // Check and create or get driver reference
    if (bookingData.driver_id) {
      const existingDrivers = await driversRef.where('driver_id', '==', bookingData.driver_id).limit(1).get();
      if (!existingDrivers.empty) {
        driverRef = existingDrivers.docs[0].ref;
      } else {
        // Create new driver document and get its reference
        const newDriverDoc = await driversRef.add({ driver_id: bookingData.driver_id, name: 'New Driver' }); // Add other required driver fields
        driverRef = newDriverDoc;
        console.log(`New driver created with ID ${bookingData.driver_id}`);
      }
    }

    // Check and create or get vehicle reference
    if (bookingData.vehicle_id) {
      const existingVehicles = await vehiclesRef.where('vehicle_id', '==', bookingData.vehicle_id).limit(1).get();
      if (!existingVehicles.empty) {
        vehicleRef = existingVehicles.docs[0].ref;
      } else {
        // Create new vehicle document and get its reference
        const newVehicleDoc = await vehiclesRef.add({ vehicle_id: bookingData.vehicle_id, model: 'New Vehicle' }); // Add other required vehicle fields
        vehicleRef = newVehicleDoc;
        console.log(`New vehicle created with ID ${bookingData.vehicle_id}`);
      }
    }

    // Check if a booking with the same booking_id exists
    const existingBookings = await bookingRef.where('booking_id', '==', bookingData.booking_id).get();

    if (!existingBookings.empty) {
      // Booking exists, update specified fields
      const bookingDoc = existingBookings.docs[0];
      const existingBookingData = bookingDoc.data();

      const bookingUpdateData: any = {
 imei: bookingData.imei,
 start_time: bookingData.start_time ? Timestamp.fromDate(new Date(bookingData.start_time as any)) : undefined, // Convert to Timestamp
 end_time: bookingData.end_time ? Timestamp.fromDate(new Date(bookingData.end_time as any)) : undefined, // Convert to Timestamp
      };

      if (driverRef) bookingUpdateData.driverRef = driverRef;
 if (vehicleRef) bookingUpdateData.vehicleRef = vehicleRef;

      // Handle runtime_stats: update if exists, create and populate if not
      if (bookingData.runtime_stats) {
 if (existingBookingData.runtime_stats) {
 // Merge new stats with existing stats
 bookingUpdateData.runtime_stats = {
 ...existingBookingData.runtime_stats,
          Engine_ON_hours: bookingData.runtime_stats.Engine_ON_hours,
 DG_Name: bookingData.runtime_stats.DG_Name,
 Current_Status: bookingData.runtime_stats.Current_Status,
 no_of_times_on: bookingData.runtime_stats.no_of_times_on,
 lastUpdated: Timestamp.now(), // Add last updated timestamp
          };
 } else {
 // Create new runtime_stats field
 // Initialize with relevant fields and timestamp
 bookingUpdateData.runtime_stats = { ...bookingData.runtime_stats, lastUpdated: Timestamp.now() };
 }
      }
 await bookingDoc.ref.update(bookingUpdateData);
      console.log(`Booking with ID ${bookingData.booking_id} updated.`);
    } else {
      // Booking does not exist, create a new document
      await bookingRef.add({
        ...bookingData,
        createdAt: Timestamp.now(), // Use Timestamp
      });

 const newBookingData: any = {
 ...bookingData,
 createdAt: Timestamp.now(),
      };
 if (driverRef) newBookingData.driverRef = driverRef;
      if (vehicleRef) newBookingData.vehicleRef = vehicleRef; // Corrected variable name
      console.log(`New booking created with ID ${bookingData.booking_id}.`);
    }
  } catch (error) {
    console.error('Error creating/updating booking:', error);
    // In a real app, you might want to handle this error more specifically
    throw new Error('Failed to create or update booking.');
  }
}

// This function simulates fetching runtime data from Fleetop.
// Replace this with your actual Fleetop API integration.
async function fetchRuntimeDataFromFleetop(imei: string, startTime?: Timestamp, endTime?: Timestamp): Promise<any | null> {
  console.log(`Simulating fetch from Fleetop for IMEI: ${imei}`);
  // Simulate a delay for the API call
  await new Promise(resolve => setTimeout(resolve, 500));

  // Simulate returning some data
  return {
    Engine_ON_hours: Math.random() * 100, // Example data
    DG_Name: `Generator-${imei}`,
    Current_Status: Math.random() > 0.5 ? 'ON' : 'OFF',
    no_of_times_on: Math.floor(Math.random() * 10),
    // You might include other relevant data here
  };
}

// Function to check for runtime anomalies and notify
async function checkRuntimeAnomalies(booking: Booking, currentRuntime: any) {
  const now = new Date();
  const bookingStartTime = booking.start_time ? (booking.start_time as any).toDate() : null;
  const bookingEndTime = booking.end_time ? (booking.end_time as any).toDate() : null;

  if (currentRuntime?.Current_Status === 'ON') {
    if (!bookingStartTime || !bookingEndTime || now < bookingStartTime || now > bookingEndTime) {
      console.warn(`Anomaly detected for booking ${booking.booking_id}: Generator ON outside of scheduled window.`);
      // TODO: Implement notification mechanism (email, in-app notification, etc.)
      // Example: sendEmailToAdmin("Anomaly Detected", `Generator for booking ${booking.booking_id} is ON outside of its scheduled time.`);
    }
  }
}

// Scheduled function to update stale runtime stats and check for anomalies
// Using schedule from @firebase/functions for server-side scheduling
export const scheduledRuntimeSync = schedule('every 5 minutes').onRun(async (context) => {
  const now = Timestamp.now();
  const bookingRef = adminDb.collection('bookings');

  // Query bookings where end_time has not yet passed and runtime_stats might be stale
  const activeBookingsQuery = bookingRef
    .where('end_time', '>', now)
    .where('runtime_stats.lastUpdated', '<', new Timestamp(now.seconds - 300, now.nanoseconds)); // Stale if updated more than 5 minutes ago

  // Also query bookings where runtime_stats is missing
  const bookingsWithoutRuntimeQuery = bookingRef
    .where('end_time', '>', now)
    .where('runtime_stats', '==', null);

  try {
    const [staleSnapshot, missingSnapshot] = await Promise.all([
      activeBookingsQuery.get(),
      bookingsWithoutRuntimeQuery.get()
    ]);

    const allBookingsToUpdate = [...staleSnapshot.docs, ...missingSnapshot.docs];

    for (const doc of allBookingsToUpdate) {
      const booking = doc.data() as Booking; // Cast to Booking type for better type safety
      const { imei, start_time, end_time } = booking;

      if (imei) {
        console.log(`Fetching updated runtime stats for booking ${doc.id} with IMEI ${imei}`);
        const newRuntimeData = await fetchRuntimeDataFromFleetop(imei, start_time as Timestamp, end_time as Timestamp);

        if (newRuntimeData) {
          // Update the booking document with the new runtime data and a last updated timestamp
          await updateDoc(doc.ref, {
 runtime_stats: {
              ...(booking.runtime_stats || {}), // Preserve existing stats if any
              ...newRuntimeData,
              lastUpdated: Timestamp.now()
            },
          });
          console.log(`Updated runtime stats for booking ${doc.id}`);

          // Check for anomalies after updating runtime stats
          await checkRuntimeAnomalies({ ...booking, runtime_stats: { ...(booking.runtime_stats || {}), ...newRuntimeData } as any }, newRuntimeData);
        }
      }
    }
  } catch (error) {
    console.error('Error updating stale runtime stats:', error);
  }
});

export async function updateStaleRuntimeStats() {
  const now = new Date();
  const bookingRef = adminDb.collection('bookings');

  // Query bookings where end_time has not yet passed
  const activeBookingsQuery = bookingRef.where('end_time', '>', Timestamp.now());

  try {
    const snapshot = await activeBookingsQuery.get();

    for (const doc of snapshot.docs) {
      const booking = doc.data() as Booking;
      const { imei, start_time, end_time, runtime_stats } = booking;

      // Check if runtime_stats is missing or stale (you'll need to define staleness criteria)
      const isRuntimeStatsStale = !runtime_stats || (runtime_stats.lastUpdated && (Timestamp.now().seconds - runtime_stats.lastUpdated.seconds) > 300); // Example: stale if older than 5 minutes

      if (imei && (isRuntimeStatsStale || !runtime_stats)) {
        console.log(`Fetching updated runtime stats for booking ${doc.id} with IMEI ${imei}`);
        const newRuntimeData = await fetchRuntimeDataFromFleetop(imei, start_time as Timestamp, end_time as Timestamp);

        if (newRuntimeData) {
          // Update the booking document with the new runtime data and a last updated timestamp
          await updateDoc(doc.ref, {
 runtime_stats: {
              ...(runtime_stats || {}), // Preserve existing stats if any
              ...newRuntimeData,
              lastUpdated: Timestamp.now()
            },
          });
 console.log(`Updated runtime stats for booking ${doc.id}`);

          // Check for anomalies after updating runtime stats
          await checkRuntimeAnomalies({ ...booking, runtime_stats: { ...(booking.runtime_stats || {}), ...newRuntimeData } as any }, newRuntimeData);
        }
      }
    }
  } catch (error) {
    console.error('Error updating stale runtime stats:', error);
  }
}
