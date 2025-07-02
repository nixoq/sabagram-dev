"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InstagramHeader } from "@/components/instagram-header"
import { Upload, ImageIcon, X, AlertCircle, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { uploadPost } from "@/lib/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function UploadForm() {
  const [user, setUser] = useState<any>(null)
  const [file, setFile] = useState<File | null>(null)
  const [caption, setCaption] = useState("")
  const [description, setDescription] = useState("")
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Session error:", error)
          router.push("/login")
          return
        }

        if (!session?.user) {
          router.push("/login")
          return
        }

        setUser(session.user)
      } catch (error) {
        console.error("Auth error:", error)
        router.push("/login")
      }
    }

    getUser()
  }, [router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    setError("")
    setSuccess("")

    if (selectedFile) {
      // Check file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB")
        return
      }

      // Check file type
      if (!selectedFile.type.startsWith("image/")) {
        setError("Please select an image file (PNG, JPG, GIF, WebP)")
        return
      }

      setFile(selectedFile)

      // Create preview
      const reader = new FileReader()
      reader.onload = () => setPreview(reader.result as string)
      reader.onerror = () => setError("Failed to read file")
      reader.readAsDataURL(selectedFile)
    }
  }

  const handleRemoveImage = () => {
    setFile(null)
    setPreview(null)
    setError("")
    setSuccess("")
    // Reset file input
    const fileInput = document.getElementById("image") as HTMLInputElement
    if (fileInput) {
      fileInput.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file || !user) {
      setError("Please select an image to upload")
      return
    }

    if (!caption.trim()) {
      setError("Please add a caption for your post")
      return
    }

    setIsUploading(true)
    setError("")
    setSuccess("")

    try {
      // Double-check user session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session?.user) {
        throw new Error("Please log in again to upload")
      }

      console.log("Starting upload for user:", session.user.id)

      const formData = new FormData()
      formData.append("image", file)
      formData.append("caption", caption.trim())
      if (description.trim()) {
        formData.append("description", description.trim())
      }
      formData.append("userId", session.user.id)

      console.log("Calling uploadPost action...")
      const result = await uploadPost(formData)

      if (result.success) {
        setSuccess("Post uploaded successfully! Redirecting...")
        console.log("Upload successful, post created:", result.post?.id)

        // Clear form
        setFile(null)
        setPreview(null)
        setCaption("")
        setDescription("")

        // Redirect after a short delay
        setTimeout(() => {
          router.push("/")
        }, 2000)
      }
    } catch (error: any) {
      console.error("Upload failed:", error)
      setError(error.message || "Upload failed. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      const fakeEvent = {
        target: { files: [droppedFile] },
      } as React.ChangeEvent<HTMLInputElement>
      handleFileChange(fakeEvent)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  if (!user) {
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
        <Card className="max-w-md mx-auto border-blue-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Upload className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              Create new post
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Share a photo with your followers
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Success Alert */}
              {success && (
                <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {/* Image Upload Section */}
              <div className="space-y-4">
                <Label htmlFor="image" className="text-base font-medium text-gray-900 dark:text-white">
                  Select photo
                </Label>

                {!preview ? (
                  <div
                    className="border-2 border-dashed border-blue-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-400 dark:hover:border-gray-500 transition-colors cursor-pointer bg-blue-25 dark:bg-gray-800 relative"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    <ImageIcon className="w-12 h-12 mx-auto text-blue-400 dark:text-blue-300 mb-4" />
                    <div className="space-y-2">
                      <p className="text-sm text-blue-600 dark:text-blue-400">Drag photos here</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-blue-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-800 bg-transparent"
                        onClick={() => document.getElementById("image")?.click()}
                      >
                        Select from computer
                      </Button>
                    </div>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={isUploading}
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <div className="aspect-square relative border rounded-lg overflow-hidden bg-blue-50 dark:bg-gray-800 border-blue-200 dark:border-gray-700">
                      <img src={preview || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={handleRemoveImage}
                        disabled={isUploading}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-blue-500 dark:text-blue-400 mt-2 text-center">
                      {file?.name} ({Math.round((file?.size || 0) / 1024)}KB)
                    </p>
                  </div>
                )}
              </div>

              {/* Caption Section */}
              <div className="space-y-2">
                <Label htmlFor="caption" className="text-base font-medium text-gray-900 dark:text-white">
                  Write a caption *
                </Label>
                <Textarea
                  id="caption"
                  placeholder="Write a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                  maxLength={2200}
                  disabled={isUploading}
                  required
                  className="resize-none border-blue-200 dark:border-gray-700 focus:border-blue-400 dark:focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-blue-500 dark:text-blue-400">{caption.length}/2,200</p>
              </div>

              {/* Description Section */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-base font-medium text-gray-900 dark:text-white">
                  Add a description (optional)
                </Label>
                <Textarea
                  id="description"
                  placeholder="Tell more about your photo..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  maxLength={1000}
                  disabled={isUploading}
                  className="resize-none border-blue-200 dark:border-gray-700 focus:border-blue-400 dark:focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-blue-500 dark:text-blue-400">{description.length}/1,000</p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                disabled={!file || !caption.trim() || isUploading}
                size="lg"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Sharing...
                  </>
                ) : (
                  "Share"
                )}
              </Button>
            </CardContent>
          </form>
        </Card>
      </main>
    </div>
  )
}
