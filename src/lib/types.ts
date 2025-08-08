
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

export interface Vehicle {
    id: string;
    vehicleName: string;
    plateNumber: string;
    imeiNumber: string;
    vehicleModel: string;
    status: 'active' | 'inactive' | 'in-maintenance';
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
  imeiNumber?: string; // This will be populated from vehicleInfo
  generatorName?: string; // This can be deprecated or kept for old data
  vehicleNumber?: string; // This will be populated from vehicleInfo
  driverInfo?: {
      driverId: string;
      name: string;
      contact: string;
      electricianName?: string;
      electricianContact?: string;
  };
  vehicleInfo?: {
      vehicleId: string;
      vehicleName: string;
      plateNumber: string;
      imeiNumber: string;
      vehicleModel: string;
  };
  timers?: TimerLog[];
  dutyStartTime?: Date;
  dutyEndTime?: Date;
  runtimeHoursManual?: number; // total seconds from manual timers
  runtimeHoursFleetop?: string; // e.g., "07:39"
  engineStartHours?: string;   // From Fleetop, e.g. "02:15"
  engineEndHours?: string;     // Final hours from Fleetop
  finalEngineDuration?: string; // "05:20"
  engineStatus?: "active" | "idle" | "offline"; // optional
}

export interface TimerLog {
    id: string;
    generatorId: string;
    startTime: Date;
    endTime?: Date;
    duration?: number; // in seconds
    status: 'running' | 'stopped';
}
