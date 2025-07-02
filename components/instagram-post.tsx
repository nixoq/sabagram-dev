"use client"

import type React from "react"

import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Smile, Trash2 } from "lucide-react"
import { toggleLike, addComment, deletePost } from "@/lib/actions"
import { useState, useEffect, useTransition } from "react"
import { formatDistanceToNow } from "date-fns"
import { supabase } from "@/lib/supabase"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CommentsModal } from "@/components/comments-modal"
import { useRouter } from "next/navigation"

interface Comment {
  id: string
  content: string
  created_at: string
  profiles: {
    username: string
    avatar_url: string | null
  }
}

interface InstagramPostProps {
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
    comments?: Comment[]
  }
  currentUserId?: string
  onLikeUpdate?: (postId: string, isLiked: boolean) => void
  showDeleteButton?: boolean
}

export function InstagramPost({ post, currentUserId, onLikeUpdate, showDeleteButton }: InstagramPostProps) {
  const [isPending, startTransition] = useTransition()
  const [comment, setComment] = useState("")
  const [comments, setComments] = useState<Comment[]>(post.comments || [])
  const [showComments, setShowComments] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [localLikes, setLocalLikes] = useState(post.likes)
  const [error, setError] = useState("")
  const [isLiking, setIsLiking] = useState(false)
  const router = useRouter()

  const isLiked = localLikes.some((like) => like.user_id === currentUserId)
  const likesCount = localLikes.length
  const isOwnPost = currentUserId === post.user_id

  // Load comments
  useEffect(() => {
    const loadComments = async () => {
      try {
        const { data } = await supabase
          .from("comments")
          .select(`
            *,
            profiles (
              username,
              avatar_url
            )
          `)
          .eq("post_id", post.id)
          .order("created_at", { ascending: true })
          .limit(2)

        if (data) {
          setComments(data)
        }
      } catch (error) {
        console.error("Error loading comments:", error)
      }
    }

    loadComments()
  }, [post.id])

  const handleLike = async () => {
    if (!currentUserId || isLiking) return

    setError("")
    setIsLiking(true)

    // Optimistic update
    const newIsLiked = !isLiked
    const newLikes = newIsLiked
      ? [...localLikes, { user_id: currentUserId }]
      : localLikes.filter((like) => like.user_id !== currentUserId)

    setLocalLikes(newLikes)
    onLikeUpdate?.(post.id, newIsLiked)

    try {
      console.log("Attempting to toggle like for post:", post.id, "user:", currentUserId)

      const result = await toggleLike(post.id, currentUserId)

      if (!result.success) {
        console.error("Like failed:", result.error)
        setError(result.error || "Failed to toggle like")
        // Revert optimistic update on error
        setLocalLikes(post.likes)
        onLikeUpdate?.(post.id, isLiked)
      } else {
        console.log("Like successful:", result.isLiked)
        // Update with server response
        const serverLikes = result.isLiked
          ? [...post.likes.filter((like) => like.user_id !== currentUserId), { user_id: currentUserId }]
          : post.likes.filter((like) => like.user_id !== currentUserId)
        setLocalLikes(serverLikes)
      }
    } catch (error) {
      console.error("Failed to toggle like:", error)
      setError("Network error. Please try again.")
      // Revert optimistic update on error
      setLocalLikes(post.likes)
      onLikeUpdate?.(post.id, isLiked)
    } finally {
      setIsLiking(false)
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUserId || !comment.trim() || isPending) return

    const commentText = comment.trim()
    setComment("")
    setError("")

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append("postId", post.id)
        formData.append("userId", currentUserId)
        formData.append("content", commentText)

        const result = await addComment(formData)

        if (!result.success) {
          setError(result.error || "Failed to add comment")
          setComment(commentText) // Restore comment on error
        } else {
          // Reload comments
          const { data } = await supabase
            .from("comments")
            .select(`
              *,
              profiles (
                username,
                avatar_url
              )
            `)
            .eq("post_id", post.id)
            .order("created_at", { ascending: true })
            .limit(2)

          if (data) {
            setComments(data)
          }
        }
      } catch (error) {
        console.error("Failed to add comment:", error)
        setError("Failed to add comment")
        setComment(commentText) // Restore comment on error
      }
    })
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return

    setError("")

    startTransition(async () => {
      try {
        const result = await deletePost(post.id, post.image_url, currentUserId!)

        if (!result.success) {
          setError(result.error || "Failed to delete post")
        } else {
          // Refresh the page to show updated posts
          router.refresh()
        }
      } catch (error) {
        console.error("Failed to delete post:", error)
        setError("Failed to delete post")
      }
    })
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.profiles.username}'s post on Sabagram`,
          text: post.caption || "Check out this post on Sabagram!",
          url: window.location.origin + `/post/${post.id}`,
        })
      } catch (error) {
        console.log("Error sharing:", error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.origin + `/post/${post.id}`)
      alert("Link copied to clipboard!")
    }
  }

  const formatTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true })
  }

  return (
    <article className="bg-white dark:bg-black border border-blue-200 dark:border-gray-800 rounded-lg mb-6 shadow-sm">
      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950 border-b border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError("")}
            className="mt-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8 border-2 border-blue-200 dark:border-blue-600">
            <AvatarImage src={post.profiles.avatar_url || undefined} />
            <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
              {post.profiles.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm text-gray-900 dark:text-white">{post.profiles.username}</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="p-1 hover:bg-blue-50 dark:hover:bg-gray-800">
              <MoreHorizontal className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white dark:bg-gray-900 border-blue-200 dark:border-gray-700">
            <DropdownMenuItem onClick={handleShare} className="hover:bg-blue-50 dark:hover:bg-gray-800">
              Share
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-blue-50 dark:hover:bg-gray-800">Copy link</DropdownMenuItem>
            {(isOwnPost || showDeleteButton) && (
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isPending}
                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isPending ? "Deleting..." : "Delete"}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Image */}
      <div className="aspect-square relative">
        <Image
          src={post.image_url || "/placeholder.svg"}
          alt={post.caption || "Post image"}
          fill
          className="object-cover"
        />
      </div>

      {/* Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={isLiking || !currentUserId}
              className="p-0 hover:bg-transparent"
            >
              <Heart
                className={`w-6 h-6 transition-colors ${
                  isLiked ? "fill-red-500 text-red-500" : "text-blue-500 dark:text-blue-400"
                } ${isLiking ? "animate-pulse" : ""}`}
              />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(true)}
              disabled={!currentUserId}
              className="p-0 hover:bg-transparent"
            >
              <MessageCircle className="w-6 h-6 text-blue-500 dark:text-blue-400" />
            </Button>

            <Button variant="ghost" size="sm" onClick={handleShare} className="p-0 hover:bg-transparent">
              <Send className="w-6 h-6 text-blue-500 dark:text-blue-400" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsBookmarked(!isBookmarked)}
            className="p-0 hover:bg-transparent"
          >
            <Bookmark
              className={`w-6 h-6 ${
                isBookmarked
                  ? "fill-blue-500 text-blue-500 dark:fill-blue-400 dark:text-blue-400"
                  : "text-blue-500 dark:text-blue-400"
              }`}
            />
          </Button>
        </div>

        {/* Likes */}
        {likesCount > 0 && (
          <p className="font-semibold text-sm mb-2 text-gray-900 dark:text-white">
            {likesCount} {likesCount === 1 ? "like" : "likes"}
          </p>
        )}

        {/* Caption */}
        {post.caption && (
          <div className="text-sm mb-2 text-gray-900 dark:text-white">
            <span className="font-semibold mr-2">{post.profiles.username}</span>
            <span>{post.caption.split("\n\n")[0]}</span>
          </div>
        )}

        {/* Comments Preview */}
        {comments.length > 0 && (
          <div className="space-y-1 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(true)}
              className="p-0 h-auto text-blue-500 dark:text-blue-400 hover:bg-transparent text-sm"
            >
              View all comments
            </Button>

            {comments.slice(0, 2).map((comment) => (
              <div key={comment.id} className="text-sm text-gray-900 dark:text-white">
                <span className="font-semibold mr-2">{comment.profiles.username}</span>
                <span>{comment.content}</span>
              </div>
            ))}
          </div>
        )}

        {/* Time */}
        <p className="text-xs text-blue-400 dark:text-blue-300 uppercase tracking-wide mb-3">
          {formatTimeAgo(post.created_at)}
        </p>

        {/* Add Comment */}
        {currentUserId && (
          <form
            onSubmit={handleComment}
            className="flex items-center gap-3 pt-3 border-t border-blue-100 dark:border-gray-800"
          >
            <Smile className="w-6 h-6 text-blue-400 dark:text-blue-300" />
            <Input
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="flex-1 border-none bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-900 dark:text-white placeholder:text-blue-400 dark:placeholder:text-blue-300"
              disabled={isPending}
            />
            {comment.trim() && (
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                disabled={isPending}
                className="p-0 text-blue-500 hover:bg-transparent font-semibold"
              >
                {isPending ? "Posting..." : "Post"}
              </Button>
            )}
          </form>
        )}
      </div>

      {/* Comments Modal */}
      <CommentsModal
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        post={post}
        currentUserId={currentUserId}
      />
    </article>
  )
}
