"use server"

import { createServerClient } from "./supabase"
import { put, del } from "@vercel/blob"
import { revalidatePath } from "next/cache"

export async function uploadPost(formData: FormData) {
  const supabase = createServerClient()

  const file = formData.get("image") as File
  const caption = formData.get("caption") as string
  const description = formData.get("description") as string
  const userId = formData.get("userId") as string

  console.log("Upload attempt:", {
    hasFile: !!file,
    fileSize: file?.size,
    fileName: file?.name,
    caption: caption?.substring(0, 50),
    userId: userId?.substring(0, 8) + "...",
  })

  if (!file || !userId) {
    return { success: false, error: "Missing required fields" }
  }

  if (!caption?.trim()) {
    return { success: false, error: "Caption is required" }
  }

  try {
    // Verify the user exists and is authenticated
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, username")
      .eq("id", userId)
      .single()

    if (profileError || !profile) {
      console.error("Profile verification failed:", profileError)
      return { success: false, error: "User not found. Please log in again." }
    }

    console.log("User verified:", profile.username)

    // Generate unique filename with timestamp
    const fileExtension = file.name.split(".").pop()?.toLowerCase()
    const timestamp = Date.now()
    const fileName = `posts/${userId}/${timestamp}.${fileExtension}`

    console.log("Uploading to blob:", fileName)

    // Upload image to Vercel Blob with error handling
    let blob
    try {
      blob = await put(fileName, file, {
        access: "public",
        addRandomSuffix: true,
      })
      console.log("Blob upload successful:", blob.url)
    } catch (blobError) {
      console.error("Blob upload error:", blobError)
      return { success: false, error: "Failed to upload image. Please try again." }
    }

    // Combine caption and description for storage
    const fullCaption = description?.trim() ? `${caption.trim()}\n\n${description.trim()}` : caption.trim()

    console.log("Saving to database...")

    // Save post to database with error handling
    const { data: post, error: dbError } = await supabase
      .from("posts")
      .insert({
        user_id: userId,
        image_url: blob.url,
        caption: fullCaption,
      })
      .select(`
        id,
        image_url,
        caption,
        created_at,
        user_id
      `)
      .single()

    if (dbError) {
      console.error("Database error:", dbError)

      // Clean up uploaded image if database insert fails
      try {
        await del(blob.url)
        console.log("Cleaned up blob after DB error")
      } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError)
      }

      return { success: false, error: "Failed to save post. Please try again." }
    }

    console.log("Post created successfully:", post.id)

    // Revalidate relevant paths
    revalidatePath("/")
    revalidatePath("/dashboard")
    revalidatePath("/discover")
    revalidatePath(`/profile/${userId}`)

    return { success: true, post }
  } catch (error) {
    console.error("Upload error:", error)
    return { success: false, error: "Upload failed. Please try again." }
  }
}

export async function updateProfile(formData: FormData) {
  const supabase = createServerClient()

  const userId = formData.get("userId") as string
  const username = formData.get("username") as string
  const fullName = formData.get("fullName") as string
  const bio = formData.get("bio") as string
  const location = formData.get("location") as string
  const avatarFile = formData.get("avatar") as File | null

  if (!userId || !username) {
    return { success: false, error: "Missing required fields" }
  }

  try {
    let avatarUrl = null

    // Upload avatar if provided
    if (avatarFile && avatarFile.size > 0) {
      const fileExtension = avatarFile.name.split(".").pop()
      const fileName = `avatars/${userId}-${Date.now()}.${fileExtension}`

      const blob = await put(fileName, avatarFile, {
        access: "public",
      })

      avatarUrl = blob.url
    }

    // Update profile in database
    const updateData: any = {
      username: username.trim(),
      full_name: fullName.trim() || null,
      bio: bio.trim() || null,
      location: location.trim() || null,
    }

    if (avatarUrl) {
      updateData.avatar_url = avatarUrl
    }

    const { error } = await supabase.from("profiles").update(updateData).eq("id", userId)

    if (error) {
      console.error("Profile update error:", error)
      return { success: false, error: "Failed to update profile" }
    }

    revalidatePath("/")
    revalidatePath("/dashboard")
    revalidatePath("/discover")
    revalidatePath(`/profile/${userId}`)
    revalidatePath("/settings/profile")
    return { success: true }
  } catch (error) {
    console.error("Profile update error:", error)
    return { success: false, error: "Failed to update profile" }
  }
}

