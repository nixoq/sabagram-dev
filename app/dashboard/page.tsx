"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SimpleHeader } from "@/components/simple-header"
import { PostCard } from "@/components/post-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    const checkUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!mounted) return

        if (!session?.user) {
          router.push("/login")
          return
        }

        setUser(session.user)

        // Try to fetch posts
        try {
          const { data: posts, error: postsError } = await supabase
            .from("posts")
            .select(`
              *,
              profiles (
                username,
                full_name,
                avatar_url
              )
            `)
            .order("created_at", { ascending: false })

          if (postsError) {
            console.error("Posts error:", postsError)
            setError("Could not load posts. Database may not be set up.")
          } else {
            setPosts(posts || [])
          }
        } catch (postsError) {
          console.error("Posts fetch error:", postsError)
          setError("Could not load posts. Database may not be set up.")
        }

        setLoading(false)
      } catch (error) {
        console.error("Auth check error:", error)
        if (mounted) {
          router.push("/login")
        }
      }
    }

    checkUser()

    return () => {
      mounted = false
    }
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SimpleHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SimpleHeader />
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Database Setup Required</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
                  Open Supabase Dashboard
                </a>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SimpleHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 max-w-md mx-auto">
          {posts.length > 0 ? (
            posts.map((post) => <PostCard key={post.id} post={post} currentUserId={user?.id} />)
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Welcome to Sabagram!</CardTitle>
                <CardDescription>No posts yet. Be the first to share!</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <a href="/upload">Upload Your First Post</a>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
