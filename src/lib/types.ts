
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'driver' | 'user';
  createdAt: { seconds: number, nanoseconds: number } | Date;
  photoURL?: string;
  phone?: string; 
  company?: string;
  address?: string;
  vehicleNumber?: string;
  electricianName?: string;
  electricianContact?: string;
}

export interface Generator {
  id: string;
  name: string;
  kva: string;
  imageUrl: string;
  description: string;
  power: string;
  output: string;
  fuelType: 'Diesel' | 'Gasoline' | 'Propane';
  basePrice: number;
  pricePerAdditionalHour: number;
}

export interface GeneratorGroup {
  kvaCategory: string;
  additionalHours?: number;
}

export interface Booking {
  id:string;
  userId: string;
  userEmail: string;
  userName: string;
  companyName?: string;
  phone?: string;
  generators: GeneratorGroup[];
  location: string;
  bookingDate: Date;
  additionalNotes?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Voided' | 'Active' | 'Completed' | 'Cancelled';
  estimatedCost: number;
  createdAt: { seconds: number, nanoseconds: number } | Date;
  driverInfo?: {
      driverId: string;
      name: string;
      contact: string;
      vehicleNumber?: string;
      electricianName?: string;
      electricianContact?: string;
  };
  timers?: TimerLog[];
}

export interface TimerLog {
    id: string;
    generatorId: string;
    startTime: Date;
    endTime?: Date;
    duration?: number; // in seconds
    status: 'running' | 'stopped';
}