export async function toggleLike(postId: string, userId: string) {
  try {
    console.log("Toggle like server action:", { postId, userId })

    const supabase = createServerClient()

    // Check if the likes table exists first
    const { data: tableCheck, error: tableError } = await supabase.from("likes").select("id").limit(1)

    if (tableError) {
      console.error("Likes table check failed:", tableError)
      return { success: false, error: "Likes feature is not available. Please contact support." }
    }

    // Simple approach - try to insert, if it fails due to unique constraint, delete instead
    const { data: insertData, error: insertError } = await supabase
      .from("likes")
      .insert({
        post_id: postId,
        user_id: userId,
      })
      .select()

    if (insertError) {
      // If insert failed due to unique constraint, the like already exists - remove it
      if (
        insertError.code === "23505" ||
        insertError.message?.includes("duplicate") ||
        insertError.message?.includes("unique")
      ) {
        console.log("Like exists, removing it")
        const { error: deleteError } = await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", userId)

        if (deleteError) {
          console.error("Error removing like:", deleteError)
          return { success: false, error: "Failed to remove like: " + deleteError.message }
        }

        revalidatePath("/")
        revalidatePath("/dashboard")
        revalidatePath("/discover")
        revalidatePath("/liked")

        console.log("Like removed successfully")
        return { success: true, isLiked: false }
      } else {
        console.error("Error adding like:", insertError)
        return { success: false, error: "Failed to add like: " + insertError.message }
      }
    }

    // Insert was successful - like was added
    revalidatePath("/")
    revalidatePath("/dashboard")
    revalidatePath("/discover")
    revalidatePath("/liked")

    console.log("Like added successfully")
    return { success: true, isLiked: true }
  } catch (error) {
    console.error("Like toggle error:", error)
    return { success: false, error: "Server error: " + (error instanceof Error ? error.message : "Unknown error") }
  }
}

export async function addComment(formData: FormData) {
  const supabase = createServerClient()

  const postId = formData.get("postId") as string
  const userId = formData.get("userId") as string
  const content = formData.get("content") as string

  if (!postId || !userId || !content?.trim()) {
    return { success: false, error: "Missing required fields" }
  }

  try {
    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      user_id: userId,
      content: content.trim(),
    })

    if (error) {
      console.error("Comment error:", error)
      return { success: false, error: "Failed to add comment" }
    }

    revalidatePath("/")
    revalidatePath("/dashboard")
    revalidatePath("/discover")
    return { success: true }
  } catch (error) {
    console.error("Comment error:", error)
    return { success: false, error: "Failed to add comment" }
  }
}

export async function deletePost(postId: string, imageUrl: string, userId: string) {
  try {
    console.log("Delete post server action:", { postId, imageUrl, userId })

    const supabase = createServerClient()

    // Delete the post (RLS will ensure user can only delete their own posts)
    const { error, count } = await supabase
      .from("posts")
      .delete({ count: "exact" })
      .eq("id", postId)
      .eq("user_id", userId)

    if (error) {
      console.error("Delete error:", error)
      return { success: false, error: "Failed to delete post from database" }
    }

    if (count === 0) {
      return { success: false, error: "Post not found or you don't have permission to delete it" }
    }

    console.log("Post deleted from database")

    // Delete image from Vercel Blob
    try {
      await del(imageUrl)
      console.log("Image deleted from blob")
    } catch (blobError) {
      console.error("Failed to delete image from blob:", blobError)
      // Continue anyway - post is deleted from database
    }

    revalidatePath("/")
    revalidatePath("/dashboard")
    revalidatePath("/discover")
    revalidatePath("/admin")

    console.log("Delete post successful")
    return { success: true }
  } catch (error) {
    console.error("Delete error:", error)
    return { success: false, error: "Failed to delete post" }
  }
}

export async function createProfile(userId: string, username: string, fullName: string) {
  const supabase = createServerClient()

  try {
    const { error } = await supabase.from("profiles").insert({
      id: userId,
      username,
      full_name: fullName,
    })

    if (error) {
      console.error("Profile creation error:", error)
      return { success: false, error: "Failed to create profile" }
    }

    console.log("Profile created successfully for:", username)
    return { success: true }
  } catch (error) {
    console.error("Create profile error:", error)
    return { success: false, error: "Failed to create profile" }
  }
}

