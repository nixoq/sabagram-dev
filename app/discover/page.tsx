"use client"

import { AuthGuard } from "@/components/auth-guard"
import { DiscoverContent } from "@/components/discover-content"

export default function DiscoverPage() {
  return (
    <AuthGuard>
      <DiscoverContent />
    </AuthGuard>
  )
}
