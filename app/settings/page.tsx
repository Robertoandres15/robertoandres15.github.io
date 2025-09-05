"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  User,
  Save,
  MapPin,
  Phone,
  Mail,
  Shield,
  Bell,
  CreditCard,
  FileText,
  Moon,
  UserX,
  Volume2,
  Trash2,
  Eye,
  EyeOff,
  Tv,
  Palette,
  Lock,
  Search,
  CheckCircle,
  Loader2,
  Users,
  Plus,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import Link from "next/link"

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState("profile")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showPasswordChange, setShowPasswordChange] = useState(false)

  const [formData, setFormData] = useState({
    display_name: "",
    bio: "",
    avatar_url: "",
    city: "",
    state: "",
    zip_code: "",
    phone_number: "",
    streaming_services: [] as string[],
    likes_theaters: "",
    theater_companion: "",
    likes_series: "",
    preferred_series_genres: [] as string[],
    preferred_movie_genres: [] as string[],
  })

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  })
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState({
    friend_requests: true,
    recommendations: true,
    watch_parties: true,
    email_updates: false,
  })
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [mutedAccounts, setMutedAccounts] = useState<Array<{ id: string; username: string; display_name: string }>>([])
  const [blockedAccounts, setBlockedAccounts] = useState<Array<{ id: string; username: string; display_name: string }>>(
    [],
  )
  const [showMutedDialog, setShowMutedDialog] = useState(false)
  const [showBlockedDialog, setShowBlockedDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Array<{ id: string; username: string; display_name: string }>>([])
  const [isSearching, setIsSearching] = useState(false)

  const [subscriptionStatus, setSubscriptionStatus] = useState<"free" | "active" | "expired">("free")
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState<string | null>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)

  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    async function loadProfile() {
      try {
        if (!supabase) {
          console.error("[v0] Supabase client is null - environment variables not configured")
          toast({
            title: "Service Unavailable",
            description: "Authentication service is not available. Please try again later.",
            variant: "destructive",
          })
          return
        }

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/auth/login")
          return
        }

        setUser(user)

        const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()

        if (!profile?.username) {
          router.push("/onboarding")
          return
        }

        setProfile(profile)
        setFormData({
          display_name: profile.display_name || "",
          bio: profile.bio || "",
          avatar_url: profile.avatar_url || "",
          city: profile.city || "",
          state: profile.state || "",
          zip_code: profile.zip_code || "",
          phone_number: profile.phone_number || "",
          streaming_services: profile.streaming_services || [],
          likes_theaters: profile.likes_theaters || "",
          theater_companion: profile.theater_companion || "",
          likes_series: profile.likes_series || "",
          preferred_series_genres: profile.preferred_series_genres || [],
          preferred_movie_genres: profile.preferred_movie_genres || [],
        })
      } catch (error) {
        console.error("Error loading profile:", error)
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [supabase, router, toast])

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await fetch("/api/user/profile")
        if (response.ok) {
          const userData = await response.json()
          if (userData.user) {
            setFormData({
              display_name: userData.user.display_name || "",
              bio: userData.user.bio || "",
              city: userData.user.city || "",
              state: userData.user.state || "",
              zip_code: userData.user.zip_code || "",
              phone_number: userData.user.phone_number || "",
            })
            setProfile(userData.user)

            setSubscriptionStatus(userData.user.subscription_status || "free")
            setSubscriptionExpiresAt(userData.user.subscription_expires_at)
          }
        }
      } catch (error) {
        console.log("Failed to load user data:", error)
      }
    }

    loadUserData()
  }, [])

  useEffect(() => {
    console.log("[v0] Dark mode toggled:", darkMode)
    // Apply dark mode class to document element
    if (darkMode) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("darkMode", "true")
      console.log("[v0] Dark mode enabled, classes:", document.documentElement.classList.toString())
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("darkMode", "false")
      console.log("[v0] Dark mode disabled, classes:", document.documentElement.classList.toString())
    }
  }, [darkMode])

  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode")
    if (savedDarkMode === "true") {
      setDarkMode(true)
    }
  }, [])

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      // Mock search results - in real implementation, this would search the user database
      const mockUsers = [
        { id: "4", username: "alice_cooper", display_name: "Alice Cooper" },
        { id: "5", username: "bob_marley", display_name: "Bob Marley" },
        { id: "6", username: "charlie_brown", display_name: "Charlie Brown" },
        { id: "7", username: "diana_prince", display_name: "Diana Prince" },
      ]

      const filteredUsers = mockUsers.filter(
        (user) =>
          user.username.toLowerCase().includes(query.toLowerCase()) ||
          user.display_name.toLowerCase().includes(query.toLowerCase()),
      )

      setSearchResults(filteredUsers)
    } catch (error) {
      console.log("[v0] Error searching users:", error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleMuteUser = async (user: { id: string; username: string; display_name: string }) => {
    try {
      // Check if user is already muted
      if (mutedAccounts.some((account) => account.id === user.id)) {
        toast({
          title: "Already muted",
          description: "This user is already muted.",
          variant: "destructive",
        })
        return
      }

      // In real implementation, this would call an API to mute the user
      setMutedAccounts((prev) => [...prev, user])
      setSearchQuery("")
      setSearchResults([])
      toast({
        title: "User muted",
        description: `${user.display_name} has been muted successfully.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mute user. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleBlockUser = async (user: { id: string; username: string; display_name: string }) => {
    try {
      // Check if user is already blocked
      if (blockedAccounts.some((account) => account.id === user.id)) {
        toast({
          title: "Already blocked",
          description: "This user is already blocked.",
          variant: "destructive",
        })
        return
      }

      // In real implementation, this would call an API to block the user
      setBlockedAccounts((prev) => [...prev, user])
      setSearchQuery("")
      setSearchResults([])
      toast({
        title: "User blocked",
        description: `${user.display_name} has been blocked successfully.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to block user. Please try again.",
        variant: "destructive",
      })
    }
  }

  const loadMutedAccounts = async () => {
    try {
      // Mock data for now - in real implementation, this would fetch from API
      const mockMutedAccounts = [
        { id: "1", username: "user1", display_name: "John Doe" },
        { id: "2", username: "user2", display_name: "Jane Smith" },
      ]
      setMutedAccounts(mockMutedAccounts)
    } catch (error) {
      console.log("[v0] Error loading muted accounts:", error)
      setMutedAccounts([])
    }
  }

  const loadBlockedAccounts = async () => {
    try {
      // Mock data for now - in real implementation, this would fetch from API
      const mockBlockedAccounts = [{ id: "3", username: "user3", display_name: "Bob Wilson" }]
      setBlockedAccounts(mockBlockedAccounts)
    } catch (error) {
      console.log("[v0] Error loading blocked accounts:", error)
      setBlockedAccounts([])
    }
  }

  const handleUnmute = async (userId: string) => {
    try {
      // In real implementation, this would call an API to unmute the user
      setMutedAccounts((prev) => prev.filter((account) => account.id !== userId))
      toast({
        title: "Account unmuted",
        description: "The account has been unmuted successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unmute account. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUnblock = async (userId: string) => {
    try {
      // In real implementation, this would call an API to unblock the user
      setBlockedAccounts((prev) => prev.filter((account) => account.id !== userId))
      toast({
        title: "Account unblocked",
        description: "The account has been unblocked successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unblock account. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from("users")
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Settings updated successfully",
      })

      // Refresh profile data
      const { data: updatedProfile } = await supabase.from("users").select("*").eq("id", user.id).single()
      setProfile(updatedProfile)
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new_password,
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Password updated successfully",
      })

      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      })
      setShowPasswordChange(false)
    } catch (error) {
      console.error("Error updating password:", error)
      toast({
        title: "Error",
        description: "Failed to update password",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAccount = async () => {
    try {
      // In a real app, you'd want to delete user data first
      await supabase.auth.signOut()
      router.push("/")
      toast({
        title: "Account Deleted",
        description: "Your account has been deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting account:", error)
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive",
      })
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      })
    }
  }

  const handleStreamingServiceChange = (service: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, streaming_services: [...formData.streaming_services, service] })
    } else {
      setFormData({
        ...formData,
        streaming_services: formData.streaming_services.filter((s) => s !== service),
      })
    }
  }

  const handleGenreChange = (genre: string, checked: boolean, type: "series" | "movie") => {
    if (type === "series") {
      if (checked) {
        setFormData({
          ...formData,
          preferred_series_genres: [...formData.preferred_series_genres, genre],
        })
      } else {
        setFormData({
          ...formData,
          preferred_series_genres: formData.preferred_series_genres.filter((g) => g !== genre),
        })
      }
    } else {
      if (checked) {
        setFormData({
          ...formData,
          preferred_movie_genres: [...formData.preferred_movie_genres, genre],
        })
      } else {
        setFormData({
          ...formData,
          preferred_movie_genres: formData.preferred_movie_genres.filter((g) => g !== genre),
        })
      }
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 5MB",
        variant: "destructive",
      })
      return
    }

    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Upload failed")
      }

      const { url } = await response.json()
      setFormData({ ...formData, avatar_url: url })

      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      })
    } catch (error) {
      console.error("Error uploading avatar:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      setUploadingAvatar(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleSubscribe = async () => {
    setIsProcessingPayment(true)
    try {
      // Create payment intent
      const response = await fetch("/api/subscription/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (response.ok) {
        const { paymentIntentId } = await response.json()

        // Simulate payment processing (in real app, this would use Stripe)
        setTimeout(async () => {
          try {
            const confirmResponse = await fetch("/api/subscription/confirm-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentIntentId }),
            })

            if (confirmResponse.ok) {
              const { subscription } = await confirmResponse.json()
              setSubscriptionStatus("active")
              setSubscriptionExpiresAt(subscription.expires_at)
              setShowPaymentDialog(false)
              toast({
                title: "Subscription Activated!",
                description: "You now have ad-free access for one year.",
              })
            }
          } catch (error) {
            toast({
              title: "Payment Error",
              description: "Failed to process payment. Please try again.",
              variant: "destructive",
            })
          }
          setIsProcessingPayment(false)
        }, 2000)
      }
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "Failed to initiate payment. Please try again.",
        variant: "destructive",
      })
      setIsProcessingPayment(false)
    }
  }

  const formatExpiryDate = (dateString: string | null) => {
    if (!dateString) return ""
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="hidden md:block border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link
                href="/feed"
                className="flex items-center space-x-2 text-white/70 hover:text-white transition-colors"
              >
                <Users className="h-5 w-5" />
                <span>Feed</span>
              </Link>
              <Link
                href="/explore"
                className="flex items-center space-x-2 text-white/70 hover:text-white transition-colors"
              >
                <Search className="h-5 w-5" />
                <span>Explore</span>
              </Link>
              <Link
                href="/friends"
                className="flex items-center space-x-2 text-white/70 hover:text-white transition-colors"
              >
                <Users className="h-5 w-5" />
                <span>Friends</span>
              </Link>
              <Link
                href="/lists"
                className="flex items-center space-x-2 text-white/70 hover:text-white transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>Lists</span>
              </Link>
              <Link href="/settings" className="flex items-center space-x-2 text-purple-400 font-medium">
                <User className="h-5 w-5" />
                <span>Settings</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 space-y-2">
            {[
              { id: "profile", label: "Edit Profile", icon: User },
              { id: "streaming", label: "Streaming Services", icon: Tv },
              { id: "moderation", label: "Moderation", icon: Shield },
              { id: "appearance", label: "Appearance", icon: Palette },
              { id: "notifications", label: "Notifications", icon: Bell },
              { id: "payments", label: "Payments", icon: CreditCard },
              { id: "security", label: "Sign-In & Security", icon: Lock },
              { id: "legal", label: "Legal", icon: FileText },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeSection === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </button>
            ))}
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-card border border-border rounded-lg p-6">
              {/* Profile Section */}
              {activeSection === "profile" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-4">Edit Profile</h2>

                    {/* Avatar */}
                    <div className="flex items-center gap-4 mb-6">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={formData.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback className="bg-purple-600 text-white text-xl">
                          {formData.display_name?.[0] || profile?.username?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Label htmlFor="avatar_upload" className="text-foreground">
                          Profile Picture
                        </Label>
                        <div className="flex gap-2 mt-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingAvatar}
                            className="border-white/20 text-foreground hover:bg-white/10 bg-transparent"
                          >
                            {uploadingAvatar ? "Uploading..." : "Upload Photo"}
                          </Button>
                          {formData.avatar_url && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setFormData({ ...formData, avatar_url: "" })}
                              className="border-red-500/20 text-red-400 hover:bg-red-500/10 bg-transparent"
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                        <p className="text-xs text-slate-400 mt-1">
                          Upload an image file (max 5MB). Supported formats: JPG, PNG, GIF, WebP
                        </p>
                      </div>
                    </div>

                    {/* Username (read-only) */}
                    <div className="mb-4">
                      <Label htmlFor="username" className="text-foreground">
                        Username
                      </Label>
                      <Input
                        id="username"
                        value={profile?.username ?? ""}
                        disabled
                        className="bg-white/5 border-white/10 text-slate-400"
                      />
                      <p className="text-xs text-slate-400 mt-1">Username cannot be changed</p>
                    </div>

                    {/* Display Name */}
                    <div className="mb-4">
                      <Label htmlFor="display_name" className="text-foreground">
                        Display Name
                      </Label>
                      <Input
                        id="display_name"
                        placeholder="Your display name"
                        value={formData.display_name}
                        onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                        className="bg-white/5 border-white/10 text-foreground placeholder:text-slate-400"
                      />
                    </div>

                    {/* Location */}
                    <div className="space-y-4 mb-6">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-purple-400" />
                        <Label className="text-foreground font-medium">Location</Label>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city" className="text-foreground text-sm">
                            City
                          </Label>
                          <Input
                            id="city"
                            placeholder="New York"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="bg-white/5 border-white/10 text-foreground placeholder:text-slate-400"
                          />
                        </div>
                        <div>
                          <Label htmlFor="state" className="text-foreground text-sm">
                            State
                          </Label>
                          <Input
                            id="state"
                            placeholder="NY"
                            value={formData.state}
                            onChange={(e) =>
                              setFormData({ ...formData, state: e.target.value.toUpperCase().slice(0, 2) })
                            }
                            maxLength={2}
                            className="bg-white/5 border-white/10 text-foreground placeholder:text-slate-400"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="zip_code" className="text-foreground text-sm">
                          Zip Code
                        </Label>
                        <Input
                          id="zip_code"
                          placeholder="10001"
                          value={formData.zip_code}
                          onChange={(e) =>
                            setFormData({ ...formData, zip_code: e.target.value.replace(/\D/g, "").slice(0, 5) })
                          }
                          maxLength={5}
                          className="bg-white/5 border-white/10 text-foreground placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Phone className="h-4 w-4 text-purple-400" />
                        <Label htmlFor="phone_number" className="text-foreground">
                          Phone Number
                        </Label>
                      </div>
                      <Input
                        id="phone_number"
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={formData.phone_number}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "")
                          const formatted = value.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3")
                          setFormData({ ...formData, phone_number: formatted })
                        }}
                        className="bg-white/5 border-white/10 text-foreground placeholder:text-slate-400"
                      />
                      <p className="text-xs text-slate-400 mt-1">Used for SMS friend invitations</p>
                    </div>

                    {/* Bio */}
                    <div className="mb-6">
                      <Label htmlFor="bio" className="text-foreground">
                        Bio
                      </Label>
                      <Textarea
                        id="bio"
                        placeholder="Tell us about yourself and your movie preferences..."
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        className="bg-white/5 border-white/10 text-foreground placeholder:text-slate-400 min-h-[100px]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Streaming Services Section */}
              {activeSection === "streaming" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Streaming Services</h2>

                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Select the streaming services you're subscribed to for better recommendations:
                    </p>
                    <div className="grid grid-cols-2 gap-4">
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
                            checked={formData.streaming_services.includes(service)}
                            onCheckedChange={(checked) => handleStreamingServiceChange(service, checked as boolean)}
                            className="border-white/20"
                          />
                          <Label htmlFor={service} className="text-foreground">
                            {service}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Theater Preferences */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-foreground">Theater Preferences</h3>
                    <div>
                      <Label className="text-foreground mb-3 block">Do you like to go to movie theaters?</Label>
                      <RadioGroup
                        value={formData.likes_theaters}
                        onValueChange={(value) => setFormData({ ...formData, likes_theaters: value })}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="theaters-yes" className="border-white/20" />
                          <Label htmlFor="theaters-yes" className="text-foreground">
                            Yes!
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="sometimes" id="theaters-sometimes" className="border-white/20" />
                          <Label htmlFor="theaters-sometimes" className="text-foreground">
                            Sometimes
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="theaters-no" className="border-white/20" />
                          <Label htmlFor="theaters-no" className="text-foreground">
                            Not really
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {(formData.likes_theaters === "yes" || formData.likes_theaters === "sometimes") && (
                      <div>
                        <Label className="text-foreground mb-3 block">When you go to theaters, do you go:</Label>
                        <RadioGroup
                          value={formData.theater_companion}
                          onValueChange={(value) => setFormData({ ...formData, theater_companion: value })}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="friends-family" id="friends-family" className="border-white/20" />
                            <Label htmlFor="friends-family" className="text-foreground">
                              With friends and family
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="alone" id="alone" className="border-white/20" />
                            <Label htmlFor="alone" className="text-foreground">
                              Alone
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="significant-other"
                              id="significant-other"
                              className="border-white/20"
                            />
                            <Label htmlFor="significant-other" className="text-foreground">
                              With significant other
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    )}
                  </div>

                  {/* Genre Preferences */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-foreground">Genre Preferences</h3>

                    <div>
                      <Label className="text-foreground mb-3 block">Movie Genres</Label>
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
                              checked={formData.preferred_movie_genres.includes(genre)}
                              onCheckedChange={(checked) => handleGenreChange(genre, checked as boolean, "movie")}
                              className="border-white/20"
                            />
                            <Label htmlFor={`movie-${genre}`} className="text-foreground text-sm">
                              {genre}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-foreground mb-3 block">Series Genres</Label>
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
                              checked={formData.preferred_series_genres.includes(genre)}
                              onCheckedChange={(checked) => handleGenreChange(genre, checked as boolean, "series")}
                              className="border-white/20"
                            />
                            <Label htmlFor={`series-${genre}`} className="text-foreground text-sm">
                              {genre}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Moderation Section */}
              {activeSection === "moderation" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Moderation</h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Volume2 className="h-5 w-5 text-primary" />
                        <div>
                          <h3 className="text-foreground font-medium">Muted Accounts</h3>
                          <p className="text-muted-foreground text-sm">Manage accounts you've muted</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="border-white/20 text-foreground hover:bg-white/10 bg-transparent"
                        onClick={() => {
                          loadMutedAccounts()
                          setShowMutedDialog(true)
                        }}
                      >
                        Manage
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <UserX className="h-5 w-5 text-red-400" />
                        <div>
                          <h3 className="text-foreground font-medium">Blocked Accounts</h3>
                          <p className="text-muted-foreground text-sm">Manage accounts you've blocked</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="border-white/20 text-foreground hover:bg-white/10 bg-transparent"
                        onClick={() => {
                          loadBlockedAccounts()
                          setShowBlockedDialog(true)
                        }}
                      >
                        Manage
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance Section */}
              {activeSection === "appearance" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-4">Appearance</h2>
                    <p className="text-muted-foreground mb-6">Customize how the app looks and feels</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Moon className="h-5 w-5 text-primary" />
                        <div>
                          <h3 className="text-foreground font-medium">Dark Mode</h3>
                          <p className="text-muted-foreground text-sm">Toggle dark mode theme</p>
                        </div>
                      </div>
                      <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Section */}
              {activeSection === "notifications" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Manage Notifications</h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <h3 className="text-foreground font-medium">Friend Requests</h3>
                        <p className="text-muted-foreground text-sm">
                          Get notified when someone sends you a friend request
                        </p>
                      </div>
                      <Switch
                        checked={notifications.friend_requests}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, friend_requests: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <h3 className="text-foreground font-medium">Recommendations</h3>
                        <p className="text-muted-foreground text-sm">Get notified about new movie recommendations</p>
                      </div>
                      <Switch
                        checked={notifications.recommendations}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, recommendations: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <h3 className="text-foreground font-medium">Watch Parties</h3>
                        <p className="text-muted-foreground text-sm">Get notified about watch party invitations</p>
                      </div>
                      <Switch
                        checked={notifications.watch_parties}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, watch_parties: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <h3 className="text-foreground font-medium">Email Updates</h3>
                        <p className="text-muted-foreground text-sm">
                          Receive weekly email updates about your activity
                        </p>
                      </div>
                      <Switch
                        checked={notifications.email_updates}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, email_updates: checked })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Payments Section */}
              {activeSection === "payments" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Payments</h2>

                  <div className="bg-card rounded-lg border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">Ad-Free Subscription</h3>
                        <p className="text-muted-foreground">Enjoy Reel Friends without ads for $2.99/year</p>
                      </div>
                      <div className="text-right">
                        <div
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            subscriptionStatus === "active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                          }`}
                        >
                          {subscriptionStatus === "active" ? "Active" : "Free"}
                        </div>
                      </div>
                    </div>

                    {subscriptionStatus === "active" ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="font-medium text-green-800 dark:text-green-200">Subscription Active</p>
                              <p className="text-sm text-green-600 dark:text-green-300">
                                Expires on {formatExpiryDate(subscriptionExpiresAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Your subscription will automatically expire on the date shown above. You can resubscribe at
                          any time to continue enjoying ad-free access.
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                          <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-2">Why subscribe?</h4>
                          <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                            <li>• No advertisements</li>
                            <li>• Support app development</li>
                            <li>• Premium user experience</li>
                            <li>• Only $2.99 for a full year</li>
                          </ul>
                        </div>
                        <Button
                          onClick={() => setShowPaymentDialog(true)}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          Subscribe for $2.99/year
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Security Section */}
              {activeSection === "security" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Sign-In & Security</h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-primary" />
                        <div>
                          <h3 className="text-foreground font-medium">Email Address</h3>
                          <p className="text-muted-foreground text-sm">{user?.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="border-white/20 text-foreground hover:bg-white/10 bg-transparent"
                      >
                        Change
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-primary" />
                        <div>
                          <h3 className="text-foreground font-medium">Phone Number</h3>
                          <p className="text-muted-foreground text-sm">{formData.phone_number || "Not set"}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="border-white/20 text-foreground hover:bg-white/10 bg-transparent"
                      >
                        {formData.phone_number ? "Change" : "Add"}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-primary" />
                        <div>
                          <h3 className="text-foreground font-medium">Password</h3>
                          <p className="text-muted-foreground text-sm">Last changed 30 days ago</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="border-white/20 text-foreground hover:bg-white/10 bg-transparent"
                        onClick={() => setShowPasswordChange(!showPasswordChange)}
                      >
                        {showPasswordChange ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        {showPasswordChange ? "Hide" : "Change"}
                      </Button>
                    </div>

                    {showPasswordChange && (
                      <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                        <div>
                          <Label htmlFor="current_password" className="text-foreground">
                            Current Password
                          </Label>
                          <Input
                            id="current_password"
                            type="password"
                            value={passwordData.current_password}
                            onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                            className="bg-white/5 border-white/10 text-foreground"
                          />
                        </div>
                        <div>
                          <Label htmlFor="new_password" className="text-foreground">
                            New Password
                          </Label>
                          <Input
                            id="new_password"
                            type="password"
                            value={passwordData.new_password}
                            onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                            className="bg-white/5 border-white/10 text-foreground"
                          />
                        </div>
                        <div>
                          <Label htmlFor="confirm_password" className="text-foreground">
                            Confirm New Password
                          </Label>
                          <Input
                            id="confirm_password"
                            type="password"
                            value={passwordData.confirm_password}
                            onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                            className="bg-white/5 border-white/10 text-foreground"
                          />
                        </div>
                        <Button onClick={handlePasswordChange} className="bg-primary hover:bg-primary/80">
                          Update Password
                        </Button>
                      </div>
                    )}

                    <Separator className="bg-muted" />

                    <div className="flex items-center justify-between p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                      <div className="flex items-center gap-3">
                        <Trash2 className="h-5 w-5 text-destructive" />
                        <div>
                          <h3 className="text-foreground font-medium">Delete Account</h3>
                          <p className="text-muted-foreground text-sm">Permanently delete your account and all data</p>
                        </div>
                      </div>
                      <Button variant="destructive" onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}>
                        Delete
                      </Button>
                    </div>

                    {showDeleteConfirm && (
                      <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                        <p className="text-foreground mb-4">
                          Are you sure you want to delete your account? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            onClick={() => setShowDeleteConfirm(false)}
                            className="border-white/20 text-foreground hover:bg-white/10"
                          >
                            Cancel
                          </Button>
                          <Button variant="destructive" onClick={handleDeleteAccount}>
                            Yes, Delete Account
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Legal Section */}
              {activeSection === "legal" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Legal</h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <h3 className="text-foreground font-medium">Terms of Service</h3>
                        <p className="text-muted-foreground text-sm">Read our terms of service</p>
                      </div>
                      <Button
                        variant="outline"
                        className="border-white/20 text-foreground hover:bg-white/10 bg-transparent"
                        onClick={() => router.push("/legal/terms")}
                      >
                        View
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <h3 className="text-foreground font-medium">Privacy Policy</h3>
                        <p className="text-muted-foreground text-sm">Read our privacy policy</p>
                      </div>
                      <Button
                        variant="outline"
                        className="border-white/20 text-foreground hover:bg-white/10 bg-transparent"
                        onClick={() => router.push("/legal/privacy")}
                      >
                        View
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <h3 className="text-foreground font-medium">Data Export</h3>
                        <p className="text-muted-foreground text-sm">Download a copy of your data</p>
                      </div>
                      <Button
                        variant="outline"
                        className="border-white/20 text-foreground hover:bg-white/10 bg-transparent"
                      >
                        Export
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              {(activeSection === "profile" || activeSection === "streaming" || activeSection === "notifications") && (
                <div className="pt-6 border-t border-border">
                  <Button onClick={handleSave} disabled={saving} className="w-full bg-primary hover:bg-primary/80">
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showMutedDialog} onOpenChange={setShowMutedDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Muted Accounts</DialogTitle>
            <DialogDescription className="text-slate-400">
              Accounts you've muted won't appear in your feed or notifications.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Add User to Mute</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search users to mute..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    searchUsers(e.target.value)
                  }}
                  className="pl-10 bg-slate-800 border-slate-600 text-white placeholder-slate-400"
                />
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="max-h-32 overflow-y-auto bg-slate-800 rounded-lg border border-slate-600">
                  {searchResults.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-2 hover:bg-slate-700">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                          {user.display_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{user.display_name}</p>
                          <p className="text-slate-400 text-xs">@{user.username}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent text-xs"
                        onClick={() => handleMuteUser(user)}
                      >
                        Mute
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-slate-700 pt-4">
              <h4 className="text-sm font-medium text-slate-300 mb-2">Currently Muted</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {mutedAccounts.length === 0 ? (
                  <p className="text-slate-400 text-center py-4 text-sm">No muted accounts</p>
                ) : (
                  mutedAccounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {account.display_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-white font-medium">{account.display_name}</p>
                          <p className="text-slate-400 text-sm">@{account.username}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                        onClick={() => handleUnmute(account.id)}
                      >
                        Unmute
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showBlockedDialog} onOpenChange={setShowBlockedDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Blocked Accounts</DialogTitle>
            <DialogDescription className="text-slate-400">
              Blocked accounts cannot interact with you or see your content.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Add User to Block</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search users to block..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    searchUsers(e.target.value)
                  }}
                  className="pl-10 bg-slate-800 border-slate-600 text-white placeholder-slate-400"
                />
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="max-h-32 overflow-y-auto bg-slate-800 rounded-lg border border-slate-600">
                  {searchResults.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-2 hover:bg-slate-700">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                          {user.display_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{user.display_name}</p>
                          <p className="text-slate-400 text-xs">@{user.username}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-600 text-red-400 hover:bg-red-600/20 bg-transparent text-xs"
                        onClick={() => handleBlockUser(user)}
                      >
                        Block
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-slate-700 pt-4">
              <h4 className="text-sm font-medium text-slate-300 mb-2">Currently Blocked</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {blockedAccounts.length === 0 ? (
                  <p className="text-slate-400 text-center py-4 text-sm">No blocked accounts</p>
                ) : (
                  blockedAccounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {account.display_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-white font-medium">{account.display_name}</p>
                          <p className="text-slate-400 text-sm">@{account.username}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                        onClick={() => handleUnblock(account.id)}
                      >
                        Unblock
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Subscribe to Ad-Free</DialogTitle>
            <DialogDescription>Get one year of ad-free access to Reel Friends for just $2.99</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Ad-Free Subscription</span>
                <span className="font-bold">$2.99</span>
              </div>
              <div className="text-sm text-muted-foreground">Valid for 365 days from purchase date</div>
            </div>

            <div className="text-sm text-muted-foreground">
              <p className="mb-2">This subscription includes:</p>
              <ul className="space-y-1 ml-4">
                <li>• No advertisements</li>
                <li>• Full access to all features</li>
                <li>• Support for app development</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)} disabled={isProcessingPayment}>
              Cancel
            </Button>
            <Button
              onClick={handleSubscribe}
              disabled={isProcessingPayment}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Subscribe Now"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