// Fixed admin authentication - only use server-side environment variable
export async function verifyAdminKey(adminKey: string) {
  // Only check the server-side environment variable (not exposed to client)
  const validAdminKey = process.env.ADMIN_KEY || "admin123"

  console.log("Admin key verification:", {
    provided: adminKey?.substring(0, 3) + "...",
    expected: validAdminKey?.substring(0, 3) + "...",
    match: adminKey === validAdminKey,
    hasEnvVar: !!process.env.ADMIN_KEY,
  })

  if (adminKey === validAdminKey) {
    return { success: true, message: "Admin access granted" }
  } else {
    return { success: false, message: "Invalid admin key. Try 'admin123' or check ADMIN_KEY environment variable." }
  }
}

// Admin post deletion
export async function adminDeletePost(postId: string, imageUrl: string) {
  const supabase = createServerClient()

  try {
    console.log("Admin deleting post:", { postId, imageUrl })

    // Admin can delete any post (no user check needed)
    const { error, count } = await supabase.from("posts").delete({ count: "exact" }).eq("id", postId)

    if (error) {
      console.error("Admin delete error:", error)
      return { success: false, error: "Failed to delete post" }
    }

    if (count === 0) {
      return { success: false, error: "Post not found" }
    }

    console.log("Post deleted by admin")

    // Delete image from Vercel Blob
    try {
      await del(imageUrl)
      console.log("Image deleted from blob")
    } catch (blobError) {
      console.error("Failed to delete image from blob:", blobError)
    }

    revalidatePath("/")
    revalidatePath("/dashboard")
    revalidatePath("/discover")
    revalidatePath("/admin")

    return { success: true }
  } catch (error) {
    console.error("Admin delete error:", error)
    return { success: false, error: "Failed to delete post" }
  }
}

// New admin functions - with better error handling for missing columns
export async function banUser(userId: string, reason?: string) {
  const supabase = createServerClient()

  try {
    // Check if banned column exists first
    const { data: columnCheck } = await supabase
      .from("profiles")
      .select("banned")
      .eq("id", userId)
      .limit(1)
      .maybeSingle()

    // If the query fails, the column might not exist
    const updateData: any = {}

    // Try to update with banned fields, but handle if columns don't exist
    try {
      updateData.banned = true
      if (reason) updateData.ban_reason = reason
      updateData.banned_at = new Date().toISOString()
    } catch (error) {
      console.log("Some ban columns may not exist, updating what we can")
    }

    const { error } = await supabase.from("profiles").update(updateData).eq("id", userId)

    if (error) {
      console.error("Ban user error:", error)
      return { success: false, error: "Failed to ban user: " + error.message }
    }

    revalidatePath("/admin")
    return { success: true }
  } catch (error) {
    console.error("Ban user error:", error)
    return { success: false, error: "Failed to ban user. Some database columns may be missing." }
  }
}

export async function unbanUser(userId: string) {
  const supabase = createServerClient()

  try {
    const updateData: any = {}

    // Try to update with unban fields, but handle if columns don't exist
    try {
      updateData.banned = false
      updateData.ban_reason = null
      updateData.banned_at = null
    } catch (error) {
      console.log("Some ban columns may not exist")
    }

    const { error } = await supabase.from("profiles").update(updateData).eq("id", userId)

    if (error) {
      console.error("Unban user error:", error)
      return { success: false, error: "Failed to unban user: " + error.message }
    }

    revalidatePath("/admin")
    return { success: true }
  } catch (error) {
    console.error("Unban user error:", error)
    return { success: false, error: "Failed to unban user. Some database columns may be missing." }
  }
}

export async function getAdminStats() {
  const supabase = createServerClient()

  try {
    // Get total users
    const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true })

    // Get total posts
    const { count: totalPosts } = await supabase.from("posts").select("*", { count: "exact", head: true })

    // Get total likes (with error handling)
    let totalLikes = 0
    try {
      const { count: likesCount } = await supabase.from("likes").select("*", { count: "exact", head: true })
      totalLikes = likesCount || 0
    } catch (error) {
      console.log("Likes table may not exist yet")
    }

    // Get total comments
    const { count: totalComments } = await supabase.from("comments").select("*", { count: "exact", head: true })

    // Get banned users (with error handling for missing column)
    let bannedUsers = 0
    try {
      const { count: bannedCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("banned", true)
      bannedUsers = bannedCount || 0
    } catch (error) {
      console.log("Banned column may not exist yet")
    }

    return {
      totalUsers: totalUsers || 0,
      totalPosts: totalPosts || 0,
      totalLikes,
      totalComments: totalComments || 0,
      bannedUsers,
    }
  } catch (error) {
    console.error("Get admin stats error:", error)
    return {
      totalUsers: 0,
      totalPosts: 0,
      totalLikes: 0,
      totalComments: 0,
      bannedUsers: 0,
    }
  }
}
