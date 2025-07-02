"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { MobileOptimizedHeader } from "@/components/mobile-optimized-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/lib/supabase"
import { useTheme } from "next-themes"
import { Moon, Sun, Monitor, User, Shield, Bell, Lock, Palette, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let isMounted = true

    const checkUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!isMounted) return

        if (!session?.user) {
          router.push("/login")
          return
        }

        setUser(session.user)
        setLoading(false)
      } catch (error) {
        console.error("Auth error:", error)
        if (isMounted) {
          router.push("/login")
        }
      }
    }

    checkUser()

    return () => {
      isMounted = false
    }
  }, [router])

  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black">
        <MobileOptimizedHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-blue-600 dark:text-blue-400">Loading...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <MobileOptimizedHeader />

      <main className="container mx-auto px-4 py-6 max-w-md">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Manage your account preferences</p>
            </div>
          </div>

          {/* Appearance Settings */}
          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-white">
                <Palette className="w-5 h-5 text-blue-500" />
                Appearance
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Customize how Sabagram looks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label className="text-base font-medium text-gray-900 dark:text-white">Theme</Label>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    className="flex flex-col items-center gap-2 h-auto py-3 bg-transparent border-gray-200 dark:border-gray-700"
                    onClick={() => setTheme("light")}
                  >
                    <Sun className="w-4 h-4" />
                    <span className="text-xs">Light</span>
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    className="flex flex-col items-center gap-2 h-auto py-3 bg-transparent border-gray-200 dark:border-gray-700"
                    onClick={() => setTheme("dark")}
                  >
                    <Moon className="w-4 h-4" />
                    <span className="text-xs">Dark</span>
                  </Button>
                  <Button
                    variant={theme === "system" ? "default" : "outline"}
                    className="flex flex-col items-center gap-2 h-auto py-3 bg-transparent border-gray-200 dark:border-gray-700"
                    onClick={() => setTheme("system")}
                  >
                    <Monitor className="w-4 h-4" />
                    <span className="text-xs">System</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-white">
                <User className="w-5 h-5 text-blue-500" />
                Account
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Manage your profile and account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="space-y-1">
                  <Label className="text-base font-medium text-gray-900 dark:text-white">Edit Profile</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Update your profile information</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="bg-transparent border-gray-200 dark:border-gray-700"
                >
                  <Link href="/settings/profile">Edit</Link>
                </Button>
              </div>

              <Separator className="bg-gray-200 dark:bg-gray-700" />

              <div className="py-2">
                <Label className="text-base font-medium text-gray-900 dark:text-white">Account Information</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Email: {user.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-white">
                <Lock className="w-5 h-5 text-blue-500" />
                Privacy & Security
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Control your privacy settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="space-y-1">
                  <Label htmlFor="private-account" className="text-base font-medium text-gray-900 dark:text-white">
                    Private Account
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Make your posts visible only to followers</p>
                </div>
                <Switch id="private-account" />
              </div>

              <Separator className="bg-gray-200 dark:bg-gray-700" />

              <div className="flex items-center justify-between py-2">
                <div className="space-y-1">
                  <Label htmlFor="show-activity" className="text-base font-medium text-gray-900 dark:text-white">
                    Show Activity Status
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Let others see when you're active</p>
                </div>
                <Switch id="show-activity" defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-white">
                <Bell className="w-5 h-5 text-blue-500" />
                Notifications
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Choose what notifications you receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="space-y-1">
                  <Label htmlFor="like-notifications" className="text-base font-medium text-gray-900 dark:text-white">
                    Likes
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Get notified when someone likes your posts</p>
                </div>
                <Switch id="like-notifications" defaultChecked />
              </div>

              <Separator className="bg-gray-200 dark:bg-gray-700" />

              <div className="flex items-center justify-between py-2">
                <div className="space-y-1">
                  <Label
                    htmlFor="comment-notifications"
                    className="text-base font-medium text-gray-900 dark:text-white"
                  >
                    Comments
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Get notified when someone comments</p>
                </div>
                <Switch id="comment-notifications" defaultChecked />
              </div>

              <Separator className="bg-gray-200 dark:bg-gray-700" />

              <div className="flex items-center justify-between py-2">
                <div className="space-y-1">
                  <Label htmlFor="follow-notifications" className="text-base font-medium text-gray-900 dark:text-white">
                    New Followers
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Get notified when someone follows you</p>
                </div>
                <Switch id="follow-notifications" defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Admin Access */}
          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-white">
                <Shield className="w-5 h-5 text-blue-500" />
                Admin
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Administrative functions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between py-2">
                <div className="space-y-1">
                  <Label className="text-base font-medium text-gray-900 dark:text-white">Admin Panel</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Access moderation tools</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="bg-transparent border-gray-200 dark:border-gray-700"
                >
                  <Link href="/admin">Open</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200 dark:border-red-800 bg-white dark:bg-gray-900">
            <CardHeader className="pb-4">
              <CardTitle className="text-red-600 dark:text-red-400 text-lg">Danger Zone</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between py-2">
                <div className="space-y-1">
                  <Label className="text-base font-medium text-gray-900 dark:text-white">Delete Account</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Permanently delete your account</p>
                </div>
                <Button variant="destructive" size="sm" disabled>
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
