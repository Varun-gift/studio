
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Booking } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const getStatusVariant = (status: Booking['status']) => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Approved':
        return 'default';
      case 'Completed':
        return 'default';
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
