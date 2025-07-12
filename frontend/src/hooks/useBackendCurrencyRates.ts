import { useState, useEffect, useCallback } from 'react'
import { marketDataApi, ExchangeRates, CurrencyRateResponse } from '../lib/api/marketDataApi'

interface UseCurrencyRatesReturn {
  rates: ExchangeRates | null
  isLoading: boolean
  error: string | null
  lastUpdate: Date | null
  source: string | null
  age: number
  refresh: () => Promise<void>
  convertAmount: (amount: number, from: string, to: string) => Promise<number>
  getSupportedCurrencies: () => Promise<string[]>
  isStale: boolean
}

export function useBackendCurrencyRates(autoRefresh: boolean = true): UseCurrencyRatesReturn {
  const [rates, setRates] = useState<ExchangeRates | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [source, setSource] = useState<string | null>(null)
  const [age, setAge] = useState(0)

  const fetchCurrencyRates = useCallback(async (forceRefresh = false) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await marketDataApi.getCurrencyRates(forceRefresh)
      setRates(result.rates)
      setLastUpdate(new Date(result.lastUpdated))
      setSource(result.source)
      setAge(Date.now() - result.timestamp)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch currency rates'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    await fetchCurrencyRates(true)
  }, [fetchCurrencyRates])

  const convertAmount = useCallback(async (amount: number, from: string, to: string): Promise<number> => {
    try {
      const result = await marketDataApi.convertCurrency(amount, from, to)
      return result.convertedAmount
    } catch (err) {
      throw new Error(`Currency conversion failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [])

  const getSupportedCurrencies = useCallback(async (): Promise<string[]> => {
    try {
      const result = await marketDataApi.getSupportedCurrencies()
      return result.currencies
    } catch (err) {
      throw new Error(`Failed to get supported currencies: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [])

  // FIXED: Initial fetch - removed fetchCurrencyRates from dependencies
  useEffect(() => {
    fetchCurrencyRates(false)
  }, []) // Empty dependency array - only run once on mount

  // FIXED: Auto-refresh setup - removed fetchCurrencyRates from dependencies
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchCurrencyRates(false) // Use cached data if available and fresh
    }, 5 * 60 * 1000) // Check every 5 minutes

    return () => clearInterval(interval)
  }, [autoRefresh]) // Only depend on autoRefresh

  // Update age periodically
  useEffect(() => {
    if (!lastUpdate) return

    const interval = setInterval(() => {
      setAge(Date.now() - lastUpdate.getTime())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [lastUpdate])

  // Check if rates are stale (older than 15 minutes)
  const isStale = age > 15 * 60 * 1000

  return {
    rates,
    isLoading,
    error,
    lastUpdate,
    source,
    age,
    refresh,
    convertAmount,
    getSupportedCurrencies,
    isStale,
  }
}

// Hook for currency status
interface UseCurrencyStatusReturn {
  status: {
    cached: boolean
    age: number
    source: string | null
    lastUpdated: Date | null
  } | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useCurrencyStatus(): UseCurrencyStatusReturn {
  const [status, setStatus] = useState<{
    cached: boolean
    age: number
    source: string | null
    lastUpdated: Date | null
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await marketDataApi.getCurrencyStatus()
      setStatus({
        ...result,
        lastUpdated: result.lastUpdated ? new Date(result.lastUpdated) : null,
      })
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch currency status'
      setError(errorMessage)
      setStatus(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    await fetchStatus()
  }, [fetchStatus])

  // FIXED: Initial fetch - removed fetchStatus from dependencies
  useEffect(() => {
    fetchStatus()
  }, []) // Empty dependency array - only run once on mount

  return {
    status,
    isLoading,
    error,
    refresh,
  }
}

// Compatibility exports for existing code
export { useBackendCurrencyRates as useCurrencyRates }

// Helper functions for backward compatibility
export async function fetchExchangeRates(forceRefresh = false): Promise<{
  rates: ExchangeRates
  timestamp: number
  source: string
  lastUpdated: Date
}> {
  const response = await marketDataApi.getCurrencyRates(forceRefresh)
  return {
    ...response,
    lastUpdated: new Date(response.lastUpdated),
  }
}

export async function convertCurrency(amount: number, from: string, to: string): Promise<number> {
  const response = await marketDataApi.convertCurrency(amount, from, to)
  return response.convertedAmount
} 