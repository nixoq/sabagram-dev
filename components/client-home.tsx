"use client"

import { useAuth } from "@/components/auth-provider"
import { PostCard } from "@/components/post-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface Post {
  id: string
  image_url: string
  caption: string | null
  created_at: string
  profiles: {
    username: string
    full_name: string | null
    avatar_url: string | null
  }
}

interface ClientHomeProps {
  initialPosts?: Post[]
  initialUser?: any
}

export function ClientHome({ initialPosts = [], initialUser }: ClientHomeProps) {
  const { user, loading } = useAuth()
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [postsLoading, setPostsLoading] = useState(false)

  // Use the user from auth context, fallback to initial user
  const currentUser = user || initialUser

  useEffect(() => {
    if (currentUser && initialPosts.length === 0) {
      fetchPosts()
    }
  }, [currentUser, initialPosts.length])

  const fetchPosts = async () => {
    setPostsLoading(true)
    try {
      const { data, error } = await supabase
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

      if (error) {
        console.error("Error fetching posts:", error)
      } else {
        setPosts(data || [])
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setPostsLoading(false)
    }
  }

  if (loading && !initialUser) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </main>
    )
  }

  if (!currentUser) {
    return (
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Welcome to InstaClone</CardTitle>
            <CardDescription>Please sign in or create an account to continue.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <a href="/login">Sign In</a>
            </Button>
            <Button variant="outline" asChild className="w-full bg-transparent">
              <a href="/signup">Create Account</a>
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="grid gap-6 max-w-md mx-auto">
        {postsLoading ? (
          <div className="text-center">Loading posts...</div>
        ) : posts.length > 0 ? (
          posts.map((post) => <PostCard key={post.id} post={post} currentUserId={currentUser.id} />)
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No posts yet. Be the first to share!</p>
            <Button asChild className="mt-4">
              <a href="/upload">Upload Your First Post</a>
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}
