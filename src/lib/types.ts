

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
  generatorType: string;
  kvaCategory: string;
  quantity: number;
  usageHours: number;
  location: string;
  bookingDate: Date;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Voided' | 'Active' | 'Completed' | 'Cancelled';
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