import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { MobileInitializer } from "@/components/mobile-initializer"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"
import "./globals.css"

export const metadata: Metadata = {
  title: "Reel Friends",
  description:
    "Discover Movies with Friends - Share recommendations, build wishlists, and discover your next favorite movie through your social circle.",
  generator: "Reel Friends App",
  manifest: "/manifest.json",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover",
  themeColor: "#7c3aed",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Reel Friends",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <MobileInitializer />
        <Suspense fallback={null}>{children}</Suspense>
        <PWAInstallPrompt />
        <Analytics />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
