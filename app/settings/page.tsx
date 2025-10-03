"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
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

export default function SettingsPage() {
  const authenticatedUserIdRef = useRef<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dataReady, setDataReady] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState("profile")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false)

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

  const [supabase, setSupabase] = useState<any>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    async function initializeSupabase() {
      try {
        const { createClient } = await import("@/lib/supabase/client")
        const client = createClient()
        setSupabase(client)
      } catch (error) {
        console.error("[v0] Failed to initialize Supabase client:", error)
      }
    }

    initializeSupabase()
  }, [])

  useEffect(() => {
    if (!supabase) return

    async function loadProfile() {
      try {
        setDataReady(false)
        setUser(null)
        setProfile(null)
        setFormData({
          display_name: "",
          bio: "",
          avatar_url: "",
          city: "",
          state: "",
          zip_code: "",
          phone_number: "",
          streaming_services: [],
          likes_theaters: "",
          theater_companion: "",
          likes_series: "",
          preferred_series_genres: [],
          preferred_movie_genres: [],
        })

        console.log("[v0] ===== SETTINGS PAGE LOAD =====")
        console.log("[v0] Timestamp:", new Date().toISOString())
        console.log("[v0] User Agent:", navigator.userAgent)
        console.log("[v0] Window location:", window.location.href)

        console.log("[v0] Step 1: Fetching authenticated user")
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        console.log("[v0] Authenticated user from Supabase:", {
          id: user?.id,
          email: user?.email,
          aud: user?.aud,
          created_at: user?.created_at,
        })

        if (authError || !user) {
          console.error("[v0] ❌ Auth error or no user:", authError)
          toast({
            title: "Session Expired",
            description: "Please log in again to continue.",
            variant: "destructive",
          })
          router.push("/auth/login")
          return
        }

        authenticatedUserIdRef.current = user.id
        console.log("[v0] ✅ Authenticated user ID stored in ref:", authenticatedUserIdRef.current)

        console.log("[v0] Step 2: Fetching profile from database for user ID:", user.id)
        console.log("[v0] Query: SELECT * FROM users WHERE id = '" + user.id + "'")

        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single()

        console.log("[v0] Profile query result:", {
          success: !profileError,
          error: profileError,
          profileId: profile?.id,
          username: profile?.username,
          displayName: profile?.display_name,
          email: profile?.email,
          city: profile?.city,
          state: profile?.state,
          phoneNumber: profile?.phone_number,
        })

        if (profileError) {
          console.error("[v0] ❌ Profile fetch error:", profileError)
          console.error("[v0] Error code:", profileError.code)
          console.error("[v0] Error message:", profileError.message)
          console.error("[v0] Error details:", profileError.details)

          if (profileError.code === "PGRST116") {
            console.error("[v0] No profile found for user:", user.id)
            toast({
              title: "Account Error",
              description: "Your account data is missing. Please contact support.",
              variant: "destructive",
            })
            router.push("/auth/login")
            return
          }

          if (profileError.code === "42501" || profileError.message?.includes("permission denied")) {
            console.error("[v0] ❌ RLS POLICY VIOLATION - User cannot access this profile")
            await supabase.auth.signOut()
            toast({
              title: "Security Error",
              description: "Access denied. Please log in again.",
              variant: "destructive",
            })
            router.push("/auth/login?error=access_denied")
            return
          }

          throw profileError
        }

        console.log("[v0] Step 3: Validating profile ID matches authenticated user ID")
        console.log("[v0] Authenticated user ID:", user.id)
        console.log("[v0] Profile ID from database:", profile.id)
        console.log("[v0] IDs match:", profile.id === user.id)

        if (profile.id !== user.id) {
          console.error("[v0] ❌❌❌ CRITICAL SECURITY ERROR: Profile ID mismatch! ❌❌❌")
          console.error("[v0] This is a DATA LEAK - user is seeing another user's data!")
          console.error("[v0] Authenticated user ID:", user.id)
          console.error("[v0] Profile ID from database:", profile.id)
          console.error("[v0] Profile username:", profile.username)
          console.error("[v0] Profile email:", profile.email)
          console.error("[v0] This indicates RLS is not working correctly!")
          console.error("[v0] Signing out and redirecting to login...")

          await supabase.auth.signOut()

          toast({
            title: "Security Error",
            description: "Profile data mismatch detected. Please log in again and contact support if this persists.",
            variant: "destructive",
          })

          router.push("/auth/login?error=profile_mismatch")
          return
        }

        if (authenticatedUserIdRef.current !== user.id) {
          console.error("[v0] ❌ User changed during load - aborting")
          return
        }

        if (!profile?.username) {
          console.log("[v0] User needs onboarding - no username set")
          router.push("/onboarding")
          return
        }

        console.log("[v0] Step 4: Validation passed - setting state with fresh data")
        console.log("[v0] ✅ Profile ID matches authenticated user ID")
        console.log("[v0] Setting user state:", user.id)
        console.log("[v0] Setting profile state:", profile.username)

        setUser(user)
        setProfile(profile)

        const newFormData = {
          display_name: String(profile.display_name || ""),
          bio: String(profile.bio || ""),
          avatar_url: String(profile.avatar_url || ""),
          city: String(profile.city || ""),
          state: String(profile.state || ""),
          zip_code: String(profile.zip_code || ""),
          phone_number: String(profile.phone_number || ""),
          streaming_services: Array.isArray(profile.streaming_services) ? [...profile.streaming_services] : [],
          likes_theaters: String(profile.likes_theaters || ""),
          theater_companion: String(profile.theater_companion || ""),
          likes_series: String(profile.likes_series || ""),
          preferred_series_genres: Array.isArray(profile.preferred_series_genres)
            ? [...profile.preferred_series_genres]
            : [],
          preferred_movie_genres: Array.isArray(profile.preferred_movie_genres)
            ? [...profile.preferred_movie_genres]
            : [],
        }

        console.log("[v0] Form data to be set:", {
          display_name: newFormData.display_name,
          city: newFormData.city,
          state: newFormData.state,
          phone_number: newFormData.phone_number,
        })

        setFormData(newFormData)

        setSubscriptionStatus(profile.subscription_status || "free")
        setSubscriptionExpiresAt(profile.subscription_expires_at)

        console.log("[v0] ✅ All data validated and set - marking as ready to render")
        setDataReady(true)

        console.log("[v0] ✅✅✅ Profile loaded successfully for user:", profile.username, "✅✅✅")
        console.log("[v0] ===== END SETTINGS PAGE LOAD =====")
      } catch (error) {
        console.error("[v0] ❌ Error loading profile:", error)
        toast({
          title: "Error",
          description: "Failed to load profile. Please try logging in again.",
          variant: "destructive",
        })
        router.push("/auth/login")
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [supabase, router, toast])

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

  const handleDeactivateAccount = async () => {
    if (!user) return

    try {
      // Update user status to deactivated in the database
      const { error } = await supabase
        .from("users")
        .update({
          is_active: false,
          deactivated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) throw error

      // Sign out the user
      await supabase.auth.signOut()

      toast({
        title: "Account Deactivated",
        description: "Your account has been deactivated. You can reactivate it by logging in again.",
      })

      router.push("/")
    } catch (error) {
      console.error("Error deactivating account:", error)
      toast({
        title: "Error",
        description: "Failed to deactivate account",
        variant: "destructive",
      })
    } finally {
      setShowDeactivateConfirm(false)
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

  if (loading || !dataReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <div className="text-white">Loading your settings...</div>
          <div className="text-slate-400 text-sm mt-2">Validating your profile data</div>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">Unable to load profile data</div>
          <Button onClick={() => router.push("/auth/login")} className="bg-purple-600 hover:bg-purple-700">
            Return to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-foreground">
      <nav className="flex items-center justify-start md:justify-center gap-4 md:gap-8 p-4 border-b border-white/10 overflow-x-auto">
        <a
          href="/feed"
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors whitespace-nowrap"
        >
          <User className="w-5 h-5" />
          <span>Feed</span>
        </a>
        <a
          href="/explore"
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors whitespace-nowrap"
        >
          <User className="w-5 h-5" />
          <span>Explore</span>
        </a>
        <a
          href="/friends"
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors whitespace-nowrap"
        >
          <User className="w-5 h-5" />
          <span>Friends</span>
        </a>
        <a
          href="/lists"
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors whitespace-nowrap"
        >
          <User className="w-5 h-5" />
          <span>Lists</span>
        </a>
        <a href="/profile" className="flex items-center gap-2 text-purple-400 font-medium whitespace-nowrap">
          <User className="w-5 h-5" />
          <span>Profile</span>
        </a>
      </nav>

      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-300 text-sm md:text-base">Manage your account settings and preferences</p>
          {user && profile && (
            <div className="mt-4 p-3 bg-purple-600/20 border border-purple-500/30 rounded-lg">
              <p className="text-sm text-purple-200">
                <span className="font-semibold">Logged in as:</span> {user.email} (@{profile.username})
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4 md:gap-8">
          {/* Sidebar - Hidden on mobile */}
          <div className="hidden md:block md:w-64 space-y-2">
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
                    ? "bg-purple-600 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </button>
            ))}
          </div>

          {/* Mobile Navigation - Shown only on mobile */}
          <div className="md:hidden mb-4">
            <select
              value={activeSection}
              onChange={(e) => setActiveSection(e.target.value)}
              className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              <option value="profile">Edit Profile</option>
              <option value="streaming">Streaming Services</option>
              <option value="moderation">Moderation</option>
              <option value="appearance">Appearance</option>
              <option value="notifications">Notifications</option>
              <option value="payments">Payments</option>
              <option value="security">Sign-In & Security</option>
              <option value="legal">Legal</option>
            </select>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 md:p-6">
              {/* Profile Section */}
              {activeSection === "profile" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-4">Edit Profile</h2>

                    {/* Avatar */}
                    <div className="flex items-center gap-4 mb-6">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={formData.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback className="bg-purple-600 text-white text-xl">
                          {formData.display_name?.[0] || profile?.username?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Label htmlFor="avatar_upload" className="text-white">
                          Profile Picture
                        </Label>
                        <div className="flex gap-2 mt-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingAvatar}
                            className="border-white/20 text-white hover:bg-white/10 bg-transparent"
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
                        <p className="text-xs text-gray-300 mt-1">
                          Upload an image file (max 5MB). Supported formats: JPG, PNG, GIF, WebP
                        </p>
                      </div>
                    </div>

                    {/* Username (read-only) */}
                    <div className="mb-4">
                      <Label htmlFor="username" className="text-white">
                        Username
                      </Label>
                      <Input
                        id="username"
                        value={profile?.username ?? ""}
                        disabled
                        className="bg-white/5 border-white/10 text-gray-300"
                      />
                      <p className="text-xs text-gray-300 mt-1">Username cannot be changed</p>
                    </div>

                    {/* Display Name */}
                    <div className="mb-4">
                      <Label htmlFor="display_name" className="text-white">
                        Display Name
                      </Label>
                      <Input
                        id="display_name"
                        placeholder="Your display name"
                        value={formData.display_name}
                        onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                      />
                    </div>

                    {/* Location */}
                    <div className="space-y-4 mb-6">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-purple-400" />
                        <Label className="text-white font-medium">Location</Label>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city" className="text-white text-sm">
                            City
                          </Label>
                          <Input
                            id="city"
                            placeholder="New York"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                          />
                        </div>
                        <div>
                          <Label htmlFor="state" className="text-white text-sm">
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
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="zip_code" className="text-white text-sm">
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
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                        />
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Phone className="h-4 w-4 text-purple-400" />
                        <Label htmlFor="phone_number" className="text-white">
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
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                      />
                      <p className="text-xs text-gray-300 mt-1">Used for SMS friend invitations</p>
                    </div>

                    {/* Bio */}
                    <div className="mb-6">
                      <Label htmlFor="bio" className="text-white">
                        Bio
                      </Label>
                      <Textarea
                        id="bio"
                        placeholder="Tell us about yourself and your movie preferences..."
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-400 min-h-[100px]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Streaming Services Section */}
              {activeSection === "streaming" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Streaming Services</h2>

                  <div className="space-y-4">
                    <p className="text-gray-300">
                      Select the streaming services you're subscribed to for better recommendations:
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        "Disney+",
                        "Hulu",
                        "Netflix",
                        "Max", // Updated from HBO Max
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
                          <Label htmlFor={service} className="text-white">
                            {service}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Theater Preferences */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white">Theater Preferences</h3>
                    <div>
                      <Label className="text-white mb-3 block">Do you like to go to movie theaters?</Label>
                      <RadioGroup
                        value={formData.likes_theaters}
                        onValueChange={(value) => setFormData({ ...formData, likes_theaters: value })}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="theaters-yes" className="border-white/20" />
                          <Label htmlFor="theaters-yes" className="text-white">
                            Yes!
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="sometimes" id="theaters-sometimes" className="border-white/20" />
                          <Label htmlFor="theaters-sometimes" className="text-white">
                            Sometimes
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="theaters-no" className="border-white/20" />
                          <Label htmlFor="theaters-no" className="text-white">
                            Not really
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {(formData.likes_theaters === "yes" || formData.likes_theaters === "sometimes") && (
                      <div>
                        <Label className="text-white mb-3 block">When you go to theaters, do you go:</Label>
                        <RadioGroup
                          value={formData.theater_companion}
                          onValueChange={(value) => setFormData({ ...formData, theater_companion: value })}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="friends-family" id="friends-family" className="border-white/20" />
                            <Label htmlFor="friends-family" className="text-white">
                              With friends and family
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="alone" id="alone" className="border-white/20" />
                            <Label htmlFor="alone" className="text-white">
                              Alone
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="significant-other"
                              id="significant-other"
                              className="border-white/20"
                            />
                            <Label htmlFor="significant-other" className="text-white">
                              With significant other
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    )}
                  </div>

                  {/* Genre Preferences */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white">Genre Preferences</h3>

                    <div>
                      <Label className="text-white mb-3 block">Movie Genres</Label>
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
                            <Label htmlFor={`movie-${genre}`} className="text-white text-sm">
                              {genre}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-white mb-3 block">Series Genres</Label>
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
                            <Label htmlFor={`series-${genre}`} className="text-white text-sm">
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
                  <h2 className="text-xl font-semibold text-white mb-4">Moderation</h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Volume2 className="h-5 w-5 text-purple-400" />
                        <div>
                          <h3 className="text-white font-medium">Muted Accounts</h3>
                          <p className="text-gray-300 text-sm">Manage accounts you've muted</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                        onClick={() => {
                          loadMutedAccounts()
                          setShowMutedDialog(true)
                        }}
                      >
                        Manage
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <UserX className="h-5 w-5 text-red-400" />
                        <div>
                          <h3 className="text-white font-medium">Blocked Accounts</h3>
                          <p className="text-gray-300 text-sm">Manage accounts you've blocked</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10 bg-transparent"
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
                    <h2 className="text-xl font-semibold text-white mb-4">Appearance</h2>
                    <p className="text-gray-300 mb-6">Customize how the app looks and feels</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Moon className="h-5 w-5 text-purple-400" />
                        <div>
                          <h3 className="text-white font-medium">Dark Mode</h3>
                          <p className="text-gray-300 text-sm">Toggle dark mode theme</p>
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
                  <h2 className="text-xl font-semibold text-white mb-4">Manage Notifications</h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div>
                        <h3 className="text-white font-medium">Friend Requests</h3>
                        <p className="text-gray-300 text-sm">Get notified when someone sends you a friend request</p>
                      </div>
                      <Switch
                        checked={notifications.friend_requests}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, friend_requests: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div>
                        <h3 className="text-white font-medium">Recommendations</h3>
                        <p className="text-gray-300 text-sm">Get notified about new movie recommendations</p>
                      </div>
                      <Switch
                        checked={notifications.recommendations}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, recommendations: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div>
                        <h3 className="text-white font-medium">Watch Parties</h3>
                        <p className="text-gray-300 text-sm">Get notified about watch party invitations</p>
                      </div>
                      <Switch
                        checked={notifications.watch_parties}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, watch_parties: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div>
                        <h3 className="text-white font-medium">Email Updates</h3>
                        <p className="text-gray-300 text-sm">Receive weekly email updates about your activity</p>
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
                  <h2 className="text-xl font-semibold text-white mb-4">Payments</h2>

                  <div className="bg-white/5 rounded-lg border border-white/10 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">Ad-Free Subscription</h3>
                        <p className="text-gray-300">Enjoy Reel Friends without ads for $2.99/year</p>
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
                        <div className="text-sm text-gray-300">
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
                  <h2 className="text-xl font-semibold text-white mb-4">Sign-In & Security</h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-purple-400" />
                        <div>
                          <h3 className="text-white font-medium">Email Address</h3>
                          <p className="text-gray-300 text-sm">{user?.email}</p>
                        </div>
                      </div>
                      <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                        Change
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-purple-400" />
                        <div>
                          <h3 className="text-white font-medium">Phone Number</h3>
                          <p className="text-gray-300 text-sm">{formData.phone_number || "Not set"}</p>
                        </div>
                      </div>
                      <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                        {formData.phone_number ? "Change" : "Add"}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-purple-400" />
                        <div>
                          <h3 className="text-white font-medium">Password</h3>
                          <p className="text-gray-300 text-sm">Last changed 30 days ago</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                        onClick={() => setShowPasswordChange(!showPasswordChange)}
                      >
                        {showPasswordChange ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        {showPasswordChange ? "Hide" : "Change"}
                      </Button>
                    </div>

                    {showPasswordChange && (
                      <div className="p-4 bg-white/5 rounded-lg space-y-4">
                        <div>
                          <Label htmlFor="current_password" className="text-white">
                            Current Password
                          </Label>
                          <Input
                            id="current_password"
                            type="password"
                            value={passwordData.current_password}
                            onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                            className="bg-white/5 border-white/10 text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="new_password" className="text-white">
                            New Password
                          </Label>
                          <Input
                            id="new_password"
                            type="password"
                            value={passwordData.new_password}
                            onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                            className="bg-white/5 border-white/10 text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="confirm_password" className="text-white">
                            Confirm New Password
                          </Label>
                          <Input
                            id="confirm_password"
                            type="password"
                            value={passwordData.confirm_password}
                            onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                            className="bg-white/5 border-white/10 text-white"
                          />
                        </div>
                        <Button onClick={handlePasswordChange} className="bg-purple-600 hover:bg-purple-700 text-white">
                          Update Password
                        </Button>
                      </div>
                    )}

                    <Separator className="bg-white/20" />

                    <div className="flex items-center justify-between p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                      <div className="flex items-center gap-3">
                        <UserX className="h-5 w-5 text-orange-400" />
                        <div>
                          <h3 className="text-white font-medium">Deactivate Account</h3>
                          <p className="text-gray-300 text-sm">Temporarily deactivate your account</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="border-orange-500/20 text-orange-400 hover:bg-orange-500/10 bg-transparent"
                        onClick={() => setShowDeactivateConfirm(true)}
                      >
                        Deactivate
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-purple-400" />
                        <div>
                          <h3 className="text-white font-medium">Sign Out</h3>
                          <p className="text-gray-300 text-sm">Sign out of your account on this device</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                        onClick={handleSignOut}
                      >
                        Sign Out
                      </Button>
                    </div>

                    <Separator className="bg-white/20" />

                    <div className="flex items-center justify-between p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                      <div className="flex items-center gap-3">
                        <Trash2 className="h-5 w-5 text-red-400" />
                        <div>
                          <h3 className="text-white font-medium">Delete Account</h3>
                          <p className="text-gray-300 text-sm">Permanently delete your account and all data</p>
                        </div>
                      </div>
                      <Button variant="destructive" onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Legal Section */}
              {activeSection === "legal" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Legal</h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div>
                        <h3 className="text-white font-medium">Terms of Service</h3>
                        <p className="text-gray-300 text-sm">Read our terms of service</p>
                      </div>
                      <Button
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                        onClick={() => router.push("/legal/terms")}
                      >
                        View
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div>
                        <h3 className="text-white font-medium">Privacy Policy</h3>
                        <p className="text-gray-300 text-sm">Read our privacy policy</p>
                      </div>
                      <Button
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                        onClick={() => router.push("/legal/privacy")}
                      >
                        View
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div>
                        <h3 className="text-white font-medium">Data Export</h3>
                        <p className="text-gray-300 text-sm">Download a copy of your data</p>
                      </div>
                      <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent">
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

      <Dialog open={showDeactivateConfirm} onOpenChange={setShowDeactivateConfirm}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Deactivate Account</DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to deactivate your account?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
              <h4 className="font-medium text-orange-400 mb-2">What happens when you deactivate:</h4>
              <ul className="text-sm text-slate-300 space-y-2">
                <li>• Your profile will be hidden from other users</li>
                <li>• You won't receive notifications</li>
                <li>• Your posts and reviews will be hidden</li>
                <li>• You can reactivate anytime by logging back in</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <p className="text-sm text-slate-300">
                <strong className="text-white">Note:</strong> This is different from deleting your account. Deactivation
                is temporary and reversible.
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeactivateConfirm(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
            >
              Cancel
            </Button>
            <Button onClick={handleDeactivateAccount} className="bg-orange-600 hover:bg-orange-700 text-white">
              Deactivate Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
