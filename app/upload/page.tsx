"use client"
import { AuthGuard } from "@/components/auth-guard"
import { UploadForm } from "@/components/upload-form"

export default function UploadPage() {
  return (
    <AuthGuard>
      <UploadForm />
    </AuthGuard>
  )
}
