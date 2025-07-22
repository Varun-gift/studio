
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'driver' | 'user';
  createdAt: { seconds: number, nanoseconds: number } | Date;
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
  generatorType: string; // Keep as string for history, now comma-separated
  generatorTypes?: string[]; // New field for multiple types
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
      name: string;
      contact: string;
  };
  timerLogs?: {
      startTime: Date;
      endTime: Date;
  }[];
}
