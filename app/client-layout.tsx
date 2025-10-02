"use client"

import type React from "react"
import { Analytics } from "@vercel/analytics/next"
import { Suspense, useEffect } from "react"
import { MobileInitializer } from "@/components/mobile-initializer"
import { initializeCapacitor } from "@/lib/capacitor"
import { SupabaseAuthHandler } from "@/components/supabase-auth-handler"

function CapacitorInitializer() {
  useEffect(() => {
    initializeCapacitor()
  }, [])

  return null
}

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <MobileInitializer />
      <CapacitorInitializer />
      <SupabaseAuthHandler />
      <Suspense fallback={null}>{children}</Suspense>
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
    </>
  )
}
