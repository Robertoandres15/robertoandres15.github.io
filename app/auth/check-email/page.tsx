import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, Film } from "lucide-react"
import Link from "next/link"

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Film className="h-8 w-8 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">Reel Friends</h1>
          </div>
        </div>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-600/20">
              <Mail className="h-8 w-8 text-purple-400" />
            </div>
            <CardTitle className="text-white">Check Your Email</CardTitle>
            <CardDescription className="text-slate-300">
              We've sent you a confirmation link to complete your registration.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-slate-300 text-sm">
              Click the link in your email to verify your account and start discovering movies with friends.
            </p>
            <div className="pt-4">
              <Button variant="outline" asChild className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                <Link href="/auth/login">Back to Sign In</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
