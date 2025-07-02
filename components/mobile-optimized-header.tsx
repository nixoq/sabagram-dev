"use client"

import type React from "react"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Home, Search, PlusSquare, Heart, User, Settings, LogOut, Shield, Menu, FileText, Users } from "lucide-react"
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Image from "next/image"

export function MobileOptimizedHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showSearch, setShowSearch] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
      setMobileMenuOpen(false)
      router.push("/")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (user?.id) {
      setMobileMenuOpen(false)
      router.push(`/profile/${user.id}`)
    }
  }

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/discover", icon: Search, label: "Discover" },
    { href: "/upload", icon: PlusSquare, label: "Create" },
    { href: "/liked", icon: Heart, label: "Activity" },
    { href: "/admin", icon: Shield, label: "Admin" },
  ]

  return (
    <>
      <header className="border-b bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="relative h-8 w-auto">
              <Image
                src="/images/sabagram-logo.png"
                alt="Sabagram"
                width={140}
                height={32}
                className="h-8 w-auto object-contain"
                priority
              />
            </div>
          </Link>

          {/* Desktop Search */}
          {user && (
            <div className="hidden md:flex flex-1 max-w-xs mx-8">
              <Button
                variant="ghost"
                onClick={() => setShowSearch(true)}
                className="w-full justify-start text-left bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <Search className="w-4 h-4 mr-3 text-gray-400" />
                <span className="text-gray-400">Search</span>
              </Button>
            </div>
          )}

          {/* Navigation */}
          {loading ? (
            <div className="text-sm text-gray-600 dark:text-gray-400">Loading...</div>
          ) : user ? (
            <>
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-6">
                {/* Main Navigation Icons */}
                <div className="flex items-center gap-4">
                  <Link href="/">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                        pathname === "/" ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      <Home className="w-6 h-6" />
                    </Button>
                  </Link>

                  <Link href="/discover">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                        pathname === "/discover"
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      <Search className="w-6 h-6" />
                    </Button>
                  </Link>

                  <Link href="/upload">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                        pathname === "/upload" ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      <PlusSquare className="w-6 h-6" />
                    </Button>
                  </Link>

                  <Link href="/liked">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                        pathname === "/liked" ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      <Heart className="w-6 h-6" />
                    </Button>
                  </Link>

                  <Link href="/admin">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                        pathname === "/admin" ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      <Shield className="w-6 h-6" />
                    </Button>
                  </Link>
                </div>

                {/* Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
                      <Avatar className="w-8 h-8 border-2 border-gray-200 dark:border-gray-600">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback className="text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                          {profile?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                  >
                    <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                      <p className="font-medium text-gray-900 dark:text-white">{profile?.username || "User"}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                    </div>

                    <DropdownMenuItem
                      onClick={handleProfileClick}
                      className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link
                        href="/settings"
                        className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-700" />

                    <DropdownMenuItem asChild>
                      <Link
                        href="/rules"
                        className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      >
                        <FileText className="w-4 h-4" />
                        Rules
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link
                        href="/credits"
                        className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      >
                        <Users className="w-4 h-4" />
                        Credits
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-700" />

                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile Navigation */}
              <div className="flex md:hidden items-center gap-2">
                {/* Mobile Search Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSearch(true)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </Button>

                {/* Mobile Menu */}
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
                      <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="right"
                    className="w-80 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                  >
                    <div className="flex flex-col h-full">
                      {/* Profile Section */}
                      <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
                        <Avatar className="w-12 h-12 border-2 border-gray-200 dark:border-gray-600">
                          <AvatarImage src={profile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                            {profile?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white">{profile?.username || "User"}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</p>
                        </div>
                      </div>

                      {/* Navigation Items */}
                      <div className="flex-1 py-4">
                        {navItems.map((item) => (
                          <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                            <div
                              className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                                pathname === item.href
                                  ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                                  : ""
                              }`}
                            >
                              <item.icon className="w-5 h-5" />
                              <span className="font-medium">{item.label}</span>
                            </div>
                          </Link>
                        ))}

                        <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
                          <Link href="/settings" onClick={() => setMobileMenuOpen(false)}>
                            <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800">
                              <Settings className="w-5 h-5" />
                              <span className="font-medium">Settings</span>
                            </div>
                          </Link>

                          <Link href="/rules" onClick={() => setMobileMenuOpen(false)}>
                            <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800">
                              <FileText className="w-5 h-5" />
                              <span className="font-medium">Rules</span>
                            </div>
                          </Link>

                          <Link href="/credits" onClick={() => setMobileMenuOpen(false)}>
                            <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800">
                              <Users className="w-5 h-5" />
                              <span className="font-medium">Credits</span>
                            </div>
                          </Link>
                        </div>
                      </div>

                      {/* Sign Out */}
                      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                        <Button
                          onClick={handleSignOut}
                          variant="ghost"
                          className="w-full justify-start text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          <LogOut className="w-5 h-5 mr-3" />
                          Sign Out
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              {/* Desktop - Not logged in */}
              <div className="hidden md:flex items-center gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                      <Menu className="w-4 h-4" />
                      <span>Menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                  >
                    <DropdownMenuItem asChild>
                      <Link href="/rules" className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <FileText className="w-4 h-4" />
                        Rules
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/credits" className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <Users className="w-4 h-4" />
                        Credits
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Log in
                  </Button>
                </Link>

                <Link href="/signup">
                  <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
                    Sign up
                  </Button>
                </Link>
              </div>

              {/* Mobile - Not logged in */}
              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
                      <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                  >
                    <DropdownMenuItem asChild>
                      <Link href="/rules" className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <FileText className="w-4 h-4" />
                        Rules
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/credits" className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <Users className="w-4 h-4" />
                        Credits
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-700" />
                    <DropdownMenuItem asChild>
                      <Link href="/login" className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                        Log in
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/signup" className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                        Sign up
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Bottom Navigation - Only for logged in users */}
        {user && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-around py-2">
              {navItems.slice(0, 4).map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`p-3 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                      pathname === item.href ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    <item.icon className="w-6 h-6" />
                  </Button>
                </Link>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleProfileClick}
                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Avatar className="w-6 h-6 border-2 border-gray-200 dark:border-gray-600">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    {profile?.username?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </div>
          </div>
        )}
      </header>

      <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </>
  )
}
