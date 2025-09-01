import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Film, Users, Heart, Star } from "lucide-react"

export default async function HomePage() {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // If user is authenticated, redirect immediately
    if (user) {
      redirect("/feed")
    }
  } catch (error) {
    console.log("[v0] Auth check failed, showing landing page")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="animate-in fade-in duration-300">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <header className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-2">
              <Film className="h-8 w-8 text-purple-400" />
              <h1 className="text-2xl font-bold text-white">Reel Friends</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" asChild className="text-white hover:bg-white/10">
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button asChild className="bg-purple-600 hover:bg-purple-700">
                <Link href="/auth/signup">Sign Up</Link>
              </Button>
            </div>
          </header>

          {/* Hero Section */}
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 text-balance">
              Discover Movies with{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Friends
              </span>
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto text-pretty">
              Share recommendations, build wishlists, and discover your next favorite movie through your social circle.
            </p>
            <Button size="lg" asChild className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-6">
              <Link href="/auth/signup">Get Started</Link>
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <Users className="h-12 w-12 text-purple-400 mb-4" />
                <CardTitle className="text-white">Social Discovery</CardTitle>
                <CardDescription className="text-slate-300">
                  Connect with friends and discover movies through their recommendations and wishlists.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <Heart className="h-12 w-12 text-pink-400 mb-4" />
                <CardTitle className="text-white">Personal Lists</CardTitle>
                <CardDescription className="text-slate-300">
                  Create and manage your wishlist and share your favorite recommendations with friends.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <Star className="h-12 w-12 text-yellow-400 mb-4" />
                <CardTitle className="text-white">Smart Feed</CardTitle>
                <CardDescription className="text-slate-300">
                  Stay updated with your friends' latest movie activities and discoveries.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm max-w-2xl mx-auto">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-white mb-4">Ready to start your movie journey?</h3>
                <p className="text-slate-300 mb-6">
                  Join thousands of movie lovers sharing recommendations and building their perfect watchlists.
                </p>
                <Button size="lg" asChild className="bg-purple-600 hover:bg-purple-700">
                  <Link href="/auth/signup">Create Your Account</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
