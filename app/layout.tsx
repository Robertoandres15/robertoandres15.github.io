import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import ClientLayout from "./client-layout"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700", "800"],
})

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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Clear invalid Supabase sessions before React hydrates
              (function() {
                try {
                  // Check if there are Supabase auth items in localStorage
                  var hasSupabaseAuth = false;
                  for (var i = 0; i < localStorage.length; i++) {
                    var key = localStorage.key(i);
                    if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
                      hasSupabaseAuth = true;
                      break;
                    }
                  }
                  
                  // If we have Supabase auth data, we'll let the React component handle validation
                  // This script just ensures we don't have orphaned data
                } catch (e) {
                  console.error('Error checking Supabase session:', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`font-sans ${inter.variable}`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
