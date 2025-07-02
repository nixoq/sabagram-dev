"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Heart, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { addComment } from "@/lib/actions"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: {
    username: string
    avatar_url: string | null
  }
}

interface CommentsModalProps {
  isOpen: boolean
  onClose: () => void
  post: {
    id: string
    image_url: string
    caption: string | null
    created_at: string
    profiles: {
      username: string
      avatar_url: string | null
    }
  }
  currentUserId?: string
}

export function CommentsModal({ isOpen, onClose, post, currentUserId }: CommentsModalProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isCommenting, setIsCommenting] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadComments()
    }
  }, [isOpen, post.id])

  const loadComments = async () => {
    setLoading(true)
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

      if (data) {
        setComments(data)
      }
    } catch (error) {
      console.error("Error loading comments:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUserId || !newComment.trim() || isCommenting) return

    setIsCommenting(true)
    try {
      const formData = new FormData()
      formData.append("postId", post.id)
      formData.append("userId", currentUserId)
      formData.append("content", newComment.trim())

      await addComment(formData)
      setNewComment("")
      await loadComments()
    } catch (error) {
      console.error("Failed to add comment:", error)
    } finally {
      setIsCommenting(false)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[80vh] p-0 overflow-hidden">
        <div className="flex h-full">
          {/* Image Side */}
          <div className="flex-1 bg-black flex items-center justify-center">
            <div className="relative aspect-square w-full max-w-lg">
              <Image src={post.image_url || "/placeholder.svg"} alt="Post image" fill className="object-contain" />
            </div>
          </div>

          {/* Comments Side */}
          <div className="w-80 flex flex-col bg-white dark:bg-gray-900">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={post.profiles.avatar_url || undefined} />
                  <AvatarFallback>{post.profiles.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="font-semibold text-sm">{post.profiles.username}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} className="p-1">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Caption */}
            {post.caption && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={post.profiles.avatar_url || undefined} />
                    <AvatarFallback>{post.profiles.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="text-sm">
                      <span className="font-semibold mr-2">{post.profiles.username}</span>
                      <span>{post.caption}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(post.created_at)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Comments */}
            <ScrollArea className="flex-1 p-4">
              {loading ? (
                <div className="text-center text-gray-500">Loading comments...</div>
              ) : comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={comment.profiles.avatar_url || undefined} />
                        <AvatarFallback>{comment.profiles.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="text-sm">
                          <span className="font-semibold mr-2">{comment.profiles.username}</span>
                          <span>{comment.content}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-xs text-gray-500">{formatTimeAgo(comment.created_at)}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 h-auto text-xs text-gray-500 hover:bg-transparent"
                          >
                            Reply
                          </Button>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="p-1">
                        <Heart className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500">No comments yet</div>
              )}
            </ScrollArea>

            {/* Add Comment */}
            {currentUserId && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                <form onSubmit={handleAddComment} className="flex items-center gap-3">
                  <Input
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 border-none bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    disabled={isCommenting}
                  />
                  {newComment.trim() && (
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      disabled={isCommenting}
                      className="p-0 text-blue-500 hover:bg-transparent font-semibold"
                    >
                      Post
                    </Button>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
