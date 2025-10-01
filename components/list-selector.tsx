"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Heart, ListIcon, ChevronDown, Check, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MediaItem {
  id: number
  title?: string
  name?: string
  poster_path: string | null
  overview: string
  release_date?: string
  first_air_date?: string
  vote_average: number
  media_type: "movie" | "tv"
}

interface ListSelectorProps {
  mediaItem: MediaItem
  actionType: "wishlist" | "recommendations"
  onSuccess?: () => void
}

export function ListSelector({ mediaItem, actionType, onSuccess }: ListSelectorProps) {
  const [userLists, setUserLists] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { toast } = useToast()

  const title = mediaItem.title || mediaItem.name || "Unknown"
  const releaseDate = mediaItem.release_date || mediaItem.first_air_date

  useEffect(() => {
    loadUserLists()
  }, [])

  const loadUserLists = async () => {
    try {
      const response = await fetch(`/api/lists?type=${actionType}`)
      const data = await response.json()
      if (response.ok) {
        setUserLists(data.lists || [])
      }
    } catch (error) {
      console.error("Failed to load user lists:", error)
    }
  }

  const addToList = async (listId?: string) => {
    setIsLoading(true)
    try {
      let targetList = listId ? userLists.find((list) => list.id === listId) : null

      if (!targetList) {
        const existingLists = userLists.filter((list) => list.type === actionType)

        if (existingLists.length === 0) {
          const defaultName = actionType === "wishlist" ? "My Wishlist" : "My Recommendations"
          const createResponse = await fetch("/api/lists", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: defaultName,
              type: actionType,
              description:
                actionType === "wishlist"
                  ? "Movies and shows I want to watch"
                  : "Movies and shows I recommend to others",
              is_public: actionType === "recommendations",
            }),
          })

          if (createResponse.ok) {
            const newList = await createResponse.json()
            targetList = newList.list
            setUserLists((prev) => [...prev, targetList!])
          } else {
            if (createResponse.status === 401) {
              toast({
                title: "Please log in",
                description: "You need to be logged in to create lists. Redirecting to login...",
                variant: "destructive",
              })
              setTimeout(() => {
                window.location.href = "/auth/login"
              }, 2000)
              return
            }
            const errorData = await createResponse.json().catch(() => ({}))
            throw new Error(errorData.error || `Failed to create ${actionType} list`)
          }
        } else {
          targetList = existingLists[0]
        }
      }

      if (!targetList) {
        throw new Error("No target list available")
      }

      const response = await fetch(`/api/lists/${targetList.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdb_id: mediaItem.id,
          media_type: mediaItem.media_type,
          title: title,
          poster_path: mediaItem.poster_path,
          overview: mediaItem.overview,
          release_date: releaseDate,
          rating: mediaItem.vote_average,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setShowSuccess(true)

        toast({
          title: "✅ Successfully Added!",
          description: (
            <div className="space-y-1">
              <div className="font-medium">{title}</div>
              <div className="text-sm opacity-90">Added to "{targetList.name}"</div>
              {data.mutualMatch && (
                <div className="text-sm text-green-400 font-medium">🎉 You and a friend both want to watch this!</div>
              )}
            </div>
          ),
          className: "border-green-500/20 bg-green-950/50",
        })

        setIsDialogOpen(false)
        onSuccess?.()

        setTimeout(() => setShowSuccess(false), 2000)
      } else {
        if (response.status === 401) {
          toast({
            title: "Please log in",
            description: "You need to be logged in to add items to lists. Redirecting to login...",
            variant: "destructive",
          })
          setTimeout(() => {
            window.location.href = "/auth/login"
          }, 2000)
          return
        }
        toast({
          title: `Failed to add to ${actionType}`,
          description: data.error || "An error occurred",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error(`Failed to add to ${actionType}:`, error)
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
      toast({
        title: `Failed to add to ${actionType}`,
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createNewList = async (listName: string) => {
    try {
      const response = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: listName,
          type: actionType,
          description: `Custom ${actionType} list`,
          is_public: actionType === "recommendations",
        }),
      })

      if (response.ok) {
        const newList = await response.json()
        setUserLists((prev) => [...prev, newList.list])
        await addToList(newList.list.id)
      } else {
        if (response.status === 401) {
          toast({
            title: "Please log in",
            description: "You need to be logged in to create lists. Redirecting to login...",
            variant: "destructive",
          })
          setTimeout(() => {
            window.location.href = "/auth/login"
          }, 2000)
          return
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to create new list")
      }
    } catch (error) {
      console.error("Failed to create list:", error)
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
      toast({
        title: "Failed to create list",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const relevantLists = userLists.filter((list) => list.type === actionType)
  const hasMultipleLists = relevantLists.length > 1

  const getButtonIcon = () => {
    if (showSuccess) return Check
    if (isLoading) return Loader2
    return actionType === "wishlist" ? Plus : Heart
  }

  const getButtonText = () => {
    if (showSuccess) return "Added!"
    if (isLoading) return "Adding..."
    return actionType === "wishlist" ? "Add to Wishlist" : "Recommend"
  }

  const getButtonClassName = () => {
    const baseClass =
      actionType === "wishlist"
        ? "bg-purple-600 hover:bg-purple-700"
        : "bg-slate-700 hover:bg-slate-600 border-white/20 text-white"

    if (showSuccess) {
      return "bg-green-600 hover:bg-green-700 transition-all duration-300"
    }

    return baseClass
  }

  const ButtonIcon = getButtonIcon()

  if (!hasMultipleLists) {
    return (
      <Button
        onClick={() => addToList()}
        disabled={isLoading || showSuccess}
        className={getButtonClassName()}
        variant="default"
      >
        <ButtonIcon className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : showSuccess ? "animate-pulse" : ""}`} />
        {getButtonText()}
      </Button>
    )
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className={getButtonClassName()} variant="default" disabled={showSuccess}>
          <ButtonIcon className={`h-4 w-4 mr-2 ${showSuccess ? "animate-pulse" : ""}`} />
          {showSuccess ? "Added!" : actionType === "wishlist" ? "Add to Wishlist" : "Recommend"}
          {!showSuccess && <ChevronDown className="h-4 w-4 ml-2" />}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">
            Choose {actionType === "wishlist" ? "Wishlist" : "Recommendations List"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-slate-300 mb-4">Select which list to add "{title}" to:</div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {relevantLists.map((list) => (
              <button
                key={list.id}
                onClick={() => addToList(list.id)}
                disabled={isLoading}
                className="w-full text-left p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors border border-slate-600/50 hover:border-slate-500/50 disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">{list.name}</div>
                    <div className="text-sm text-slate-300 flex items-center gap-2">
                      <ListIcon className="h-3 w-3" />
                      {list.type}
                      {list.is_public && (
                        <Badge variant="outline" className="text-xs border-green-500/50 text-green-400">
                          Public
                        </Badge>
                      )}
                    </div>
                  </div>
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin text-purple-400" />}
                </div>
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-600/50">
            <CreateNewListForm actionType={actionType} onCreateList={createNewList} isLoading={isLoading} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface CreateNewListFormProps {
  actionType: "wishlist" | "recommendations"
  onCreateList: (name: string) => void
  isLoading: boolean
}

function CreateNewListForm({ actionType, onCreateList, isLoading }: CreateNewListFormProps) {
  const [newListName, setNewListName] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newListName.trim()) return

    setIsCreating(true)
    await onCreateList(newListName.trim())
    setNewListName("")
    setIsCreating(false)
  }

  if (!isCreating) {
    return (
      <Button
        onClick={() => setIsCreating(true)}
        variant="outline"
        className="w-full border-slate-600 bg-slate-800/50 text-white hover:bg-slate-700/50 hover:border-slate-500"
        disabled={isLoading}
      >
        <Plus className="h-4 w-4 mr-2" />
        Create New {actionType === "wishlist" ? "Wishlist" : "Recommendations List"}
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        value={newListName}
        onChange={(e) => setNewListName(e.target.value)}
        placeholder={`Enter ${actionType} name...`}
        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        autoFocus
      />
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={!newListName.trim() || isLoading}
          className="flex-1 bg-purple-600 hover:bg-purple-700"
        >
          Create & Add
        </Button>
        <Button
          type="button"
          onClick={() => setIsCreating(false)}
          variant="outline"
          className="border-slate-600 text-slate-200 hover:bg-slate-700/50"
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
