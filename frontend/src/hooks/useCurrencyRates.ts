import { useState, useEffect, useCallback } from 'react'
import { 
  fetchExchangeRates, 
  refreshRates, 
  getRateStatus, 
  subscribeToRateUpdates,
  startAutoRefresh,
  convertCurrency,
  getExchangeRate,
  type RatesFetchResult
} from '../lib/currency'

interface CurrencyRatesHookReturn {
  rates: { [key: string]: number } | null
  isLoading: boolean
  error: string | null
  lastUpdate: Date | null
  source: string | null
  age: number
  refresh: () => Promise<void>
  convertAmount: (amount: number, from: string, to: string) => Promise<number>
  getRate: (from: string, to: string) => Promise<number>
  isStale: boolean
}

export function useCurrencyRates(autoRefresh: boolean = true): CurrencyRatesHookReturn {
  const [rates, setRates] = useState<{ [key: string]: number } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [source, setSource] = useState<string | null>(null)
  const [age, setAge] = useState(0)

  // Initialize rates
  useEffect(() => {
    let mounted = true
    
    const loadInitialRates = async () => {
      if (rates) return // Already loaded
      
      setIsLoading(true)
      setError(null)
      
      try {
        const result = await fetchExchangeRates()
        if (mounted) {
          setRates(result.rates)
          setLastUpdate(result.lastUpdated)
          setSource(result.source)
          setAge(Date.now() - result.timestamp)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load rates')
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }
    
    loadInitialRates()
    
    return () => {
      mounted = false
    }
  }, [])

  // Subscribe to rate updates
  useEffect(() => {
    const unsubscribe = subscribeToRateUpdates((result: RatesFetchResult) => {
      setRates(result.rates)
      setLastUpdate(result.lastUpdated)
      setSource(result.source)
      setAge(Date.now() - result.timestamp)
      setError(null)
    })
    
    return unsubscribe
  }, [])

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return
    
    const stopAutoRefresh = startAutoRefresh(15) // Refresh every 15 minutes
    
    return stopAutoRefresh
  }, [autoRefresh])

  // Update age periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const status = getRateStatus()
      setAge(status.age)
    }, 60000) // Update every minute
    
    return () => clearInterval(interval)
  }, [])

  // Manual refresh function
  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await refreshRates()
      setRates(result.rates)
      setLastUpdate(result.lastUpdated)
      setSource(result.source)
      setAge(Date.now() - result.timestamp)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh rates')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Convert amount helper
  const convertAmount = useCallback(async (amount: number, from: string, to: string) => {
    return await convertCurrency(amount, from, to)
  }, [])

  // Get exchange rate helper
  const getRate = useCallback(async (from: string, to: string) => {
    return await getExchangeRate(from, to)
  }, [])

  // Check if rates are stale (older than 30 minutes)
  const isStale = age > 30 * 60 * 1000

  return {
    rates,
    isLoading,
    error,
    lastUpdate,
    source,
    age,
    refresh,
    convertAmount,
    getRate,
    isStale
  }
}

export default useCurrencyRates 