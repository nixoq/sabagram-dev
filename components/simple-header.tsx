"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Home, Search, PlusSquare, Heart, MessageCircle, User, Settings, LogOut } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function SimpleHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const checkUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (mounted) {
          setUser(session?.user || null)

          if (session?.user) {
            // Fetch user profile
            const { data: profileData } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

            setProfile(profileData)
          }

          setLoading(false)
        }
      } catch (error) {
        console.error("Auth error:", error)
        if (mounted) {
          setUser(null)
          setLoading(false)
        }
      }
    }

    checkUser()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user || null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      router.push("/")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  return (
    <header className="border-b bg-white dark:bg-gray-900 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Camera className="w-8 h-8" />
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Sabagram
          </span>
        </Link>

        {/* Search Bar - Desktop */}
        {user && (
          <div className="hidden md:flex flex-1 max-w-xs mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search"
                className="pl-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : user ? (
          <div className="flex items-center gap-4">
            {/* Navigation Icons */}
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className={`p-2 ${pathname === "/" ? "text-black dark:text-white" : "text-gray-600 dark:text-gray-400"}`}
              >
                <Home className="w-6 h-6" />
              </Button>
            </Link>

            <Link href="/discover">
              <Button
                variant="ghost"
                size="sm"
                className={`p-2 ${pathname === "/discover" ? "text-black dark:text-white" : "text-gray-600 dark:text-gray-400"}`}
              >
                <Search className="w-6 h-6" />
              </Button>
            </Link>

            <Link href="/upload">
              <Button
                variant="ghost"
                size="sm"
                className={`p-2 ${pathname === "/upload" ? "text-black dark:text-white" : "text-gray-600 dark:text-gray-400"}`}
              >
                <PlusSquare className="w-6 h-6" />
              </Button>
            </Link>

            <Button variant="ghost" size="sm" className="p-2 text-gray-600 dark:text-gray-400">
              <Heart className="w-6 h-6" />
            </Button>

            <Button variant="ghost" size="sm" className="p-2 text-gray-600 dark:text-gray-400">
              <MessageCircle className="w-6 h-6" />
            </Button>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-1">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {profile?.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href={`/profile/${user.id}`} className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 text-red-600">
                  <LogOut className="w-4 h-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
                Sign up
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
