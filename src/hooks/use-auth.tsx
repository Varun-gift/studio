
'use client';

import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  role: string | null;
  name: string | null;
  photoURL: string | null;
  company: string | null;
  address: string | null;
  vehicleNumber: string | null;
  electricianName: string | null;
  electricianContact: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  role: null,
  name: null,
  photoURL: null,
  company: null,
  address: null,
  vehicleNumber: null,
  electricianName: null,
  electricianContact: null,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [company, setCompany] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState<string | null>(null);
  const [electricianName, setElectricianName] = useState<string | null>(null);
  const [electricianContact, setElectricianContact] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setRole(userData.role);
          setName(userData.name);
          setPhotoURL(userData.photoURL || user.photoURL);
          setCompany(userData.company);
          setAddress(userData.address);
          setVehicleNumber(userData.vehicleNumber);
          setElectricianName(userData.electricianName);
          setElectricianContact(userData.electricianContact);
          
          (user as any).phone = userData.phone;

          // Request notification permission and get FCM token
          try {
            const messaging = getMessaging();
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
              const fcmToken = await getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY_HERE' }); // Replace with your actual VAPID key
              if (fcmToken) {
                // Save the FCM token to the user's document in Firestore
                if (userData.fcmToken !== fcmToken) {
                    await updateDoc(userDocRef, { fcmToken });
                }
              } else {
                console.log('No registration token available. Request permission to generate one.');
              }
            }
          } catch (error) {
            console.error('An error occurred while retrieving token. ', error);
          }

        } else {
          setRole('user'); // Default role
          setName(user.displayName);
          setPhotoURL(user.photoURL);
          setCompany(null);
          setAddress(null);
          setVehicleNumber(null);
          setElectricianName(null);
          setElectricianContact(null);
        }
      } else {
        setUser(null);
        setRole(null);
        setName(null);
        setPhotoURL(null);
        setCompany(null);
        setAddress(null);
        setVehicleNumber(null);
        setElectricianName(null);
        setElectricianContact(null);
      }
      setLoading(false);
    });

    // Handle incoming messages
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const messaging = getMessaging();
      onMessage(messaging, (payload) => {
        console.log('Message received. ', payload);
        // You can display a toast or a custom notification UI here
        // For simplicity, we'll just log it.
      });
    }

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, role, name, photoURL, company, address, vehicleNumber, electricianName, electricianContact }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
