"use client"

import { MobileOptimizedHeader } from "@/components/mobile-optimized-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Heart, Code, Palette, Zap } from "lucide-react"
import { useRouter } from "next/navigation"

export default function CreditsPage() {
  const router = useRouter()

  const contributors = [
    {
      name: "Nico",
      handle: "nix0q",
      role: "Lead Developer",
      icon: Code,
      description: "Built the core platform and user experience",
    },
    {
      name: "Izari",
      handle: "izarivfx",
      role: "Visual Designer",
      icon: Palette,
      description: "Created the beautiful UI and visual identity",
    },
    {
      name: "Padero",
      handle: "padero",
      role: "Technical Architect",
      icon: Zap,
      description: "Designed the system architecture and infrastructure",
    },
  ]

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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Credits</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">The team behind Sabagram</p>
            </div>
          </div>

          {/* Welcome Message */}
          <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
            <CardContent className="pt-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Heart className="w-6 h-6 text-red-500 fill-current" />
                <span className="text-xl font-bold text-gray-900 dark:text-white">Made with Love</span>
                <Heart className="w-6 h-6 text-red-500 fill-current" />
              </div>
              <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                Sabagram was created by a passionate team of developers and designers who wanted to bring the underwater
                world to social media!
              </p>
            </CardContent>
          </Card>

          {/* Contributors */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">🌊 Core Team</h2>

            {contributors.map((contributor, index) => (
              <Card key={index} className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-lg text-gray-900 dark:text-white">
                    <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                      <contributor.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="font-bold">{contributor.name}</div>
                      <div className="text-sm text-blue-600 dark:text-blue-400 font-normal">@{contributor.handle}</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full font-medium">
                      {contributor.role}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{contributor.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Special Thanks */}
          <Card className="border-yellow-200 dark:border-yellow-800 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-white">
                <span className="text-2xl">🙏</span>
                Special Thanks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-800 dark:text-gray-200">
                <strong>🐟 Sameko Saba</strong> - The inspiration and mascot of our underwater social network
              </p>
              <p className="text-gray-800 dark:text-gray-200">
                <strong>🌊 The Community</strong> - All the amazing users who make Sabagram a vibrant place
              </p>
              <p className="text-gray-800 dark:text-gray-200">
                <strong>🛠️ Open Source</strong> - Built with love using React, Next.js, Supabase, and Vercel
              </p>
            </CardContent>
          </Card>

          {/* Version Info */}
          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardContent className="pt-6 text-center">
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Sabagram v1.0</strong>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">Built with 💙 for the deep sea community</p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <span className="text-2xl">🐟</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Swim on!</span>
                  <span className="text-2xl">🌊</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
