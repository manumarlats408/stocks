"use client"

import { createClient } from "@supabase/supabase-js"
import type { Database } from "./supabase"

// Validate environment variables
function validateSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || supabaseUrl === "your_supabase_url_here") {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured")
  }

  if (!supabaseAnonKey || supabaseAnonKey === "your_supabase_anon_key_here") {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured")
  }

  // Basic URL validation
  try {
    new URL(supabaseUrl)
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not a valid URL")
  }

  return { supabaseUrl, supabaseAnonKey }
}

// Singleton pattern para el cliente
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseClient() {
  if (!supabaseClient) {
    const { supabaseUrl, supabaseAnonKey } = validateSupabaseConfig()
    supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey)
  }
  return supabaseClient
}

export function isSupabaseConfigured(): boolean {
  try {
    validateSupabaseConfig()
    return true
  } catch {
    return false
  }
}
