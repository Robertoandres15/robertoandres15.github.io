"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FriendRecommendationsMock } from "@/components/friend-recommendations-mock"

export default function MockFeedPage() {
  const [activeTab, setActiveTab] = useState<"following" | "reel-club" | "for-you">("following")

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Your Feed</h1>
            <p className="text-slate-400">Discover what your friends are watching</p>
          </div>

          {/* Tabs */}
          <div className="flex justify-center mb-8">
            <div className="flex bg-white/5 rounded-lg p-1 backdrop-blur-sm">
              <Button
                variant={activeTab === "following" ? "default" : "ghost"}
                onClick={() => setActiveTab("following")}
                className={`px-6 py-2 rounded-md transition-all ${
                  activeTab === "following"
                    ? "bg-purple-600 text-white shadow-lg"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                Following
              </Button>
              <Button
                variant={activeTab === "reel-club" ? "default" : "ghost"}
                onClick={() => setActiveTab("reel-club")}
                className={`px-6 py-2 rounded-md transition-all ${
                  activeTab === "reel-club"
                    ? "bg-purple-600 text-white shadow-lg"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                Reel Club
              </Button>
              <Button
                variant={activeTab === "for-you" ? "default" : "ghost"}
                onClick={() => setActiveTab("for-you")}
                className={`px-6 py-2 rounded-md transition-all ${
                  activeTab === "for-you"
                    ? "bg-purple-600 text-white shadow-lg"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                For You
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="min-h-[600px]">
            {activeTab === "following" && <FriendRecommendationsMock />}
            {activeTab === "reel-club" && (
              <div className="text-center py-12">
                <p className="text-slate-400">Reel Club content would appear here</p>
              </div>
            )}
            {activeTab === "for-you" && (
              <div className="text-center py-12">
                <p className="text-slate-400">For You content would appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
