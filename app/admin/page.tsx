"use client"

import type React from "react"

import { useState, useEffect, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InstagramHeader } from "@/components/instagram-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Shield, Key, Trash2, Users, FileText, Heart, MessageCircle, Ban, UserCheck, ExternalLink } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { verifyAdminKey, adminDeletePost, banUser, unbanUser, getAdminStats } from "@/lib/actions"
import Link from "next/link"

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [posts, setPosts] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState("")
  const [banReason, setBanReason] = useState("")
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user)
    }
    getUser()
  }, [])

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    startTransition(async () => {
      try {
        const result = await verifyAdminKey(adminKey)

        if (result.success) {
          setIsAuthenticated(true)
          await Promise.all([fetchPosts(), fetchUsers(), fetchStats()])
        } else {
          setError(result.message)
        }
      } catch (error) {
        console.error("Admin auth error:", error)
        setError("Authentication failed. Please try again.")
      }
    })
  }

  const fetchStats = async () => {
    try {
      const adminStats = await getAdminStats()
      setStats(adminStats)
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  const fetchPosts = async () => {
    const { data: postsData, error } = await supabase
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
          avatar_url,
          banned
        )
      `)
      .order("created_at", { ascending: false })

    if (!error && postsData) {
      // Fetch likes for each post
      const postIds = postsData.map((post) => post.id)
      const { data: likesData } = await supabase.from("likes").select("post_id, user_id").in("post_id", postIds)

      // Fetch comments count for each post
      const { data: commentsData } = await supabase.from("comments").select("post_id").in("post_id", postIds)

      const postsWithLikes = postsData.map((post) => ({
        ...post,
        likes: likesData?.filter((like) => like.post_id === post.id) || [],
        commentsCount: commentsData?.filter((comment) => comment.post_id === post.id).length || 0,
      }))

      setPosts(postsWithLikes)
    }
  }

  const fetchUsers = async () => {
    const { data: usersData, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && usersData) {
      // Get post counts for each user
      const userIds = usersData.map((user) => user.id)
      const { data: postCounts } = await supabase.from("posts").select("user_id").in("user_id", userIds)

      const usersWithStats = usersData.map((user) => ({
        ...user,
        postCount: postCounts?.filter((post) => post.user_id === user.id).length || 0,
      }))

      setUsers(usersWithStats)
    }
  }

  const handleDeletePost = async (postId: string, imageUrl: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return

    startTransition(async () => {
      try {
        const result = await adminDeletePost(postId, imageUrl)

        if (result.success) {
          setPosts(posts.filter((post) => post.id !== postId))
          await fetchStats() // Refresh stats
        } else {
          alert("Failed to delete post: " + result.error)
        }
      } catch (error) {
        console.error("Failed to delete post:", error)
        alert("Failed to delete post: " + (error instanceof Error ? error.message : "Unknown error"))
      }
    })
  }

  const handleBanUser = async (userId: string, reason: string) => {
    startTransition(async () => {
      try {
        const result = await banUser(userId, reason)

        if (result.success) {
          await fetchUsers()
          await fetchStats()
          setBanReason("")
          setSelectedUser(null)
        } else {
          alert("Failed to ban user: " + result.error)
        }
      } catch (error) {
        console.error("Failed to ban user:", error)
        alert("Failed to ban user: " + (error instanceof Error ? error.message : "Unknown error"))
      }
    })
  }

  const handleUnbanUser = async (userId: string) => {
    startTransition(async () => {
      try {
        const result = await unbanUser(userId)

        if (result.success) {
          await fetchUsers()
          await fetchStats()
        } else {
          alert("Failed to unban user: " + result.error)
        }
      } catch (error) {
        console.error("Failed to unban user:", error)
        alert("Failed to unban user: " + (error instanceof Error ? error.message : "Unknown error"))
      }
    })
  }

  const getPostUrl = (postId: string) => {
    return `${window.location.origin}/post/${postId}`
  }

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-black">
      <InstagramHeader />

      <main className="container mx-auto px-4 py-8">
        {!isAuthenticated ? (
          <Card className="max-w-md mx-auto border-blue-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Shield className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                Sabagram Admin Panel
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Enter admin key to access the control panel
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleAdminAuth}>
              <CardContent className="space-y-4">
                {error && <div className="text-sm text-red-500 p-2 bg-red-50 dark:bg-red-950 rounded">{error}</div>}

                <div className="space-y-2">
                  <Label htmlFor="adminKey" className="text-gray-900 dark:text-white">
                    Admin Key
                  </Label>
                  <Input
                    id="adminKey"
                    type="password"
                    placeholder="Enter admin key"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    required
                    className="border-blue-200 dark:border-gray-700 focus:border-blue-400 dark:focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500">Default key: admin123 (or check environment variables)</p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                  disabled={isPending}
                >
                  <Key className="w-4 h-4 mr-2" />
                  {isPending ? "Authenticating..." : "Access Admin Panel"}
                </Button>
              </CardContent>
            </form>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                <Shield className="w-8 h-8 text-blue-500 dark:text-blue-400" />
                Sabagram Admin Panel
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Complete platform management</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className="border-blue-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <CardContent className="p-4 text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Users</div>
                </CardContent>
              </Card>

              <Card className="border-blue-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <CardContent className="p-4 text-center">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalPosts}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Posts</div>
                </CardContent>
              </Card>

              <Card className="border-blue-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <CardContent className="p-4 text-center">
                  <Heart className="w-8 h-8 mx-auto mb-2 text-red-500" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalLikes}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Likes</div>
                </CardContent>
              </Card>

              <Card className="border-blue-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <CardContent className="p-4 text-center">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalComments}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Comments</div>
                </CardContent>
              </Card>

              <Card className="border-blue-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <CardContent className="p-4 text-center">
                  <Ban className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.bannedUsers}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Banned</div>
                </CardContent>
              </Card>
            </div>

            {/* Admin Tabs */}
            <Tabs defaultValue="posts" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-blue-100 dark:bg-gray-800">
                <TabsTrigger value="posts" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                  <FileText className="w-4 h-4 mr-2" />
                  Posts Management
                </TabsTrigger>
                <TabsTrigger value="users" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                  <Users className="w-4 h-4 mr-2" />
                  User Management
                </TabsTrigger>
              </TabsList>

              {/* Posts Management */}
              <TabsContent value="posts" className="space-y-4">
                <Card className="border-blue-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">All Posts</CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      Manage all posts on the platform
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {posts.length > 0 ? (
                      <div className="space-y-6">
                        {posts.map((post) => (
                          <div key={post.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10">
                                  <AvatarImage src={post.profiles?.avatar_url || undefined} />
                                  <AvatarFallback>
                                    {post.profiles?.username?.charAt(0).toUpperCase() || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                      {post.profiles?.username || "Unknown"}
                                    </p>
                                    {post.profiles?.banned && (
                                      <Badge variant="destructive" className="text-xs">
                                        BANNED
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-500">
                                    {new Date(post.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(getPostUrl(post.id), "_blank")}
                                  className="border-blue-200 dark:border-gray-700"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeletePost(post.id, post.image_url)}
                                  disabled={isPending}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="aspect-square relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                                <img
                                  src={post.image_url || "/placeholder.svg"}
                                  alt="Post"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Caption:</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                                    {post.caption || "No caption"}
                                  </p>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Heart className="w-4 h-4" />
                                    {post.likes.length}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MessageCircle className="w-4 h-4" />
                                    {post.commentsCount}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-400">Post ID: {post.id}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">No posts found</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Users Management */}
              <TabsContent value="users" className="space-y-4">
                <Card className="border-blue-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">All Users</CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      Manage user accounts and moderation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {users.length > 0 ? (
                      <div className="space-y-4">
                        {users.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                          >
                            <div className="flex items-center gap-4">
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={user.avatar_url || undefined} />
                                <AvatarFallback>{user.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-gray-900 dark:text-white">{user.username}</p>
                                  {user.banned && (
                                    <Badge variant="destructive" className="text-xs">
                                      BANNED
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{user.full_name}</p>
                                <p className="text-xs text-gray-500">
                                  {user.postCount} posts • Joined {new Date(user.created_at).toLocaleDateString()}
                                </p>
                                {user.banned && user.ban_reason && (
                                  <p className="text-xs text-red-500 mt-1">Reason: {user.ban_reason}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="border-blue-200 dark:border-gray-700 bg-transparent"
                              >
                                <Link href={`/profile/${user.id}`}>
                                  <ExternalLink className="w-4 h-4" />
                                </Link>
                              </Button>
                              {user.banned ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUnbanUser(user.id)}
                                  disabled={isPending}
                                  className="border-green-200 text-green-600 hover:bg-green-50"
                                >
                                  <UserCheck className="w-4 h-4 mr-1" />
                                  Unban
                                </Button>
                              ) : (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="destructive" size="sm" onClick={() => setSelectedUser(user)}>
                                      <Ban className="w-4 h-4 mr-1" />
                                      Ban
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="bg-white dark:bg-gray-900">
                                    <DialogHeader>
                                      <DialogTitle>Ban User</DialogTitle>
                                      <DialogDescription>
                                        Are you sure you want to ban {selectedUser?.username}? This will prevent them
                                        from posting, commenting, or liking content.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label htmlFor="banReason">Reason (optional)</Label>
                                        <Textarea
                                          id="banReason"
                                          placeholder="Enter reason for ban..."
                                          value={banReason}
                                          onChange={(e) => setBanReason(e.target.value)}
                                        />
                                      </div>
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          variant="outline"
                                          onClick={() => {
                                            setSelectedUser(null)
                                            setBanReason("")
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          variant="destructive"
                                          onClick={() => handleBanUser(selectedUser?.id, banReason)}
                                          disabled={isPending}
                                        >
                                          {isPending ? "Banning..." : "Ban User"}
                                        </Button>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">No users found</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  )
}
