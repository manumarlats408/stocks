"use client"

import { useState, useCallback, useRef } from "react"
import { getTwelveDataAPI, type StockQuote } from "@/lib/twelve-data"

interface UseStockDataReturn {
  quotes: Record<string, StockQuote>
  loading: boolean
  error: string | null
  refreshQuotes: () => Promise<void>
  searchSymbols: (query: string) => Promise<Array<{ symbol: string; name: string; exchange: string }>>
  isApiConfigured: boolean
  lastUpdateTime: string | null
  apiCallsUsed: number
}

export function useStockData(symbols: string[]): UseStockDataReturn {
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isApiConfigured, setIsApiConfigured] = useState(true)
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null)
  const [apiCallsUsed, setApiCallsUsed] = useState(0)

  // Usar useRef para evitar llamadas duplicadas
  const isLoadingRef = useRef(false)

  const fetchQuotes = useCallback(async () => {
    if (symbols.length === 0) return
    if (isLoadingRef.current) {
      console.log("⏳ Already loading, skipping duplicate call")
      return
    }

    isLoadingRef.current = true
    setLoading(true)
    setError(null)

    try {
      console.log(`🚀 Starting batch fetch for ${symbols.length} symbols`)
      const startTime = Date.now()

      const api = getTwelveDataAPI()

      // Calcular cuántas llamadas API necesitaremos
      const batchSize = 8
      const expectedCalls = Math.ceil(symbols.length / batchSize)
      console.log(`📊 Expected API calls: ${expectedCalls} (${symbols.length} symbols in batches of ${batchSize})`)

      const quotesData = await api.getBatchQuotes(symbols)
      const quotesMap: Record<string, StockQuote> = {}

      quotesData.forEach((quote) => {
        quotesMap[quote.symbol] = quote
      })

      setQuotes(quotesMap)
      setIsApiConfigured(true)
      setLastUpdateTime(new Date().toLocaleTimeString("es-ES"))
      setApiCallsUsed((prev) => prev + expectedCalls)

      const endTime = Date.now()
      console.log(`✅ Batch fetch completed in ${endTime - startTime}ms`)
      console.log(`📈 Total API calls used in this session: ${apiCallsUsed + expectedCalls}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error fetching stock data"
      setError(errorMessage)

      if (errorMessage.includes("API key")) {
        setIsApiConfigured(false)
      }
    } finally {
      setLoading(false)
      isLoadingRef.current = false
    }
  }, [symbols, apiCallsUsed])

  const refreshQuotes = useCallback(async () => {
    console.log("🔄 Manual refresh triggered")
    await fetchQuotes()
  }, [fetchQuotes])

  const searchSymbols = useCallback(async (query: string) => {
    try {
      const api = getTwelveDataAPI()
      setApiCallsUsed((prev) => prev + 1) // Search también cuenta como 1 llamada
      return await api.searchSymbol(query)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error searching symbols"
      setError(errorMessage)

      if (errorMessage.includes("API key")) {
        setIsApiConfigured(false)
      }

      return []
    }
  }, [])

  return {
    quotes,
    loading,
    error,
    refreshQuotes,
    searchSymbols,
    isApiConfigured,
    lastUpdateTime,
    apiCallsUsed,
  }
}
