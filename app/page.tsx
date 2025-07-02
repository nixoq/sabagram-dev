"use client"

import { useEffect, useState } from "react"
import { MobileOptimizedHeader } from "@/components/mobile-optimized-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { OptimizedHomeFeed } from "@/components/optimized-home-feed"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import Image from "next/image"

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadData = async () => {
      try {
        // Get current session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (!mounted) return

        if (sessionError) {
          console.error("Session error:", sessionError)
        }

        const currentUser = session?.user || null
        setUser(currentUser)
        setLoading(false)
      } catch (error) {
        console.error("Error loading data:", error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadData()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black">
        <MobileOptimizedHeader />
        <main className="container mx-auto px-4 py-8 max-w-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-blue-600 dark:text-blue-400">Loading...</p>
          </div>
        </main>
      </div>
    )
  }

  // If no user, show welcome page
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black">
        <MobileOptimizedHeader />
        <main className="container mx-auto px-4 py-8 max-w-md">
          <div className="space-y-6">
            <Card className="text-center border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <Image
                    src="/images/sabagram-logo.png"
                    alt="Sabagram"
                    width={240}
                    height={72}
                    className="h-16 w-auto object-contain"
                    priority
                  />
                </div>
                <CardTitle className="text-xl text-gray-900 dark:text-white">Welcome to Sabagram</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Share your moments with the world
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Join our community to share photos, connect with friends, and discover amazing content.
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button asChild className="w-full bg-blue-500 hover:bg-blue-600">
                      <Link href="/login">Log In</Link>
                    </Button>
                    <Button
                      variant="outline"
                      asChild
                      className="w-full border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 bg-transparent"
                    >
                      <Link href="/signup">Sign Up</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features showcase */}
            <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Why join Sabagram?</h3>
                  <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Share your favorite moments with photos</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Connect with friends and discover new content</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Like, comment, and engage with the community</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Explore trending posts and hashtags</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Call to action */}
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Ready to start sharing your story?</p>
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold px-8"
              >
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // For authenticated users, show feed
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <MobileOptimizedHeader />
      <main className="container mx-auto px-4 py-6 max-w-md">
        <OptimizedHomeFeed currentUser={user} />
      </main>
    </div>
  )
}
