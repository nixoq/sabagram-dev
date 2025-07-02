"use client"

import { MobileOptimizedHeader } from "@/components/mobile-optimized-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function RulesPage() {
  const router = useRouter()

  const rules = [
    {
      emoji: "🐡",
      title: "Be Kind, Don't Bite!",
      description:
        "This is a chill space for sea creatures of all kinds. No bullying, hate speech, or harassment. Respect other users and their content!",
    },
    {
      emoji: "📸",
      title: "Post Fishy Content Only",
      description:
        "Keep things relevant to Sabagram. Photos, diaries, and updates should be about your daily underwater life (or the sameko lifestyle). No off-topic spam!",
    },
    {
      emoji: "🧂",
      title: "No Salty Drama",
      description:
        "Avoid starting fights in comments or DMs. If there's a problem, report it to the moderation team instead of splashing around in anger.",
    },
    {
      emoji: "🚫",
      title: "No Dangerous or Harmful Content",
      description:
        "Don't post anything violent, harmful, or illegal. That includes self-harm, gore, or anything scary that might make a jellyfish faint.",
    },
    {
      emoji: "🐚",
      title: "Stay Safe & Private",
      description:
        "Don't share real-world personal information like addresses, phone numbers, or passwords. Keep your underwater identity safe!",
    },
    {
      emoji: "🎣",
      title: "No Fishing for Likes",
      description: "No begging for follows, likes, or shares. Grow your account the natural way—like a coral reef!",
    },
    {
      emoji: "🐟",
      title: "One Saba per Account",
      description: "Don't pretend to be another saba. Impersonation, fake accounts, or sockpuppeting is not allowed.",
    },
    {
      emoji: "🛠️",
      title: "Bug Reporting, Not Exploiting",
      description: "If you find a glitch in the app, report it! Don't abuse bugs to gain unfair advantages.",
    },
    {
      emoji: "💬",
      title: "Keep Chat Bubbly & Friendly",
      description:
        "Whether you're posting comments or sending messages, keep the language friendly and fun. No offensive or NSFW content.",
    },
    {
      emoji: "👑",
      title: "Respect the Sameko Queen",
      description:
        "Sameko and her friends worked hard to bring you Sabagram. Be nice, and don't mess with the app's vibes or break the community rules.",
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                🐟 Sameko Saba – Sabagram App Rules 📸
              </h1>
            </div>
          </div>

          {/* Welcome Message */}
          <Card className="border-blue-200 dark:border-gray-800 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
            <CardContent className="pt-6">
              <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                Welcome to Sabagram, the social feed of the deep sea! Before you start snapping selfies or showing off
                your sushi, make sure to follow these simple rules to keep the waters friendly and fresh!
              </p>
            </CardContent>
          </Card>

          {/* Rules */}
          <div className="space-y-4">
            {rules.map((rule, index) => (
              <Card key={index} className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-lg text-gray-900 dark:text-white">
                    <span className="text-2xl">{rule.emoji}</span>
                    <span>
                      {index + 1}. {rule.title}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{rule.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Footer Message */}
          <Card className="border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
            <CardContent className="pt-6 text-center">
              <p className="text-green-800 dark:text-green-200 font-medium">
                🌊 Thanks for keeping Sabagram a fun and safe place for all sea creatures! 🌊
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
