import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      portfolio: {
        Row: {
          id: string
          user_id: string
          symbol: string
          name: string
          shares: number
          purchase_price: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          symbol: string
          name: string
          shares: number
          purchase_price: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          symbol?: string
          name?: string
          shares?: number
          purchase_price?: number
          created_at?: string
          updated_at?: string
        }
      }
      price_alerts: {
        Row: {
          id: string
          user_id: string
          symbol: string
          alert_type: "above" | "below"
          target_price: number
          triggered: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          symbol: string
          alert_type: "above" | "below"
          target_price: number
          triggered?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          symbol?: string
          alert_type?: "above" | "below"
          target_price?: number
          triggered?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
