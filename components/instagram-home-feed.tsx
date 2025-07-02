"use client"

import { useState } from "react"
import { InstagramPost } from "@/components/instagram-post"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"

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

interface InstagramHomeFeedProps {
  initialPosts: Post[]
  currentUser: any
  isPublicView?: boolean
}

export function InstagramHomeFeed({ initialPosts, currentUser, isPublicView = false }: InstagramHomeFeedProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)

  const handleLikeUpdate = (postId: string, isLiked: boolean) => {
    if (!currentUser) return // Don't allow likes for non-authenticated users

    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          const updatedLikes = isLiked
            ? [...post.likes, { user_id: currentUser.id }]
            : post.likes.filter((like) => like.user_id !== currentUser.id)
          return { ...post, likes: updatedLikes }
        }
        return post
      }),
    )
  }

  if (posts.length === 0) {
    return (
      <Card className="text-center">
        <CardHeader>
          <CardTitle>{isPublicView ? "No Posts Yet" : "Welcome to Sabagram!"}</CardTitle>
          <CardDescription>
            {isPublicView ? "Be the first to share something amazing!" : "No posts yet. Be the first to share!"}
          </CardDescription>
        </CardHeader>
        {!isPublicView && (
          <CardContent>
            <Button asChild className="w-full bg-blue-500 hover:bg-blue-600">
              <a href="/upload">Share Your First Post</a>
            </Button>
          </CardContent>
        )}
      </Card>
    )
  }

  return (
    <div className="space-y-0">
      {posts.map((post) => (
        <div key={post.id}>
          {isPublicView ? (
            // Simplified post view for non-authenticated users
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold">
                    {post.profiles.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{post.profiles.username}</p>
                    <p className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="aspect-square relative mb-3 rounded-lg overflow-hidden">
                  <Image
                    src={post.image_url || "/placeholder.svg"}
                    alt={post.caption || "Post image"}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-sm">{post.likes.length} likes</span>
                  </div>

                  {post.caption && (
                    <div className="text-sm">
                      <span className="font-semibold">{post.profiles.username}</span> {post.caption.split("\n\n")[0]}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <InstagramPost post={post} currentUserId={currentUser?.id} onLikeUpdate={handleLikeUpdate} />
          )}
        </div>
      ))}
    </div>
  )
}
