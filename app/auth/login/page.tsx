"use client"

import type React from "react"

import { createClient, clearSupabaseSession } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Film } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Clearing any existing session data before login")
      clearSupabaseSession()

      await new Promise((resolve) => setTimeout(resolve, 100))

      const supabase = createClient()

      console.log("[v0] Attempting login for:", email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/feed`,
        },
      })

      if (error) throw error

      if (!data.user) {
        throw new Error("Login failed - no user data returned")
      }

      console.log("[v0] Login successful for user:", {
        id: data.user.id,
        email: data.user.email,
      })

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session || session.user.email !== email) {
        console.error("[v0] Session mismatch after login!", {
          expectedEmail: email,
          sessionEmail: session?.user.email,
        })
        throw new Error("Session verification failed. Please try again.")
      }

      console.log("[v0] Session verified for correct user")

      localStorage.setItem("reel-friends-current-user-email", email)

      router.push("/feed")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Film className="h-8 w-8 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">Reel Friends</h1>
          </div>
          <p className="text-slate-300">Welcome back to your movie community</p>
        </div>

        <Card className="bg-slate-800/80 border-slate-600 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-slate-200 text-center">Sign In</CardTitle>
            <CardDescription className="text-slate-300 text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            <div className="mt-6 text-center space-y-2">
              <p className="text-slate-300 text-sm">
                <Link href="/auth/forgot-password" className="text-purple-400 hover:text-purple-300 underline">
                  Forgot your password?
                </Link>
              </p>
              <p className="text-slate-300 text-sm">
                Don't have an account?{" "}
                <Link href="/auth/signup" className="text-purple-400 hover:text-purple-300 underline">
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
