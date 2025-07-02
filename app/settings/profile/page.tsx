"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { MobileOptimizedHeader } from "@/components/mobile-optimized-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase"
import { updateProfile } from "@/lib/actions"
import { Upload, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

export default function ProfileSettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Form state
  const [username, setUsername] = useState("")
  const [fullName, setFullName] = useState("")
  const [bio, setBio] = useState("")
  const [location, setLocation] = useState("")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const loadProfile = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!mounted) return

        if (!session?.user) {
          router.push("/login")
          return
        }

        setUser(session.user)

        // Fetch current profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single()

        if (!profileError && profileData) {
          setProfile(profileData)
          setUsername(profileData.username || "")
          setFullName(profileData.full_name || "")
          setBio(profileData.bio || "")
          setLocation(profileData.location || "")
          setAvatarPreview(profileData.avatar_url)
        }

        setLoading(false)
      } catch (error) {
        console.error("Error loading profile:", error)
        if (mounted) {
          router.push("/login")
        }
      }
    }

    loadProfile()

    return () => {
      mounted = false
    }
  }, [router])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Avatar file size must be less than 5MB")
        return
      }

      if (!file.type.startsWith("image/")) {
        setError("Please select an image file")
        return
      }

      setError("")
      setAvatarFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = () => setAvatarPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const formData = new FormData()
      formData.append("userId", user.id)
      formData.append("username", username.trim())
      formData.append("fullName", fullName.trim())
      formData.append("bio", bio.trim())
      formData.append("location", location.trim())

      if (avatarFile) {
        formData.append("avatar", avatarFile)
      }

      const result = await updateProfile(formData)

      if (result.success) {
        setSuccess("Profile updated successfully!")
        // Refresh profile data after a short delay
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        setError(result.error || "Failed to update profile")
      }
    } catch (error: any) {
      setError(error.message || "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black">
        <MobileOptimizedHeader />
        <main className="container mx-auto px-4 py-8 max-w-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-blue-600 dark:text-blue-400">Loading...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <MobileOptimizedHeader />

      <main className="container mx-auto px-4 py-6 max-w-md">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Profile</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Update your profile information</p>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Profile Form */}
          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardHeader className="pb-4">
              <CardTitle className="text-gray-900 dark:text-white">Profile Information</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                This information will be displayed on your profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar Upload */}
                <div className="space-y-4">
                  <Label className="text-base font-medium text-gray-900 dark:text-white">Profile Picture</Label>
                  <div className="flex flex-col items-center gap-4">
                    <Avatar className="w-24 h-24 border-4 border-gray-200 dark:border-gray-600">
                      <AvatarImage src={avatarPreview || undefined} />
                      <AvatarFallback className="text-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                        {username.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center space-y-2">
                      <Label htmlFor="avatar" className="cursor-pointer">
                        <div className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 bg-transparent">
                          <Upload className="w-4 h-4" />
                          Change Photo
                        </div>
                        <Input
                          id="avatar"
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                          disabled={saving}
                        />
                      </Label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG up to 5MB</p>
                    </div>
                  </div>
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-base font-medium text-gray-900 dark:text-white">
                    Username *
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    required
                    disabled={saving}
                    className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">This is your unique identifier on Sabagram</p>
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-base font-medium text-gray-900 dark:text-white">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    disabled={saving}
                    className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  />
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-base font-medium text-gray-900 dark:text-white">
                    Bio
                  </Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    maxLength={150}
                    disabled={saving}
                    className="resize-none border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">{bio.length}/150 characters</p>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-base font-medium text-gray-900 dark:text-white">
                    Location
                  </Label>
                  <Input
                    id="location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Where are you based?"
                    disabled={saving}
                    className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 pt-4">
                  <Button type="submit" disabled={saving} className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                    {saving ? (
                      <>
                        <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    asChild
                    className="w-full bg-transparent border-gray-200 dark:border-gray-700"
                  >
                    <Link href="/settings">Cancel</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
