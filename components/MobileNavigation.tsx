"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, Users, List, User } from "lucide-react"

export default function MobileNavigation() {
  const pathname = usePathname()

  const navItems = [
    {
      href: "/feed",
      icon: Home,
      label: "Feed",
      active: pathname === "/feed",
    },
    {
      href: "/explore",
      icon: Search,
      label: "Explore",
      active: pathname === "/explore",
    },
    {
      href: "/friends",
      icon: Users,
      label: "Friends",
      active: pathname === "/friends",
    },
    {
      href: "/lists",
      icon: List,
      label: "Lists",
      active: pathname === "/lists",
    },
    {
      href: "/profile",
      icon: User,
      label: "Profile",
      active: pathname === "/profile",
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700 md:hidden z-50">
      <div className="flex items-center justify-around py-2 px-4 safe-area-pb">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors ${
                item.active ? "text-purple-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
