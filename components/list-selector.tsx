"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Heart, ListIcon, ChevronDown } from "lucide-react"
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

      // If no specific list provided or list not found, create/find default list
      if (!targetList) {
        const existingLists = userLists.filter((list) => list.type === actionType)

        if (existingLists.length === 0) {
          // Create default list
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
            throw new Error(`Failed to create ${actionType} list`)
          }
        } else {
          // Use first existing list of this type
          targetList = existingLists[0]
        }
      }

      if (!targetList) {
        throw new Error("No target list available")
      }

      // Add item to the selected list
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
        toast({
          title: `Added to ${targetList.name}`,
          description: `${title} has been added to your ${targetList.name.toLowerCase()}`,
        })
        setIsDialogOpen(false)
        onSuccess?.()
      } else {
        toast({
          title: `Failed to add to ${actionType}`,
          description: data.error || "An error occurred",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error(`Failed to add to ${actionType}:`, error)
      toast({
        title: `Failed to add to ${actionType}`,
        description: `An error occurred while adding to your ${actionType}`,
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
        throw new Error("Failed to create new list")
      }
    } catch (error) {
      toast({
        title: "Failed to create list",
        description: "An error occurred while creating the new list",
        variant: "destructive",
      })
    }
  }

  const relevantLists = userLists.filter((list) => list.type === actionType)
  const hasMultipleLists = relevantLists.length > 1
  const ButtonIcon = actionType === "wishlist" ? Plus : Heart
  const buttonText = actionType === "wishlist" ? "Add to Wishlist" : "Recommend"

  // If user has 0 or 1 list, use simple button
  if (!hasMultipleLists) {
    return (
      <Button
        onClick={() => addToList()}
        disabled={isLoading}
        className={actionType === "wishlist" ? "bg-purple-600 hover:bg-purple-700" : ""}
        variant={actionType === "wishlist" ? "default" : "outline"}
      >
        <ButtonIcon className="h-4 w-4 mr-2" />
        {isLoading ? "Adding..." : buttonText}
      </Button>
    )
  }

  // If user has multiple lists, show selection dialog
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          className={actionType === "wishlist" ? "bg-purple-600 hover:bg-purple-700" : ""}
          variant={actionType === "wishlist" ? "default" : "outline"}
        >
          <ButtonIcon className="h-4 w-4 mr-2" />
          {buttonText}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">
            Choose {actionType === "wishlist" ? "Wishlist" : "Recommendations List"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-gray-300 mb-4">Select which list to add "{title}" to:</div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {relevantLists.map((list) => (
              <button
                key={list.id}
                onClick={() => addToList(list.id)}
                disabled={isLoading}
                className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10 hover:border-white/20"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">{list.name}</div>
                    <div className="text-sm text-gray-400 flex items-center gap-2">
                      <ListIcon className="h-3 w-3" />
                      {list.type}
                      {list.is_public && (
                        <Badge variant="outline" className="text-xs border-green-500/50 text-green-400">
                          Public
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-white/10">
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
        className="w-full border-white/20 text-white hover:bg-white/10"
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
        className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
          className="border-white/20 text-white hover:bg-white/10"
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
