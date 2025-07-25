
'use server';

import { suggestGeneratorSize as suggestGeneratorSizeFlow, GeneratorSizingInput, GeneratorSizingOutput } from '@/ai/flows/generator-sizing';
import { auth, sendPasswordResetEmail, db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import type { Booking, TimerLog } from '@/lib/types';


export async function suggestGeneratorSize(input: GeneratorSizingInput): Promise<GeneratorSizingOutput> {
  try {
    const result = await suggestGeneratorSizeFlow(input);
    return result;
  } catch (error) {
    console.error('Error in suggestGeneratorSize action:', error);
    throw new Error('Failed to get generator suggestion. Please try again.');
  }
}


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
  const bookingsQuery = query(
    collection(db, 'bookings'),
    where('driverInfo.driverId', '==', driverId),
    orderBy('createdAt', 'desc')
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
