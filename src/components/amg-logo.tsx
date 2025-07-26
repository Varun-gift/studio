import { cn } from "@/lib/utils"

export function AmgLogo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      className={cn("text-brand-orange-primary", className)}
      viewBox="0 0 100 100"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20 80L35 20L50 80H40L37.5 70H32.5L30 80H20ZM33.5 60H36.5L35 40L33.5 60Z"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M55 80V20H85V30H65V45H80V55H65V70H85V80H55Z"
      />
      <path d="M5 95H95V90H5V95Z" className="text-brand-blue-primary" />
    </svg>
  )
}
