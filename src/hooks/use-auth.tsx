
'use client';

import { useEffect, useState, createContext, useContext, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface AuthContextType {
  user: FirebaseUser | null;
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
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [company, setCompany] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState<string | null>(null);
  const [electricianName, setElectricianName] = useState<string | null>(null);
  const [electricianContact, setElectricianContact] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setUser(null);
    setRole(null);
    setName(null);
    setPhotoURL(null);
    setCompany(null);
    setAddress(null);
    setVehicleNumber(null);
    setElectricianName(null);
    setElectricianContact(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    const authUnsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        const userDocRef = doc(db, 'users', authUser.uid);
        const docUnsubscribe = onSnapshot(userDocRef, (userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser(authUser);
            setRole(userData.role || 'user');
            setName(userData.name || authUser.displayName);
            setPhotoURL(userData.photoURL || authUser.photoURL);
            setCompany(userData.company);
            setAddress(userData.address);
            setVehicleNumber(userData.vehicleNumber);
            setElectricianName(userData.electricianName);
            setElectricianContact(userData.electricianContact);
            (authUser as any).phone = userData.phone;
          } else {
             // If user exists in Auth but not in Firestore, treat as logged out.
            resetState();
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user document:", error);
          resetState();
        });

        return () => docUnsubscribe();
      } else {
        resetState();
      }
    });

    return () => authUnsubscribe();
  }, [resetState]);

  return (
    <AuthContext.Provider value={{ user, loading, role, name, photoURL, company, address, vehicleNumber, electricianName, electricianContact }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
