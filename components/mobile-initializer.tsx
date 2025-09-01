"use client"

import { useEffect } from "react"
import { initializeMobileFeatures } from "@/lib/mobile"

export function MobileInitializer() {
  useEffect(() => {
    const timer = setTimeout(() => {
      initializeMobileFeatures()
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return null
}
