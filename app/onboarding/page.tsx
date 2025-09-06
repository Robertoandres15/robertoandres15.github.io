"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Film, User, ArrowRight, MapPin, Popcorn } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export const dynamic = "force-dynamic"

export default function OnboardingPage() {
  const [user, setUser] = useState<any>(null)
  const [username, setUsername] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [bio, setBio] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [zipCode, setZipCode] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [streamingServices, setStreamingServices] = useState<string[]>([])
  const [likesTheaters, setLikesTheaters] = useState("")
  const [theaterCompanion, setTheaterCompanion] = useState("")
  const [likesSeries, setLikesSeries] = useState("")
  const [seriesGenres, setSeriesGenres] = useState<string[]>([])
  const [movieGenres, setMovieGenres] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1)
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
        setDisplayName(user.user_metadata?.display_name || "")
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
        display_name: displayName,
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

      console.log("[v0] Profile setup successful, moving to step 2")
      setStep(2)
    } catch (error: unknown) {
      console.error("[v0] Profile setup error:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreferenceSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Starting preference setup for user:", user.id)

      if (!supabase) {
        console.log("[v0] Supabase not available, skipping preference save")
        setError("Preferences saved locally. Will sync when authentication service is restored.")
        setStep(3)
        setIsLoading(false)
        return
      }

      const preferenceData = {
        streaming_services: streamingServices.length > 0 ? streamingServices : null,
        likes_theaters: likesTheaters || null,
        theater_companion: theaterCompanion || null,
        likes_series: likesSeries || null,
        preferred_series_genres: seriesGenres.length > 0 ? seriesGenres : null,
        preferred_movie_genres: movieGenres.length > 0 ? movieGenres : null,
      }

      const { error } = await supabase.from("users").update(preferenceData).eq("id", user.id)

      if (error) {
        console.error("[v0] Preference update failed:", error)
        throw error
      }

      console.log("[v0] Preferences saved successfully, moving to step 3")
      setStep(3)
    } catch (error: unknown) {
      console.error("[v0] Preference setup error:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = () => {
    router.push("/feed")
  }

  const handleStreamingServiceChange = (service: string, checked: boolean) => {
    if (checked) {
      setStreamingServices([...streamingServices, service])
    } else {
      setStreamingServices(streamingServices.filter((s) => s !== service))
    }
  }

  const handleGenreChange = (genre: string, checked: boolean, type: "series" | "movie") => {
    if (type === "series") {
      if (checked) {
        setSeriesGenres([...seriesGenres, genre])
      } else {
        setSeriesGenres(seriesGenres.filter((g) => g !== genre))
      }
    } else {
      if (checked) {
        setMovieGenres([...movieGenres, genre])
      } else {
        setMovieGenres(movieGenres.filter((g) => g !== genre))
      }
    }
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
                  <p className="text-xs text-slate-400">This will be your unique identifier</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-white">
                    Display Name *
                  </Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Your Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-purple-400" />
                    <Label className="text-white text-sm font-medium">Location (for finding nearby friends)</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-white text-sm">
                        City
                      </Label>
                      <Input
                        id="city"
                        type="text"
                        placeholder="New York"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                      />
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
                    <Label htmlFor="zipCode" className="text-white text-sm">
                      Zip Code
                    </Label>
                    <Input
                      id="zipCode"
                      type="text"
                      placeholder="10001"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
                      maxLength={5}
                      className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                    />
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
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Popcorn className="h-5 w-5 text-purple-400" />
                <CardTitle className="text-white">Your Movie Preferences</CardTitle>
              </div>
              <CardDescription className="text-slate-300">
                Help us recommend the perfect movies and shows for you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePreferenceSetup} className="space-y-6">
                {/* Streaming Services */}
                <div className="space-y-3">
                  <Label className="text-white font-medium">
                    What streaming services are you subscribed to? (Optional)
                  </Label>
                  <p className="text-xs text-slate-400">We'll make recommendations based on this info</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "Disney+",
                      "Hulu",
                      "Netflix",
                      "HBO Max",
                      "Prime Video",
                      "Apple TV",
                      "Peacock",
                      "Paramount+",
                      "YouTube TV",
                    ].map((service) => (
                      <div key={service} className="flex items-center space-x-2">
                        <Checkbox
                          id={service}
                          checked={streamingServices.includes(service)}
                          onCheckedChange={(checked) => handleStreamingServiceChange(service, checked as boolean)}
                          className="border-white/20"
                        />
                        <Label htmlFor={service} className="text-white text-sm">
                          {service}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Theater Preferences */}
                <div className="space-y-3">
                  <Label className="text-white font-medium">Do you like to go to movie theaters? (Optional)</Label>
                  <RadioGroup value={likesTheaters} onValueChange={setLikesTheaters}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="theaters-yes" className="border-white/20" />
                      <Label htmlFor="theaters-yes" className="text-white text-sm">
                        Yes!
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sometimes" id="theaters-sometimes" className="border-white/20" />
                      <Label htmlFor="theaters-sometimes" className="text-white text-sm">
                        Sometimes
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="theaters-no" className="border-white/20" />
                      <Label htmlFor="theaters-no" className="text-white text-sm">
                        Not really
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Theater Companion */}
                {(likesTheaters === "yes" || likesTheaters === "sometimes") && (
                  <div className="space-y-3">
                    <Label className="text-white font-medium">When you go to theaters, do you go:</Label>
                    <RadioGroup value={theaterCompanion} onValueChange={setTheaterCompanion}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="friends-family" id="friends-family" className="border-white/20" />
                        <Label htmlFor="friends-family" className="text-white text-sm">
                          With friends and family
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="alone" id="alone" className="border-white/20" />
                        <Label htmlFor="alone" className="text-white text-sm">
                          Alone
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="significant-other" id="significant-other" className="border-white/20" />
                        <Label htmlFor="significant-other" className="text-white text-sm">
                          With significant other
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {/* Series Preference */}
                <div className="space-y-3">
                  <Label className="text-white font-medium">Do you like streaming series? (Optional)</Label>
                  <RadioGroup value={likesSeries} onValueChange={setLikesSeries}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="series-yes" className="border-white/20" />
                      <Label htmlFor="series-yes" className="text-white text-sm">
                        Yes
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sometimes" id="series-sometimes" className="border-white/20" />
                      <Label htmlFor="series-sometimes" className="text-white text-sm">
                        Sometimes
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="series-no" className="border-white/20" />
                      <Label htmlFor="series-no" className="text-white text-sm">
                        No
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Series Genres */}
                {(likesSeries === "yes" || likesSeries === "sometimes") && (
                  <div className="space-y-3">
                    <Label className="text-white font-medium">What series genres do you prefer? (Optional)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        "Drama",
                        "Horror",
                        "Comedy",
                        "Reality TV",
                        "Crime",
                        "Docuseries",
                        "Mini series",
                        "Historical",
                        "Thriller",
                        "Sci-fi",
                        "Action/Adventure",
                        "Anime",
                      ].map((genre) => (
                        <div key={genre} className="flex items-center space-x-2">
                          <Checkbox
                            id={`series-${genre}`}
                            checked={seriesGenres.includes(genre)}
                            onCheckedChange={(checked) => handleGenreChange(genre, checked as boolean, "series")}
                            className="border-white/20"
                          />
                          <Label htmlFor={`series-${genre}`} className="text-white text-sm">
                            {genre}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Movie Genres */}
                <div className="space-y-3">
                  <Label className="text-white font-medium">What movie genres do you prefer? (Optional)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "Drama",
                      "Horror",
                      "Comedy",
                      "Crime",
                      "Historical",
                      "Thriller",
                      "Sci-fi",
                      "Action/Adventure",
                      "Anime",
                    ].map((genre) => (
                      <div key={genre} className="flex items-center space-x-2">
                        <Checkbox
                          id={`movie-${genre}`}
                          checked={movieGenres.includes(genre)}
                          onCheckedChange={(checked) => handleGenreChange(genre, checked as boolean, "movie")}
                          className="border-white/20"
                        />
                        <Label htmlFor={`movie-${genre}`} className="text-white text-sm">
                          {genre}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {error && <p className="text-red-400 text-sm">{error}</p>}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(3)}
                    className="flex-1 border-white/20 text-white hover:bg-white/10"
                  >
                    Skip
                  </Button>
                  <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Continue"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
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
              <Button onClick={handleComplete} className="w-full bg-purple-600 hover:bg-purple-700">
                Start Exploring
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
