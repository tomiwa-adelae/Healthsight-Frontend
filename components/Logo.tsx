import { cn } from "@/lib/utils"
import Image from "next/image"
import React from "react"

interface LogoProps {
  // color?: "white" | "green"
  className?: string
}

export const Logo = ({ className }: LogoProps) => {
  return (
    <Image
      src="/assets/images/logo.jpeg"
      alt="Lagos State Health District"
      width={1000}
      height={1000}
      className={cn("w-36 rounded-full object-cover", className)}
    />
  )
}
