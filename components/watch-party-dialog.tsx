"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Play, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface WatchPartyDialogProps {
  item: {
    id: string
    tmdb_id: number
    media_type: string
    title: string
    poster_path: string
  }
}

export function WatchPartyDialog({ item }: WatchPartyDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [watchDate, setWatchDate] = useState("")
  const [watchTime, setWatchTime] = useState("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handlePropose = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/reel-club/watch-party", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdb_id: item.tmdb_id,
          media_type: item.media_type,
          title: item.title,
          poster_path: item.poster_path,
          scheduled_date: item.media_type === "movie" ? `${watchDate}T${watchTime}` : null,
          message,
        }),
      })

      if (response.ok) {
        setIsOpen(false)
        toast({
          title: "Watch party proposed!",
          description: "Your friends will be notified about your watch party proposal.",
        })
        // Reset form
        setWatchDate("")
        setWatchTime("")
        setMessage("")
      } else {
        throw new Error("Failed to create watch party")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to propose watch party. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
          <Play className="h-4 w-4 mr-2" />
          Watch Together
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Propose Watch Party: {item.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {item.media_type === "movie" && (
            <>
              <div>
                <Label htmlFor="date" className="text-white">
                  Watch Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={watchDate}
                  onChange={(e) => setWatchDate(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="time" className="text-white">
                  Watch Time
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={watchTime}
                  onChange={(e) => setWatchTime(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </>
          )}

          {item.media_type === "tv" && (
            <div className="p-4 bg-purple-600/20 rounded-lg">
              <div className="flex items-center gap-2 text-purple-300">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Series Watch Party</span>
              </div>
              <p className="text-sm text-slate-300 mt-1">
                You'll watch episodes together and track progress to stay in sync.
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="message" className="text-white">
              Message (Optional)
            </Label>
            <Textarea
              id="message"
              placeholder="Add a message to your friends..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handlePropose} className="bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
              {isLoading ? "Proposing..." : "Propose Watch Party"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
