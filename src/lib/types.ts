

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
  id?: string;
  userId: string;
  userEmail: string;
  generatorType: string;
  kvaCategory: string;
  usageHours: number;
  bookingDate: Date;
  status: 'Pending' | 'Confirmed' | 'Active' | 'Completed' | 'Cancelled';
  estimatedCost: number;
  createdAt: Date;
}
