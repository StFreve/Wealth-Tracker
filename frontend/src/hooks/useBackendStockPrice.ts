import { useState, useEffect, useCallback, useMemo } from 'react'
import { marketDataApi, StockPrice, isValidStockSymbol } from '../lib/api/marketDataApi'

interface UseStockPriceReturn {
  stockPrice: StockPrice | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  isStale: boolean
  lastUpdated: Date | null
}

export function useBackendStockPrice(symbol: string | null): UseStockPriceReturn {
  const [stockPrice, setStockPrice] = useState<StockPrice | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchStockPrice = useCallback(async (forceRefresh = false) => {
    if (!symbol || !isValidStockSymbol(symbol)) {
      setStockPrice(null)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const price = await marketDataApi.getStockPrice(symbol, forceRefresh)
      setStockPrice(price)
      setLastUpdated(new Date(price.lastUpdated))
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch stock price'
      setError(errorMessage)
      setStockPrice(null)
    } finally {
      setIsLoading(false)
    }
  }, [symbol])

  const refetch = useCallback(async () => {
    await fetchStockPrice(true)
  }, [fetchStockPrice])

  // Initial fetch when symbol changes - FIXED: removed fetchStockPrice from dependencies
  useEffect(() => {
    if (symbol && isValidStockSymbol(symbol)) {
      fetchStockPrice(false)
    } else {
      setStockPrice(null)
      setError(null)
    }
  }, [symbol]) // Only depend on symbol, not fetchStockPrice

  // Check if data is stale (older than 15 minutes)
  const isStale = stockPrice ? (Date.now() - stockPrice.timestamp) > 15 * 60 * 1000 : false

  return {
    stockPrice,
    isLoading,
    error,
    refetch,
    isStale,
    lastUpdated,
  }
}

// Hook for multiple stock prices
interface UseMultipleStockPricesReturn {
  stockPrices: Record<string, StockPrice>
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  lastUpdated: Date | null
}

export function useMultipleStockPrices(symbols: string[]): UseMultipleStockPricesReturn {
  const [stockPrices, setStockPrices] = useState<Record<string, StockPrice>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // FIXED: Memoize validSymbols to prevent recreation on every render
  const validSymbols = useMemo(() => symbols.filter(isValidStockSymbol), [symbols])
  
  // FIXED: Memoize the symbols string to prevent unnecessary re-renders
  const symbolsKey = useMemo(() => validSymbols.join(','), [validSymbols])

  const fetchStockPrices = useCallback(async (forceRefresh = false) => {
    if (validSymbols.length === 0) {
      setStockPrices({})
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await marketDataApi.getMultipleStockPrices(validSymbols, forceRefresh)
      setStockPrices(response.data)
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch stock prices'
      setError(errorMessage)
      setStockPrices({})
    } finally {
      setIsLoading(false)
    }
  }, [validSymbols])

  const refetch = useCallback(async () => {
    await fetchStockPrices(true)
  }, [fetchStockPrices])

  // FIXED: Initial fetch when symbols change - removed fetchStockPrices from dependencies
  useEffect(() => {
    if (validSymbols.length > 0) {
      fetchStockPrices(false)
    } else {
      setStockPrices({})
      setError(null)
    }
  }, [symbolsKey]) // Only depend on the symbols string, not fetchStockPrices

  return {
    stockPrices,
    isLoading,
    error,
    refetch,
    lastUpdated,
  }
} 