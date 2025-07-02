"use client"

import { useEffect, useState } from "react"
import { InstagramHeader } from "@/components/instagram-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { InstagramPost } from "@/components/instagram-post"
import { supabase } from "@/lib/supabase"
import { Heart } from "lucide-react"
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

export default function LikedPage() {
  const [user, setUser] = useState<any>(null)
  const [likedPosts, setLikedPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadLikedPosts = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.user) {
          setLoading(false)
          return
        }

        setUser(session.user)

        // Get posts that the user has liked
        const { data: likedPostIds } = await supabase.from("likes").select("post_id").eq("user_id", session.user.id)

        if (likedPostIds && likedPostIds.length > 0) {
          const postIds = likedPostIds.map((like) => like.post_id)

          // Fetch the actual posts
          const { data: postsData } = await supabase
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
            .in("id", postIds)
            .order("created_at", { ascending: false })

          if (postsData) {
            // Fetch likes for each post
            const { data: likesData } = await supabase.from("likes").select("post_id, user_id").in("post_id", postIds)

            // Combine posts with their likes
            const postsWithLikes = postsData.map((post) => ({
              ...post,
              likes: likesData?.filter((like) => like.post_id === post.id) || [],
            }))

            setLikedPosts(postsWithLikes)
          }
        }

        setLoading(false)
      } catch (error) {
        console.error("Error loading liked posts:", error)
        setLoading(false)
      }
    }

    loadLikedPosts()
  }, [])

  const handleLikeUpdate = (postId: string, isLiked: boolean) => {
    if (!isLiked) {
      // Remove from liked posts if unliked
      setLikedPosts((prev) => prev.filter((post) => post.id !== postId))
    } else {
      // Update like count
      setLikedPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              likes: [...post.likes, { user_id: user.id }],
            }
          }
          return post
        }),
      )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 dark:bg-black">
        <InstagramHeader />
        <main className="max-w-md mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-blue-600 dark:text-blue-400">Loading...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-blue-50 dark:bg-black">
        <InstagramHeader />
        <main className="max-w-md mx-auto px-4 py-8">
          <Card className="text-center border-blue-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Login Required</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Please log in to see your liked posts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-blue-500 hover:bg-blue-600">
                <Link href="/login">Log In</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-black">
      <InstagramHeader />
      <main className="max-w-md mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500 fill-current" />
            Liked Posts
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Posts you've liked</p>
        </div>

        {likedPosts.length > 0 ? (
          <div className="space-y-6">
            {likedPosts.map((post) => (
              <InstagramPost key={post.id} post={post} currentUserId={user.id} onLikeUpdate={handleLikeUpdate} />
            ))}
          </div>
        ) : (
          <Card className="text-center border-blue-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white flex items-center justify-center gap-2">
                <Heart className="w-6 h-6 text-gray-400" />
                No Liked Posts
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Start exploring and like posts to see them here!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-blue-500 hover:bg-blue-600">
                <Link href="/discover">Explore Posts</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
