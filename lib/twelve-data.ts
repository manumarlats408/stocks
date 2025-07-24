export interface StockQuote {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  lastUpdate: string
  isMarketOpen: boolean
}

export interface TwelveDataAPI {
  getBatchQuotes: (symbols: string[]) => Promise<StockQuote[]>
  searchSymbol: (query: string) => Promise<Array<{ symbol: string; name: string; exchange: string }>>
}

// Implementación real de la API de Twelve Data
class RealTwelveDataAPI implements TwelveDataAPI {
  private apiKey: string
  private baseUrl = "https://api.twelvedata.com"

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async getBatchQuotes(symbols: string[]): Promise<StockQuote[]> {
    if (symbols.length === 0) return []

    try {
      console.log(`🔄 Fetching real data for ${symbols.length} symbols: ${symbols.join(", ")}`)

      // Twelve Data permite hasta 8 símbolos por request en el plan gratuito
      // Vamos a procesar en lotes de 8 para optimizar el uso de créditos
      const results: StockQuote[] = []
      const batchSize = 8

      for (let i = 0; i < symbols.length; i += batchSize) {
        const batch = symbols.slice(i, i + batchSize)
        const batchResults = await this.fetchBatch(batch)
        results.push(...batchResults)
      }

      console.log(
        `✅ Successfully fetched data for ${results.length} symbols using ${Math.ceil(symbols.length / batchSize)} API calls`,
      )
      return results
    } catch (error) {
      console.error("❌ Error fetching quotes:", error)
      throw error
    }
  }

  private async fetchBatch(symbols: string[]): Promise<StockQuote[]> {
    const symbolsString = symbols.join(",")
    const url = `${this.baseUrl}/quote?symbol=${symbolsString}&apikey=${this.apiKey}`

    console.log(`📡 API Call for batch: ${symbolsString}`)
    console.log(`🔗 URL: ${url}`)

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log("📊 API Response:", data)

    // Si hay un error en la respuesta
    if (data.status === "error") {
      throw new Error(data.message || "API returned an error")
    }

    // Manejar respuesta única vs múltiple
    let quotes: any[]

    if (symbols.length === 1) {
      // Para un solo símbolo, la respuesta es un objeto
      quotes = [data]
    } else {
      // Para múltiples símbolos, la respuesta puede ser un objeto con claves de símbolos
      if (Array.isArray(data)) {
        quotes = data
      } else if (typeof data === "object") {
        // La respuesta es un objeto donde cada clave es un símbolo
        quotes = Object.values(data)
      } else {
        quotes = [data]
      }
    }

    return quotes.map((quote: any) => {
      const price = Number.parseFloat(quote.close || quote.price || "0")
      const change = Number.parseFloat(quote.change || "0")
      const changePercent = Number.parseFloat(quote.percent_change || "0")

      console.log(`💰 ${quote.symbol}: $${price} (${changePercent >= 0 ? "+" : ""}${changePercent}%)`)

      return {
        symbol: quote.symbol,
        name: quote.name || quote.symbol,
        price,
        change,
        changePercent,
        lastUpdate: quote.datetime || new Date().toISOString(),
        isMarketOpen: this.isMarketOpen(),
      }
    })
  }

  async searchSymbol(query: string): Promise<Array<{ symbol: string; name: string; exchange: string }>> {
    try {
      console.log(`🔍 Searching for: ${query}`)

      const url = `${this.baseUrl}/symbol_search?symbol=${encodeURIComponent(query)}&apikey=${this.apiKey}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.status === "error") {
        throw new Error(data.message || "Search API returned an error")
      }

      return (data.data || []).slice(0, 10).map((item: any) => ({
        symbol: item.symbol,
        name: item.instrument_name || item.symbol,
        exchange: item.exchange || "Unknown",
      }))
    } catch (error) {
      console.error("❌ Error searching symbols:", error)
      throw error
    }
  }

  private isMarketOpen(): boolean {
    const now = new Date()
    const hour = now.getHours()
    const day = now.getDay()

    // Aproximación: Lunes a Viernes, 9:30 AM - 4:00 PM EST
    return day >= 1 && day <= 5 && hour >= 9 && hour < 16
  }
}

export function getTwelveDataAPI(): TwelveDataAPI {
  const apiKey = process.env.NEXT_PUBLIC_TWELVE_DATA_API_KEY

  console.log("🔑 API Key check:", apiKey ? `Found (${apiKey.substring(0, 8)}...)` : "Not found")

  if (!apiKey || apiKey === "your_api_key_here" || apiKey.length < 10) {
    throw new Error(
      "API key de Twelve Data no configurada. Configura NEXT_PUBLIC_TWELVE_DATA_API_KEY en tus variables de entorno.",
    )
  }

  console.log("✅ Using REAL Twelve Data API with batch optimization")
  return new RealTwelveDataAPI(apiKey)
}
