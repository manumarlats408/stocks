"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useStockData } from "@/hooks/useStockData"

interface SymbolSearchProps {
  onSymbolSelect: (symbol: string, name: string) => void
}

export function SymbolSearch({ onSymbolSelect }: SymbolSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Array<{ symbol: string; name: string; exchange: string }>>([])
  const [isSearching, setIsSearching] = useState(false)
  const { searchSymbols } = useStockData([])

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true)
        try {
          const results = await searchSymbols(searchQuery)
          setSearchResults(results.slice(0, 10)) // Limitar a 10 resultados
        } catch (error) {
          console.error("Error searching symbols:", error)
          setSearchResults([])
        } finally {
          setIsSearching(false)
        }
      } else {
        setSearchResults([])
      }
    }, 500)

    return () => clearTimeout(searchTimeout)
  }, [searchQuery, searchSymbols])

  const handleSymbolSelect = (symbol: string, name: string) => {
    onSymbolSelect(symbol, name)
    setSearchQuery("")
    setSearchResults([])
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar símbolo (ej: AAPL, GOOGL, TSLA...)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {searchResults.length > 0 && (
        <div className="border rounded-md bg-white shadow-sm max-h-60 overflow-y-auto">
          {searchResults.map((result) => (
            <div
              key={`${result.symbol}-${result.exchange}`}
              className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
              onClick={() => handleSymbolSelect(result.symbol, result.name)}
            >
              <div className="flex flex-col">
                <span className="font-medium">{result.symbol}</span>
                <span className="text-sm text-gray-500">{result.name}</span>
                <span className="text-xs text-gray-400">{result.exchange}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {isSearching && <p className="text-sm text-gray-500">Buscando símbolos...</p>}
    </div>
  )
}
