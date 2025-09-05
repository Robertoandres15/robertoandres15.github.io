"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, Users, BookmarkPlus, User } from "lucide-react"
import { cn } from "@/lib/utils"

const navigationItems = [
  {
    name: "Feed",
    href: "/feed",
    icon: Home,
  },
  {
    name: "Explore",
    href: "/explore",
    icon: Search,
  },
  {
    name: "Friends",
    href: "/friends",
    icon: Users,
  },
  {
    name: "Lists",
    href: "/lists",
    icon: BookmarkPlus,
  },
  {
    name: "Profile",
    href: "/profile",
    icon: User,
  },
]

export function MobileNavigation() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-t border-white/10 md:hidden">
      <div className="flex items-center justify-around px-2 py-2 safe-area-pb">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-0 flex-1",
                isActive ? "text-purple-400 bg-purple-400/10" : "text-slate-400 hover:text-white hover:bg-white/5",
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-xs font-medium truncate">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
