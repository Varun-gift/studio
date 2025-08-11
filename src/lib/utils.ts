

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Booking, BookedGenerator } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const getStatusVariant = (status: Booking['status'] | BookedGenerator['status'], isGeneratorStatus = false) => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Assigned':
      case 'Approved':
        return 'default';
      case 'Completed':
        return 'default';
      case 'Pending':
        return 'outline';
      case 'Paused':
          return 'secondary';
      case 'Rejected':
      case 'Cancelled':
      case 'Voided':
        return 'destructive';
      default:
        return 'outline';
    }
  };
