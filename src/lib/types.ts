
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

export interface Addon {
    id: string;
    name: string;
    price: number;
    unit: string;
    imageUrl: string;
}

export interface SelectedAddon {
    addonId: string;
    quantity: number;
}

export interface Timer {
    id: string;
    startTime: Date;
    endTime?: Date;
}

export interface Booking {
  id:string;
  userId: string;
  userEmail: string;
  userName: string;
  companyName?: string;
  phone?: string;
  generators: GeneratorGroup[];
  addons?: SelectedAddon[];
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
  };
  vehicleInfo?: {
      vehicleId: string;
      vehicleName: string;
      plateNumber: string;
      imeiNumber: string;
      vehicleModel: string;
  };
  timers?: Timer[];
  runtimeHoursFleetop?: string;
  isPaused?: boolean;
}
