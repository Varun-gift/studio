
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export function GeneratorBg({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 84 36"
      fill="none"
      className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90px] h-[40px] text-primary/10", className)}
      {...props}
    >
        <path d="M0 8C0 3.58172 3.58172 0 8 0H60V28H0V8Z" fill="currentColor"/>
        <path d="M0 28H12V34H0V28Z" fill="currentColor"/>
        <circle cx="66" cy="18" r="18" fill="currentColor"/>
    </svg>
  );
}
