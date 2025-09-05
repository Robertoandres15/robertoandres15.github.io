"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, Download } from "lucide-react"

interface QRCodeGeneratorProps {
  defaultUrl?: string
}

export function QRCodeGenerator({ defaultUrl = "https://your-reel-friends-app.vercel.app" }: QRCodeGeneratorProps) {
  const [url, setUrl] = useState(defaultUrl)
  const [qrCodeUrl, setQrCodeUrl] = useState(
    `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(defaultUrl)}`,
  )

  const generateQRCode = () => {
    const newQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`
    setQrCodeUrl(newQrCodeUrl)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url)
  }

  const downloadQRCode = () => {
    const link = document.createElement("a")
    link.href = qrCodeUrl
    link.download = "reel-friends-qr-code.png"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Reel Friends QR Code</CardTitle>
        <CardDescription className="text-center">Share your app with a simple scan</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter your app URL"
            className="flex-1"
          />
          <Button onClick={generateQRCode} size="sm">
            Generate
          </Button>
        </div>

        <div className="flex justify-center">
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <img src={qrCodeUrl || "/placeholder.svg"} alt="QR Code for Reel Friends" className="w-64 h-64" />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={copyToClipboard} variant="outline" className="flex-1 bg-transparent">
            <Copy className="w-4 h-4 mr-2" />
            Copy URL
          </Button>
          <Button onClick={downloadQRCode} variant="outline" className="flex-1 bg-transparent">
            <Download className="w-4 h-4 mr-2" />
            Download QR
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Update the URL above with your actual Vercel deployment URL
        </div>
      </CardContent>
    </Card>
  )
}
