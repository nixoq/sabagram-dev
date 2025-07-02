"use client"

import type React from "react"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Home, Search, PlusSquare, Heart, User, Settings, LogOut, Shield } from "lucide-react"
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
import { SearchModal } from "@/components/search-modal"
import Image from "next/image"

export function InstagramHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showSearch, setShowSearch] = useState(false)

  useEffect(() => {
    let mounted = true

    const checkUser = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Session error:", error)
        }

        if (mounted) {
          const currentUser = session?.user || null
          setUser(currentUser)

          if (currentUser) {
            // Fetch user profile
            try {
              const { data: profileData, error: profileError } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", currentUser.id)
                .single()

              if (!profileError && profileData) {
                setProfile(profileData)
              }
            } catch (profileError) {
              console.error("Profile fetch error:", profileError)
            }
          } else {
            setProfile(null)
          }

          setLoading(false)
        }
      } catch (error) {
        console.error("Auth error:", error)
        if (mounted) {
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
      }
    }

    checkUser()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        const currentUser = session?.user || null
        setUser(currentUser)

        if (currentUser && event !== "SIGNED_OUT") {
          // Fetch profile for new user
          try {
            const { data: profileData } = await supabase.from("profiles").select("*").eq("id", currentUser.id).single()

            setProfile(profileData)
          } catch (error) {
            console.error("Profile fetch error:", error)
          }
        } else {
          setProfile(null)
        }

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
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Sign out error:", error)
      }
      setUser(null)
      setProfile(null)
      router.push("/")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (user?.id) {
      router.push(`/profile/${user.id}`)
    }
  }

  return (
    <>
      <header className="border-b bg-blue-50 dark:bg-gray-900 border-blue-100 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="relative h-14 w-auto">
              <Image
                src="/images/sabagram-logo.png"
                alt="Sabagram"
                width={210}
                height={56}
                className="h-14 w-auto object-contain"
                priority
              />
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          {user && (
            <div className="hidden md:flex flex-1 max-w-xs mx-8">
              <Button
                variant="ghost"
                onClick={() => setShowSearch(true)}
                className="w-full justify-start text-left bg-blue-50 dark:bg-gray-800 border-blue-200 dark:border-gray-700 hover:bg-blue-100 dark:hover:bg-gray-700"
              >
                <Search className="w-4 h-4 mr-3 text-blue-400" />
                <span className="text-blue-400 dark:text-blue-300">Search</span>
              </Button>
            </div>
          )}

          {/* Navigation */}
          {loading ? (
            <div className="text-sm text-blue-600 dark:text-blue-400">Loading...</div>
          ) : user ? (
            <div className="flex items-center gap-4">
              {/* Navigation Icons */}
              <Link href="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`p-2 hover:bg-blue-100 dark:hover:bg-gray-800 ${
                    pathname === "/" ? "text-blue-600 dark:text-blue-400" : "text-blue-500 dark:text-blue-300"
                  }`}
                >
                  <Home className="w-6 h-6" />
                </Button>
              </Link>

              {/* Mobile Search */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSearch(true)}
                className="md:hidden p-2 hover:bg-blue-100 dark:hover:bg-gray-800 text-blue-500 dark:text-blue-300"
              >
                <Search className="w-6 h-6" />
              </Button>

              <Link href="/discover">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`p-2 hover:bg-blue-100 dark:hover:bg-gray-800 ${
                    pathname === "/discover" ? "text-blue-600 dark:text-blue-400" : "text-blue-500 dark:text-blue-300"
                  }`}
                >
                  <Search className="w-6 h-6" />
                </Button>
              </Link>

              <Link href="/upload">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`p-2 hover:bg-blue-100 dark:hover:bg-gray-800 ${
                    pathname === "/upload" ? "text-blue-600 dark:text-blue-400" : "text-blue-500 dark:text-blue-300"
                  }`}
                >
                  <PlusSquare className="w-6 h-6" />
                </Button>
              </Link>

              <Link href="/liked">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`p-2 hover:bg-blue-100 dark:hover:bg-gray-800 ${
                    pathname === "/liked" ? "text-blue-600 dark:text-blue-400" : "text-blue-500 dark:text-blue-300"
                  }`}
                >
                  <Heart className="w-6 h-6" />
                </Button>
              </Link>

              <Link href="/admin">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`p-2 hover:bg-blue-100 dark:hover:bg-gray-800 ${
                    pathname === "/admin" ? "text-blue-600 dark:text-blue-400" : "text-blue-500 dark:text-blue-300"
                  }`}
                >
                  <Shield className="w-6 h-6" />
                </Button>
              </Link>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-1 hover:bg-blue-100 dark:hover:bg-gray-800">
                    <Avatar className="w-6 h-6 border-2 border-blue-200 dark:border-blue-600">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                        {profile?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 bg-white dark:bg-gray-900 border-blue-200 dark:border-gray-700"
                >
                  <DropdownMenuItem
                    onClick={handleProfileClick}
                    className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-gray-800"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-gray-800">
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-blue-100 dark:bg-gray-700" />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <LogOut className="w-4 h-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-gray-800"
                >
                  Log in
                </Button>
              </Link>
              <Link href="/signup">
                <Button
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
                >
                  Sign up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </header>

      <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </>
  )
}
