import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase environment variables are not set. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
  )
}

// Client-side Supabase client with proper auth configuration
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: "pkce",
        },
      })
    : createClient("https://placeholder.supabase.co", "placeholder-key")

// Server-side client with service role for admin operations
export function createServerClient() {
  const serverKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

  if (!supabaseUrl || !serverKey) {
    console.warn("Server Supabase environment variables are not set")
  }

  return supabaseUrl && serverKey
    ? createClient(supabaseUrl, serverKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : createClient("https://placeholder.supabase.co", "placeholder-key")
}
