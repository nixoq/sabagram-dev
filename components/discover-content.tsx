"use client"

import { useState, useEffect } from "react"
import { InstagramHeader } from "@/components/instagram-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { InstagramPost } from "@/components/instagram-post"
import { supabase } from "@/lib/supabase"
import Image from "next/image"
import { Heart, MessageCircle } from "lucide-react"
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

export function DiscoverContent() {
  const [user, setUser] = useState<any>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        setUser(session?.user)

        // Fetch posts with proper relationships
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

        if (postsError) {
          console.error("Posts fetch error:", postsError)
          setLoading(false)
          return
        }

        // Fetch likes separately for each post
        let postsWithLikes = []
        if (postsData && postsData.length > 0) {
          const postIds = postsData.map((post) => post.id)

          const { data: likesData } = await supabase.from("likes").select("post_id, user_id").in("post_id", postIds)

          // Combine posts with their likes
          postsWithLikes = postsData.map((post) => ({
            ...post,
            likes: likesData?.filter((like) => like.post_id === post.id) || [],
          }))
        }

        setPosts(postsWithLikes)
        setLoading(false)
      } catch (error) {
        console.error("Error:", error)
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handlePostClick = (post: Post) => {
    setSelectedPost(post)
    setDialogOpen(true)
  }

  const handleLikeUpdate = (postId: string, isLiked: boolean) => {
    if (!user) return

    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          const updatedLikes = isLiked
            ? [...post.likes, { user_id: user.id }]
            : post.likes.filter((like) => like.user_id !== user.id)
          return { ...post, likes: updatedLikes }
        }
        return post
      }),
    )

    // Update selected post if it's the same one
    if (selectedPost?.id === postId) {
      const updatedLikes = isLiked
        ? [...selectedPost.likes, { user_id: user.id }]
        : selectedPost.likes.filter((like) => like.user_id !== user.id)
      setSelectedPost({ ...selectedPost, likes: updatedLikes })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 dark:bg-black">
        <InstagramHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-blue-600 dark:text-blue-400">Loading...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-black">
      <InstagramHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Explore</h1>
            <p className="text-gray-600 dark:text-gray-400">Discover posts from the community</p>
          </div>

          {posts.length > 0 ? (
            <div className="grid grid-cols-3 gap-1 md:gap-2">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="aspect-square relative cursor-pointer group overflow-hidden rounded-sm border border-blue-100 dark:border-gray-800"
                  onClick={() => handlePostClick(post)}
                >
                  <Image
                    src={post.image_url || "/placeholder.svg"}
                    alt={post.caption || "Post"}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-4 text-white">
                      <div className="flex items-center gap-1">
                        <Heart className="w-5 h-5 fill-current" />
                        <span className="font-semibold">{post.likes.length}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-5 h-5 fill-current" />
                        <span className="font-semibold">0</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card className="border-blue-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">No Posts Yet</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Be the first to share something amazing!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  asChild
                  className="w-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                  <Link href="/upload">Upload Your First Post</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Post Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md p-0 bg-white dark:bg-gray-900 border-blue-200 dark:border-gray-800">
          {selectedPost && (
            <InstagramPost post={selectedPost} currentUserId={user?.id} onLikeUpdate={handleLikeUpdate} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
