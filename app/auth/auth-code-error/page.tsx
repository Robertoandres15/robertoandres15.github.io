import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Film } from "lucide-react"
import Link from "next/link"

export default function AuthCodeErrorPage() {
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
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-600/20">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <CardTitle className="text-white">Authentication Error</CardTitle>
            <CardDescription className="text-slate-300">
              There was a problem confirming your email address.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-slate-300 text-sm">
              The confirmation link may have expired or been used already. Please try signing up again or contact
              support if the problem persists.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild className="bg-purple-600 hover:bg-purple-700">
                <Link href="/auth/signup">Try Again</Link>
              </Button>
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
