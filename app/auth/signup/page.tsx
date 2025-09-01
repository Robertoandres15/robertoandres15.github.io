"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Film } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    if (!agreedToTerms) {
      setError("You must agree to the Terms & Conditions and Privacy Policy to create an account")
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()

      // Check if client was created successfully
      if (!supabase) {
        throw new Error("Unable to connect to authentication service. Please try again later.")
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_SITE_URL
            ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
            : process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
      router.push("/auth/check-email")
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes("Your project's URL and API key are required")) {
        setError("Authentication service is currently unavailable. Please contact support.")
      } else {
        setError(error instanceof Error ? error.message : "An error occurred")
      }
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
          <p className="text-slate-300">Join the movie community</p>
        </div>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white text-center">Create Account</CardTitle>
            <CardDescription className="text-slate-300 text-center">Start your movie discovery journey</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
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
                <Label htmlFor="password" className="text-white">
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
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              <div className="flex items-start space-x-2 pt-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                  className="border-white/20 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="terms" className="text-sm text-slate-300 leading-relaxed cursor-pointer">
                    I have read and agree to the{" "}
                    <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
                      <DialogTrigger asChild>
                        <button type="button" className="text-purple-400 hover:text-purple-300 underline">
                          Terms & Conditions
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] bg-slate-900 border-slate-700">
                        <DialogHeader>
                          <DialogTitle className="text-white">Terms & Conditions</DialogTitle>
                          <DialogDescription className="text-slate-300">
                            Please read our terms and conditions carefully
                          </DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="h-[60vh] pr-4">
                          <div className="text-slate-300 space-y-4 text-sm">
                            <h3 className="text-lg font-semibold text-purple-400">1. Acceptance of Terms</h3>
                            <p>
                              By accessing and using Reel Friends, you accept and agree to be bound by the terms and
                              provision of this agreement.
                            </p>

                            <h3 className="text-lg font-semibold text-purple-400">2. User Accounts</h3>
                            <p>
                              You are responsible for maintaining the confidentiality of your account and password and
                              for restricting access to your computer.
                            </p>

                            <h3 className="text-lg font-semibold text-purple-400">3. Content and Conduct</h3>
                            <p>
                              Users must not post content that is illegal, harmful, threatening, abusive, harassing,
                              defamatory, vulgar, obscene, or otherwise objectionable.
                            </p>

                            <h3 className="text-lg font-semibold text-purple-400">4. Privacy</h3>
                            <p>
                              Your privacy is important to us. Please review our Privacy Policy, which also governs your
                              use of the Service.
                            </p>

                            <h3 className="text-lg font-semibold text-purple-400">5. Intellectual Property</h3>
                            <p>
                              The Service and its original content, features and functionality are and will remain the
                              exclusive property of Reel Friends and its licensors.
                            </p>

                            <h3 className="text-lg font-semibold text-purple-400">6. Termination</h3>
                            <p>
                              We may terminate or suspend your account and bar access to the Service immediately,
                              without prior notice or liability, under our sole discretion.
                            </p>

                            <h3 className="text-lg font-semibold text-purple-400">7. Disclaimer</h3>
                            <p>
                              The information on this service is provided on an "as is" basis. To the fullest extent
                              permitted by law, this Company excludes all representations, warranties, conditions and
                              terms.
                            </p>

                            <h3 className="text-lg font-semibold text-purple-400">8. Changes to Terms</h3>
                            <p>
                              We reserve the right, at our sole discretion, to modify or replace these Terms at any
                              time.
                            </p>
                          </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>{" "}
                    and{" "}
                    <Dialog open={showPrivacyModal} onOpenChange={setShowPrivacyModal}>
                      <DialogTrigger asChild>
                        <button type="button" className="text-purple-400 hover:text-purple-300 underline">
                          Privacy Policy
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] bg-slate-900 border-slate-700">
                        <DialogHeader>
                          <DialogTitle className="text-white">Privacy Policy</DialogTitle>
                          <DialogDescription className="text-slate-300">
                            Learn how we collect, use, and protect your information
                          </DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="h-[60vh] pr-4">
                          <div className="text-slate-300 space-y-4 text-sm">
                            <h3 className="text-lg font-semibold text-purple-400">1. Information We Collect</h3>
                            <p>
                              We collect information you provide directly to us, such as when you create an account, use
                              our services, or contact us.
                            </p>

                            <h3 className="text-lg font-semibold text-purple-400">2. How We Use Your Information</h3>
                            <p>
                              We use the information we collect to provide, maintain, and improve our services, process
                              transactions, and communicate with you.
                            </p>

                            <h3 className="text-lg font-semibold text-purple-400">3. Information Sharing</h3>
                            <p>
                              We do not sell, trade, or otherwise transfer your personal information to third parties
                              without your consent, except as described in this policy.
                            </p>

                            <h3 className="text-lg font-semibold text-purple-400">4. Data Security</h3>
                            <p>
                              We implement appropriate security measures to protect your personal information against
                              unauthorized access, alteration, disclosure, or destruction.
                            </p>

                            <h3 className="text-lg font-semibold text-purple-400">5. Cookies and Tracking</h3>
                            <p>
                              We use cookies and similar tracking technologies to track activity on our service and hold
                              certain information.
                            </p>

                            <h3 className="text-lg font-semibold text-purple-400">6. Your Rights</h3>
                            <p>
                              You have the right to access, update, or delete your personal information. You may also
                              opt out of certain communications from us.
                            </p>

                            <h3 className="text-lg font-semibold text-purple-400">7. Children's Privacy</h3>
                            <p>
                              Our service is not intended for children under 13. We do not knowingly collect personal
                              information from children under 13.
                            </p>

                            <h3 className="text-lg font-semibold text-purple-400">8. Changes to Privacy Policy</h3>
                            <p>
                              We may update our Privacy Policy from time to time. We will notify you of any changes by
                              posting the new Privacy Policy on this page.
                            </p>
                          </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                  </Label>
                </div>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-slate-300 text-sm">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-purple-400 hover:text-purple-300 underline">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
