
import { cn } from "@/lib/utils"
import Image from "next/image"

export function AmgLogo({ className, ...props }: React.ComponentProps<typeof Image>) {
  return (
    <Image 
      src="https://static.wixstatic.com/media/98dac2_72e59aa0510243c0936c2b4a3880c891~mv2.png"
      alt="AMG Logo"
      className={className}
      width={48}
      height={48}
      {...props}
    />
  )
}
