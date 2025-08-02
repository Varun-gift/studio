'use client';

import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
  useCallback,
} from 'react';
import {
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
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
    let unsubscribeDoc: Unsubscribe | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      // Clean up previous Firestore listener
      if (unsubscribeDoc) {
        unsubscribeDoc();
      }

      if (authUser) {
        setLoading(true);

        const userDocRef = doc(db, 'users', authUser.uid);
        unsubscribeDoc = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              setUser(authUser);
              setRole(data.role ?? null);
              setName(data.name ?? authUser.displayName ?? null);
              setPhotoURL(data.photoURL ?? authUser.photoURL ?? null);
              setCompany(data.company ?? null);
              setAddress(data.address ?? null);
              setVehicleNumber(data.vehicleNumber ?? null);
              setElectricianName(data.electricianName ?? null);
              setElectricianContact(data.electricianContact ?? null);
              (authUser as any).phone = data.phone;
            } else {
              console.warn('Authenticated user has no Firestore record');
              auth.signOut(); // Prevent ghost auth sessions
            }
            setLoading(false);
          },
          (error) => {
            console.error('Error syncing user Firestore data:', error);
            auth.signOut();
          }
        );
      } else {
        resetState();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) {
        unsubscribeDoc();
      }
    };
  }, [resetState]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        role,
        name,
        photoURL,
        company,
        address,
        vehicleNumber,
        electricianName,
        electricianContact,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);