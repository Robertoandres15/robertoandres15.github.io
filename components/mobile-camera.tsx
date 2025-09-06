"use client"

import { useState, useRef, useEffect } from "react"
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera"
import { Button } from "@/components/ui/button"
import { CameraIcon, ImageIcon } from "lucide-react"
import { isMobile, triggerHaptic } from "@/lib/mobile"
import { ImpactStyle } from "@capacitor/haptics"

interface MobileCameraProps {
  onImageSelected: (imageUrl: string) => void
  className?: string
}

export function MobileCamera({ onImageSelected, className }: MobileCameraProps) {
  const [isLoading, setIsLoading] = useState(false)
  const blobUrlsRef = useRef<string[]>([])

  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [])

  const createAndTrackBlobUrl = (file: File): string => {
    const url = URL.createObjectURL(file)
    blobUrlsRef.current.push(url)
    return url
  }

  const takePicture = async () => {
    if (!isMobile()) {
      // Fallback for web - use file input
      const input = document.createElement("input")
      input.type = "file"
      input.accept = "image/*"
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
          const url = createAndTrackBlobUrl(file)
          onImageSelected(url)
        }
      }
      input.click()
      return
    }

    setIsLoading(true)
    await triggerHaptic(ImpactStyle.Light)

    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      })

      if (image.dataUrl) {
        onImageSelected(image.dataUrl)
        await triggerHaptic(ImpactStyle.Medium)
      }
    } catch (error) {
      console.error("[v0] Error taking picture:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const selectFromGallery = async () => {
    if (!isMobile()) {
      // Fallback for web - use file input
      const input = document.createElement("input")
      input.type = "file"
      input.accept = "image/*"
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
          const url = createAndTrackBlobUrl(file)
          onImageSelected(url)
        }
      }
      input.click()
      return
    }

    setIsLoading(true)
    await triggerHaptic(ImpactStyle.Light)

    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      })

      if (image.dataUrl) {
        onImageSelected(image.dataUrl)
        await triggerHaptic(ImpactStyle.Medium)
      }
    } catch (error) {
      console.error("[v0] Error selecting from gallery:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      <Button onClick={takePicture} disabled={isLoading} variant="outline" size="sm" className="flex-1 bg-transparent">
        <CameraIcon className="h-4 w-4 mr-2" />
        {isLoading ? "Taking..." : "Camera"}
      </Button>
      <Button
        onClick={selectFromGallery}
        disabled={isLoading}
        variant="outline"
        size="sm"
        className="flex-1 bg-transparent"
      >
        <ImageIcon className="h-4 w-4 mr-2" />
        {isLoading ? "Selecting..." : "Gallery"}
      </Button>
    </div>
  )
}
