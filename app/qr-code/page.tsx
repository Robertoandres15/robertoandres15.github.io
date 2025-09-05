import { QRCodeGenerator } from "@/components/qr-code-generator"

export default function QRCodePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <QRCodeGenerator defaultUrl="https://your-reel-friends-app.vercel.app" />
    </div>
  )
}
