
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Booking } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const getStatusVariant = (status: Booking['status']) => {
    switch (status) {
      case 'Active':
        return 'default';
      case 'Approved':
        return 'secondary';
      case 'Completed':
        return 'secondary';
      case 'Pending':
        return 'outline';
      case 'Rejected':
      case 'Cancelled':
      case 'Voided':
        return 'destructive';
      default:
        return 'outline';
    }
  };
