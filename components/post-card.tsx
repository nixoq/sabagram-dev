"use client"

import Image from "next/image"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Share, Trash2 } from "lucide-react"
import { deletePost, toggleLike } from "@/lib/actions"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface PostCardProps {
  post: {
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
  currentUserId?: string
  showDeleteButton?: boolean
  onLikeUpdate?: (postId: string, isLiked: boolean) => void
}

export function PostCard({ post, currentUserId, showDeleteButton, onLikeUpdate }: PostCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  const router = useRouter()

  const isLiked = post.likes.some((like) => like.user_id === currentUserId)
  const likesCount = post.likes.length

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return

    setIsDeleting(true)
    try {
      await deletePost(post.id, post.image_url)
      router.refresh()
    } catch (error) {
      console.error("Failed to delete post:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleLike = async () => {
    if (!currentUserId || isLiking) return

    setIsLiking(true)
    try {
      await toggleLike(post.id, currentUserId)
      onLikeUpdate?.(post.id, !isLiked)
    } catch (error) {
      console.error("Failed to toggle like:", error)
    } finally {
      setIsLiking(false)
    }
  }

  // Split caption and description if they exist
  const captionParts = post.caption?.split("\n\n") || []
  const caption = captionParts[0] || ""
  const description = captionParts[1] || ""

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-row items-center gap-3 pb-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={post.profiles.avatar_url || undefined} />
          <AvatarFallback>{post.profiles.username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold text-sm">{post.profiles.username}</p>
          <p className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleDateString()}</p>
        </div>
        {showDeleteButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <div className="aspect-square relative">
          <Image
            src={post.image_url || "/placeholder.svg"}
            alt={caption || "Post image"}
            fill
            className="object-cover"
          />
        </div>
      </CardContent>

      <CardFooter className="flex flex-col items-start gap-3 pt-3">
        <div className="flex items-center gap-2 w-full">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={isLiking}
            className={`p-2 ${isLiked ? "text-red-500" : "text-gray-600"}`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
          </Button>
          <Button variant="ghost" size="sm" className="p-2">
            <MessageCircle className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" className="p-2">
            <Share className="w-5 h-5" />
          </Button>
        </div>

        {likesCount > 0 && (
          <p className="text-sm font-semibold">
            {likesCount} {likesCount === 1 ? "like" : "likes"}
          </p>
        )}

        {caption && (
          <div className="text-sm">
            <span className="font-semibold">{post.profiles.username}</span> {caption}
          </div>
        )}

        {description && <div className="text-sm text-muted-foreground">{description}</div>}
      </CardFooter>
    </Card>
  )
}
