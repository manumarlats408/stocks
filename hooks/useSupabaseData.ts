"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase-client"
import type { Database } from "@/lib/supabase"

type Portfolio = Database["public"]["Tables"]["portfolio"]["Row"]
type PriceAlert = Database["public"]["Tables"]["price_alerts"]["Row"]

interface UseSupabaseDataReturn {
  portfolio: Portfolio[]
  alerts: PriceAlert[]
  loading: boolean
  error: string | null
  user: any
  // Portfolio functions
  addStock: (stock: Omit<Portfolio, "id" | "user_id" | "created_at" | "updated_at">) => Promise<void>
  updateStock: (id: string, updates: Partial<Portfolio>) => Promise<void>
  deleteStock: (id: string) => Promise<void>
  // Alert functions
  addAlert: (alert: Omit<PriceAlert, "id" | "user_id" | "created_at" | "updated_at">) => Promise<void>
  updateAlert: (id: string, updates: Partial<PriceAlert>) => Promise<void>
  deleteAlert: (id: string) => Promise<void>
  // Auth functions (only email/password)
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshData: () => Promise<void>
}

export function useSupabaseData(): UseSupabaseDataReturn {
  const [portfolio, setPortfolio] = useState<Portfolio[]>([])
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [isConfigured, setIsConfigured] = useState(false)

  // Check if Supabase is configured
  useEffect(() => {
    try {
      const configured = isSupabaseConfigured()
      setIsConfigured(configured)
      if (!configured) {
        setError("Supabase no está configurado. Revisa las variables de entorno.")
        setLoading(false)
        return
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de configuración")
      setLoading(false)
      return
    }
  }, [])

  const supabase = useMemo(() => {
    if (!isConfigured) return null
    try {
      return getSupabaseClient()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error connecting to Supabase")
      return null
    }
  }, [isConfigured])

  // Cargar datos del usuario
  const loadData = useCallback(async () => {
    if (!supabase) return

    try {
      setLoading(true)
      setError(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (!user) {
        setPortfolio([])
        setAlerts([])
        return
      }

      // Cargar portafolio
      const { data: portfolioData, error: portfolioError } = await supabase
        .from("portfolio")
        .select("*")
        .order("created_at", { ascending: false })

      if (portfolioError) throw portfolioError
      setPortfolio(portfolioData || [])

      // Cargar alertas
      const { data: alertsData, error: alertsError } = await supabase
        .from("price_alerts")
        .select("*")
        .order("created_at", { ascending: false })

      if (alertsError) throw alertsError
      setAlerts(alertsData || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading data")
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Escuchar cambios de autenticación
  useEffect(() => {
    if (!supabase) return

    loadData()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        loadData()
      }
    })

    return () => subscription.unsubscribe()
  }, [loadData, supabase])

  // Funciones del portafolio
  const addStock = async (stock: Omit<Portfolio, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user || !supabase) throw new Error("User not authenticated or Supabase not configured")

    const { data, error } = await supabase
      .from("portfolio")
      .insert([{ ...stock, user_id: user.id }])
      .select()
      .single()

    if (error) throw error
    setPortfolio((prev) => [data, ...prev])
  }

  const updateStock = async (id: string, updates: Partial<Portfolio>) => {
    if (!supabase) throw new Error("Supabase not configured")

    const { data, error } = await supabase
      .from("portfolio")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    setPortfolio((prev) => prev.map((item) => (item.id === id ? data : item)))
  }

  const deleteStock = async (id: string) => {
    if (!supabase) throw new Error("Supabase not configured")

    const { error } = await supabase.from("portfolio").delete().eq("id", id)

    if (error) throw error
    setPortfolio((prev) => prev.filter((item) => item.id !== id))
  }

  // Funciones de alertas
  const addAlert = async (alert: Omit<PriceAlert, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user || !supabase) throw new Error("User not authenticated or Supabase not configured")

    const { data, error } = await supabase
      .from("price_alerts")
      .insert([{ ...alert, user_id: user.id }])
      .select()
      .single()

    if (error) throw error
    setAlerts((prev) => [data, ...prev])
  }

  const updateAlert = async (id: string, updates: Partial<PriceAlert>) => {
    if (!supabase) throw new Error("Supabase not configured")

    const { data, error } = await supabase
      .from("price_alerts")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    setAlerts((prev) => prev.map((item) => (item.id === id ? data : item)))
  }

  const deleteAlert = async (id: string) => {
    if (!supabase) throw new Error("Supabase not configured")

    const { error } = await supabase.from("price_alerts").delete().eq("id", id)

    if (error) throw error
    setAlerts((prev) => prev.filter((item) => item.id !== id))
  }

  // Funciones de autenticación (solo email/password)
  const signInWithEmail = async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase not configured")

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signUpWithEmail = async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase not configured")

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
  }

  const signOut = async () => {
    if (!supabase) throw new Error("Supabase not configured")

    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const refreshData = async () => {
    await loadData()
  }

  return {
    portfolio,
    alerts,
    loading,
    error,
    user,
    addStock,
    updateStock,
    deleteStock,
    addAlert,
    updateAlert,
    deleteAlert,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    refreshData,
  }
}
