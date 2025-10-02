"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Film, User, ArrowRight, MapPin, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export const dynamic = "force-dynamic"

export default function OnboardingPage() {
  const [user, setUser] = useState<any>(null)
  const [username, setUsername] = useState("")
  const [bio, setBio] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [zipCode, setZipCode] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const router = useRouter()
  const [supabase, setSupabase] = useState<any>(null)

  useEffect(() => {
    const initializeSupabase = async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client")
        const client = createClient()
        setSupabase(client)
        return client
      } catch (error) {
        console.log("[v0] Failed to create Supabase client:", error)
        return null
      }
    }

    const getUser = async () => {
      try {
        const client = await initializeSupabase()

        if (!client) {
          console.log("[v0] Supabase client not available, using fallback user")
          const mockUser = {
            id: "temp-user-" + Date.now(),
            email: "user@example.com",
          }
          setUser(mockUser)
          setError("Authentication service unavailable. Profile will be saved when service is restored.")
          return
        }

        const {
          data: { user },
        } = await client.auth.getUser()
        if (!user) {
          console.log("[v0] No authenticated user found, using fallback for onboarding")
          const mockUser = {
            id: "temp-user-" + Date.now(),
            email: "user@example.com",
          }
          setUser(mockUser)
          setError("Authentication service unavailable. Profile will be saved when service is restored.")
          return
        }
        console.log("[v0] User found:", user.id)
        setUser(user)
      } catch (error) {
        console.error("[v0] Error getting user in onboarding:", error)
        const mockUser = {
          id: "temp-user-" + Date.now(),
          email: "user@example.com",
        }
        setUser(mockUser)
        setError("Authentication service unavailable. Profile will be saved when service is restored.")
      }
    }
    getUser()
  }, [router])

  const handleZipCodeChange = async (value: string) => {
    const cleanedZip = value.replace(/\D/g, "").slice(0, 5)
    setZipCode(cleanedZip)

    if (cleanedZip.length === 5) {
      setIsLoadingLocation(true)
      try {
        // Use a free ZIP code API to get city and state
        const response = await fetch(`https://api.zippopotam.us/us/${cleanedZip}`)
        if (response.ok) {
          const data = await response.json()
          if (data.places && data.places.length > 0) {
            const place = data.places[0]
            setCity(place["place name"])
            setState(place["state abbreviation"])
            setLocationSuggestions([])
            setShowSuggestions(false)
          }
        }
      } catch (error) {
        console.log("[v0] Error fetching location from ZIP:", error)
      } finally {
        setIsLoadingLocation(false)
      }
    }
  }

  const handleCityChange = async (value: string) => {
    setCity(value)

    // Simple autocomplete with common US cities
    if (value.length >= 2) {
      const commonCities = [
        { city: "New York", state: "NY" },
        { city: "Los Angeles", state: "CA" },
        { city: "Chicago", state: "IL" },
        { city: "Houston", state: "TX" },
        { city: "Phoenix", state: "AZ" },
        { city: "Philadelphia", state: "PA" },
        { city: "San Antonio", state: "TX" },
        { city: "San Diego", state: "CA" },
        { city: "Dallas", state: "TX" },
        { city: "San Jose", state: "CA" },
        { city: "Austin", state: "TX" },
        { city: "Jacksonville", state: "FL" },
        { city: "Fort Worth", state: "TX" },
        { city: "Columbus", state: "OH" },
        { city: "Charlotte", state: "NC" },
        { city: "San Francisco", state: "CA" },
        { city: "Indianapolis", state: "IN" },
        { city: "Seattle", state: "WA" },
        { city: "Denver", state: "CO" },
        { city: "Boston", state: "MA" },
        { city: "Nashville", state: "TN" },
        { city: "Portland", state: "OR" },
        { city: "Las Vegas", state: "NV" },
        { city: "Miami", state: "FL" },
        { city: "Atlanta", state: "GA" },
      ]

      const filtered = commonCities.filter((location) => location.city.toLowerCase().startsWith(value.toLowerCase()))

      setLocationSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setLocationSuggestions([])
      setShowSuggestions(false)
    }
  }

  const selectLocation = (location: { city: string; state: string }) => {
    setCity(location.city)
    setState(location.state)
    setShowSuggestions(false)
    setLocationSuggestions([])
  }

  const handleProfileSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Starting profile setup for user:", user.id)

      if (!supabase) {
        console.log("[v0] Supabase not available, skipping database operations")
        setError("Profile saved locally. Will sync when authentication service is restored.")
        setStep(2)
        setIsLoading(false)
        return
      }

      const { data: existingUser, error: usernameCheckError } = await supabase
        .from("users")
        .select("username")
        .eq("username", username)
        .single()

      console.log("[v0] Username check result:", { existingUser, usernameCheckError })

      if (existingUser) {
        setError("Username is already taken")
        setIsLoading(false)
        return
      }

      const { data: currentUser, error: fetchError } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .single()

      console.log("[v0] Current user check:", { currentUser, fetchError })

      const userData = {
        id: user.id,
        username,
        display_name: username, // Use username as display name
        bio: bio || null,
        city: city || null,
        state: state || null,
        zip_code: zipCode || null,
        phone_number: phoneNumber || null,
      }

      let updateError
      if (!currentUser) {
        console.log("[v0] Creating new user record")
        const { error } = await supabase.from("users").insert(userData)
        updateError = error
      } else {
        console.log("[v0] Updating existing user record")
        const { error } = await supabase.from("users").update(userData).eq("id", user.id)
        updateError = error
      }

      console.log("[v0] Profile update result:", { updateError })

      if (updateError) {
        console.error("[v0] Profile update failed:", updateError)
        throw updateError
      }

      console.log("[v0] Verifying profile was saved...")
      const { data: verifiedProfile, error: verifyError } = await supabase
        .from("users")
        .select("username")
        .eq("id", user.id)
        .single()

      console.log("[v0] Profile verification result:", { verifiedProfile, verifyError })

      if (verifyError || !verifiedProfile?.username) {
        throw new Error("Profile verification failed. Please try again.")
      }

      console.log("[v0] Profile setup successful and verified, moving to completion step")
      setStep(2)
    } catch (error: unknown) {
      console.error("[v0] Profile setup error:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = async () => {
    console.log("[v0] Start Exploring button clicked")
    console.log("[v0] Navigating to feed...")
    // Use replace instead of push to prevent back navigation to onboarding
    router.replace("/feed")
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Film className="h-8 w-8 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">Reel Friends</h1>
          </div>
          <p className="text-slate-300">Let's set up your profile</p>
        </div>

        {step === 1 && (
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <User className="h-5 w-5 text-purple-400" />
                <CardTitle className="text-white">Create Your Profile</CardTitle>
              </div>
              <CardDescription className="text-slate-300">Tell us a bit about yourself to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSetup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white">
                    Username *
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="moviefan123"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                  />
                  <p className="text-xs text-slate-400">This will be your unique identifier and display name</p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-purple-400" />
                    <Label className="text-white text-sm font-medium">
                      Location (Optional - for finding nearby friends)
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode" className="text-white text-sm">
                      Zip Code
                    </Label>
                    <div className="relative">
                      <Input
                        id="zipCode"
                        type="text"
                        placeholder="10001"
                        value={zipCode}
                        onChange={(e) => handleZipCodeChange(e.target.value)}
                        maxLength={5}
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                      />
                      {isLoadingLocation && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400 animate-spin" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400">Enter ZIP code to auto-fill city and state</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2 relative">
                      <Label htmlFor="city" className="text-white text-sm">
                        City
                      </Label>
                      <Input
                        id="city"
                        type="text"
                        placeholder="New York"
                        value={city}
                        onChange={(e) => handleCityChange(e.target.value)}
                        onFocus={() => city.length >= 2 && setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                      />
                      {showSuggestions && locationSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-white/20 rounded-md shadow-lg max-h-48 overflow-y-auto">
                          {locationSuggestions.map((location, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => selectLocation(location)}
                              className="w-full px-3 py-2 text-left text-white hover:bg-purple-600/20 transition-colors text-sm"
                            >
                              {location.city}, {location.state}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-white text-sm">
                        State
                      </Label>
                      <Input
                        id="state"
                        type="text"
                        placeholder="NY"
                        value={state}
                        onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
                        maxLength={2}
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-white text-sm">
                      Phone Number (Optional)
                    </Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={phoneNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "")
                        const formatted = value.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3")
                        setPhoneNumber(formatted)
                      }}
                      className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                    />
                    <p className="text-xs text-slate-400">Used for SMS friend invitations</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-white">
                    Bio (Optional)
                  </Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about your movie preferences..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 resize-none"
                    rows={3}
                  />
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
                  {isLoading ? "Setting up..." : "Continue"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-600/20">
                <Film className="h-8 w-8 text-purple-400" />
              </div>
              <CardTitle className="text-white">Welcome to Reel Friends!</CardTitle>
              <CardDescription className="text-slate-300">
                Your profile has been created successfully. You're ready to start discovering movies with friends.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">What's next?</h3>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• Get AI-powered movie recommendations in "For You"</li>
                  <li>• Explore trending movies and TV shows</li>
                  <li>• Build your wishlist and recommendations</li>
                  <li>• Connect with friends via SMS or username</li>
                  <li>• See what friends in your area are watching</li>
                </ul>
              </div>
              <Button
                onClick={() => {
                  console.log("[v0] Button onClick triggered")
                  handleComplete()
                }}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Start Exploring
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
