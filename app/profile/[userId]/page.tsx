"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { InstagramHeader } from "@/components/instagram-header"
import { InstagramPost } from "@/components/instagram-post"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase"
import { Edit, Calendar, MapPin } from "lucide-react"
import Link from "next/link"

interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  location: string | null
  created_at: string
}

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

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const userId = params.userId as string
  const isOwnProfile = currentUser?.id === userId

  useEffect(() => {
    let mounted = true

    const loadProfileData = async () => {
      try {
        // Check current user
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!mounted) return

        if (!session?.user) {
          router.push("/login")
          return
        }

        setCurrentUser(session.user)

        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single()

        if (profileError) {
          setError("Profile not found")
          setLoading(false)
          return
        }

        setProfile(profileData)

        // Fetch user's posts with proper relationships
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
          .eq("user_id", userId)
          .order("created_at", { ascending: false })

        if (!postsError && postsData) {
          // Fetch likes for each post
          const postIds = postsData.map((post) => post.id)

          if (postIds.length > 0) {
            const { data: likesData } = await supabase.from("likes").select("post_id, user_id").in("post_id", postIds)

            const postsWithLikes = postsData.map((post) => ({
              ...post,
              likes: likesData?.filter((like) => like.post_id === post.id) || [],
            }))

            setPosts(postsWithLikes)
          } else {
            setPosts([])
          }
        }

        setLoading(false)
      } catch (error) {
        console.error("Error loading profile:", error)
        if (mounted) {
          setError("Failed to load profile")
          setLoading(false)
        }
      }
    }

    loadProfileData()

    return () => {
      mounted = false
    }
  }, [userId, router])

  const handleLikeUpdate = (postId: string, isLiked: boolean) => {
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

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-blue-50 dark:bg-black">
        <InstagramHeader />
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto border-blue-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Profile Not Found</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {error || "This profile doesn't exist."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-blue-500 hover:bg-blue-600">
                <Link href="/">Go Home</Link>
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

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Profile Header */}
          <Card className="border-blue-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <Avatar className="w-32 h-32 border-4 border-blue-200 dark:border-blue-600">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                    {profile.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 text-center md:text-left space-y-4">
                  <div className="space-y-2">
                    <div className="flex flex-col md:flex-row md:items-center gap-2">
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.username}</h1>
                      {isOwnProfile && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="border-blue-200 dark:border-gray-700 bg-transparent"
                        >
                          <Link href="/settings/profile">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Profile
                          </Link>
                        </Button>
                      )}
                    </div>
                    {profile.full_name && (
                      <p className="text-lg text-gray-600 dark:text-gray-400">{profile.full_name}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Joined {new Date(profile.created_at).toLocaleDateString()}
                    </div>
                    {profile.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {profile.location}
                      </div>
                    )}
                  </div>

                  {profile.bio && <p className="text-sm text-gray-900 dark:text-white">{profile.bio}</p>}

                  <div className="flex justify-center md:justify-start gap-6">
                    <div className="text-center">
                      <div className="font-bold text-lg text-gray-900 dark:text-white">{posts.length}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Posts</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-lg text-gray-900 dark:text-white">
                        {posts.reduce((total, post) => total + post.likes.length, 0)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Likes</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Posts Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Posts</h2>
            {posts.length > 0 ? (
              <div className="max-w-md mx-auto space-y-6">
                {posts.map((post) => (
                  <InstagramPost
                    key={post.id}
                    post={post}
                    currentUserId={currentUser.id}
                    onLikeUpdate={handleLikeUpdate}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-blue-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <CardContent className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {isOwnProfile ? "You haven't posted anything yet." : "No posts yet."}
                  </p>
                  {isOwnProfile && (
                    <Button asChild className="bg-blue-500 hover:bg-blue-600">
                      <Link href="/upload">Create Your First Post</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
