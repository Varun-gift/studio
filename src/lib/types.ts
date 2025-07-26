

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
  pricePerHour: number;
}

export interface CartItem extends Generator {
    quantity: number;
    usageHours: number;
}

export interface BookedGenerator {
  id: string;
  name: string;
  kva: string;
  quantity: number;
  usageHours: number;
}

export interface Booking {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  companyName?: string;
  phone?: string;
  generators: BookedGenerator[];
  location: string;
  bookingDate: Date;
  additionalNotes?: string;
  needsElectrician: boolean;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Voided' | 'Active' | 'Completed' | 'Cancelled';
  subtotal: number;
  gstAmount: number;
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
