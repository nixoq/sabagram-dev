"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { createProfile } from "@/lib/actions"
import Image from "next/image"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [fullName, setFullName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    // Basic validation
    if (!fullName.trim() || !username.trim() || !email.trim() || !password) {
      setError("Please fill in all fields")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            username: username.trim(),
            full_name: fullName.trim(),
          },
        },
      })

      if (error) {
        setError(error.message)
        setIsLoading(false)
        return
      }

      if (data.user) {
        try {
          await createProfile(data.user.id, username.trim(), fullName.trim())
        } catch (profileError) {
          console.error("Profile creation error:", profileError)
          // Continue anyway - user is created
        }

        setSuccess("Account created successfully! Redirecting...")
        // Wait a moment then redirect
        setTimeout(() => {
          window.location.href = "/"
        }, 1500)
      }
    } catch (error: any) {
      setError("Sign up failed. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-8">
            <Image
              src="/images/sabagram-logo.png"
              alt="Sabagram"
              width={320}
              height={96}
              className="h-24 w-auto object-contain"
              priority
            />
          </div>
        </div>

        {/* Sign Up Form */}
        <Card className="border border-gray-200 dark:border-gray-800">
          <CardHeader className="text-center pb-4">
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Sign up to see photos and videos from your friends.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSignUp}>
            <CardContent className="space-y-4">
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

              <div className="space-y-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="email"
                  className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="name"
                  className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Input
                  id="username"
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  required
                  disabled={isLoading}
                  autoComplete="username"
                  className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isLoading}
                  autoComplete="new-password"
                  className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                />
              </div>

              <div className="text-xs text-gray-500 text-center">
                People who use our service may have uploaded your contact information to Sabagram.{" "}
                <Link href="#" className="text-blue-500 hover:underline">
                  Learn More
                </Link>
              </div>

              <div className="text-xs text-gray-500 text-center">
                By signing up, you agree to our{" "}
                <Link href="#" className="text-blue-500 hover:underline">
                  Terms
                </Link>
                ,{" "}
                <Link href="#" className="text-blue-500 hover:underline">
                  Data Policy
                </Link>{" "}
                and{" "}
                <Link href="#" className="text-blue-500 hover:underline">
                  Cookies Policy
                </Link>
                .
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Creating account...
                  </>
                ) : (
                  "Sign Up"
                )}
              </Button>
            </CardContent>
          </form>
        </Card>

        {/* Log In Card */}
        <Card className="border border-gray-200 dark:border-gray-800">
          <CardContent className="text-center py-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Have an account?{" "}
              <Link href="/login" className="text-blue-500 hover:underline font-semibold">
                Log in
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
