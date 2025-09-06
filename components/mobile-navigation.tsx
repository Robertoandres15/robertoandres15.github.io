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
    ariaLabel: "Go to Feed page",
  },
  {
    name: "Explore",
    href: "/explore",
    icon: Search,
    ariaLabel: "Go to Explore movies and TV shows",
  },
  {
    name: "Friends",
    href: "/friends",
    icon: Users,
    ariaLabel: "Go to Friends page",
  },
  {
    name: "Lists",
    href: "/lists",
    icon: BookmarkPlus,
    ariaLabel: "Go to Lists and wishlists",
  },
  {
    name: "Profile",
    href: "/profile",
    icon: User,
    ariaLabel: "Go to Profile page",
  },
]

export function MobileNavigation() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-t border-white/10 md:hidden"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around px-1 py-2 pb-safe">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-3 rounded-lg transition-colors min-w-0 flex-1 min-h-[44px] justify-center",
                isActive ? "text-purple-400 bg-purple-400/10" : "text-slate-400 hover:text-white hover:bg-white/5",
              )}
              aria-label={item.ariaLabel}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-xs font-medium leading-tight text-center max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
