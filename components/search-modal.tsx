"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, User, Hash } from "lucide-react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

interface SearchResult {
  type: "user" | "post"
  id: string
  username?: string
  full_name?: string
  avatar_url?: string
  caption?: string
  image_url?: string
}

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const searchTimeout = setTimeout(async () => {
      setLoading(true)
      try {
        const searchResults: SearchResult[] = []

        // Search users by username
        const { data: users } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .ilike("username", `%${query}%`)
          .limit(5)

        if (users) {
          users.forEach((user) => {
            searchResults.push({
              type: "user",
              id: user.id,
              username: user.username,
              full_name: user.full_name,
              avatar_url: user.avatar_url,
            })
          })
        }

        // Search posts by caption (keywords and hashtags)
        const { data: posts } = await supabase
          .from("posts")
          .select(`
            id,
            caption,
            image_url,
            profiles!posts_user_id_fkey (
              username,
              avatar_url
            )
          `)
          .ilike("caption", `%${query}%`)
          .limit(5)

        if (posts) {
          posts.forEach((post) => {
            searchResults.push({
              type: "post",
              id: post.id,
              caption: post.caption,
              image_url: post.image_url,
              username: post.profiles?.username,
            })
          })
        }

        setResults(searchResults)
      } catch (error) {
        console.error("Search error:", error)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [query])

  const handleResultClick = () => {
    setQuery("")
    setResults([])
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white dark:bg-gray-900 border-blue-200 dark:border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">Search</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-4 h-4" />
            <Input
              placeholder="Search users, posts, or hashtags..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 border-blue-200 dark:border-gray-700 focus:border-blue-400 dark:focus:border-blue-500"
              autoFocus
            />
          </div>

          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {results.map((result) => (
                <div key={`${result.type}-${result.id}`}>
                  {result.type === "user" ? (
                    <Link
                      href={`/profile/${result.id}`}
                      onClick={handleResultClick}
                      className="flex items-center gap-3 p-3 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <Avatar className="w-10 h-10 border-2 border-blue-200 dark:border-blue-600">
                        <AvatarImage src={result.avatar_url || undefined} />
                        <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                          {result.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white">{result.username}</p>
                        {result.full_name && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{result.full_name}</p>
                        )}
                      </div>
                      <User className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 p-3 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-blue-100 dark:bg-blue-900">
                        <img
                          src={result.image_url || "/placeholder.svg"}
                          alt="Post"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-white line-clamp-2">
                          {result.caption?.substring(0, 60)}...
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">by {result.username}</p>
                      </div>
                      <Hash className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {query.trim() && !loading && results.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No results found for "{query}"</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
