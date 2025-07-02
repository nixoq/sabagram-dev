"use client"

import { useState, useEffect, useCallback } from "react"
import { InstagramPost } from "@/components/instagram-post"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"
import Link from "next/link"

interface Post {
  id: string
  image_url: string
  caption: string | null
  created_at: string
  user_id: string
  profiles: {
    username: string
    full_name: string | null
    avatar_url: string | null
  }
  likes: { user_id: string }[]
}

interface OptimizedHomeFeedProps {
  currentUser: any
  isPublicView?: boolean
}

export function OptimizedHomeFeed({ currentUser, isPublicView = false }: OptimizedHomeFeedProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true)
      setError("")

      // Optimized query - fetch posts with profiles in one go
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select(`
          id,
          image_url,
          caption,
          created_at,
          user_id,
          profiles!posts_user_id_fkey (
            username,
            full_name,
            avatar_url
          )
        `)
        .order("created_at", { ascending: false })
        .limit(20) // Limit initial load

      if (postsError) {
        console.error("Posts fetch error:", postsError)
        setError("Failed to load posts")
        return
      }

      if (!postsData || postsData.length === 0) {
        setPosts([])
        return
      }

      // Fetch all likes for these posts in one query
      const postIds = postsData.map((post) => post.id)
      const { data: likesData } = await supabase.from("likes").select("post_id, user_id").in("post_id", postIds)

      // Combine posts with their likes
      const postsWithLikes = postsData.map((post) => ({
        ...post,
        likes: likesData?.filter((like) => like.post_id === post.id) || [],
      }))

      setPosts(postsWithLikes)
    } catch (error) {
      console.error("Error loading posts:", error)
      setError("Failed to load content")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const handleLikeUpdate = useCallback(
    (postId: string, isLiked: boolean) => {
      if (!currentUser) return

      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id === postId) {
            const updatedLikes = isLiked
              ? [...post.likes.filter((like) => like.user_id !== currentUser.id), { user_id: currentUser.id }]
              : post.likes.filter((like) => like.user_id !== currentUser.id)
            return { ...post, likes: updatedLikes }
          }
          return post
        }),
      )
    },
    [currentUser],
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
          <p className="text-blue-600 dark:text-blue-400">Loading posts...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 dark:border-red-800 bg-white dark:bg-gray-900">
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Posts</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchPosts} className="w-full bg-blue-500 hover:bg-blue-600">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (posts.length === 0) {
    return (
      <Card className="text-center border-blue-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">
            {isPublicView ? "No Posts Yet" : "Welcome to Sabagram!"}
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            {isPublicView ? "Be the first to share something amazing!" : "No posts yet. Be the first to share!"}
          </CardDescription>
        </CardHeader>
        {!isPublicView && (
          <CardContent>
            <Button asChild className="w-full bg-blue-500 hover:bg-blue-600">
              <Link href="/upload">Share Your First Post</Link>
            </Button>
          </CardContent>
        )}
      </Card>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {posts.map((post) => (
        <InstagramPost key={post.id} post={post} currentUserId={currentUser?.id} onLikeUpdate={handleLikeUpdate} />
      ))}
    </div>
  )
}
