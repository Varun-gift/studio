
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'driver' | 'user';
  createdAt: { seconds: number, nanoseconds: number } | Date;
  photoURL?: string;
  phone?: string; // driver contact
  company?: string;
  address?: string;
  vehicleNumber?: string;
  electricianName?: string;
  electricianContact?: string;
}

export interface Generator {
  id: string;
  model: string;
  capacity: string;
  fuelType: 'Diesel' | 'Gasoline' | 'Propane';
  imageUrl: string;
  hourlyRate: number;
  status: 'Available' | 'Rented' | 'Maintenance';
}

export interface Rental {
  id: string;
  generatorModel: string;
  startDate: string;
  endDate: string;
  status: 'Upcoming' | 'Active' | 'Completed';
  totalCost: number;
}

export interface Booking {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  generatorType: string;
  generatorTypes?: string[]; 
  kvaCategory: string;
  quantity: number;
  usageHours: number;
  location: string;
  bookingDate: Date;
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
  timerLogs?: {
      startTime: Date;
      endTime: Date;
  }[];
}

export interface Notification {
  id: string;
  bookingId: string;
  message: string;
  timestamp: Date;
  read: boolean;
  userId: string;
}
