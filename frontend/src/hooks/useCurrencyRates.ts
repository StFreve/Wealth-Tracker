import { useState, useEffect, useCallback } from 'react'
import { 
  fetchExchangeRates, 
  convertCurrency,
  type CurrencyRateResponse
} from '../lib/api/marketDataApi'

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
          setAge(Date.now() - result.lastUpdated.getTime())
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

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(async () => {
      try {
        const result = await fetchExchangeRates(true) // Force refresh
        setRates(result.rates)
        setLastUpdate(result.lastUpdated)
        setSource(result.source)
        setAge(Date.now() - result.lastUpdated.getTime())
        setError(null)
      } catch (err) {
        // Don't set error on auto-refresh failure, keep existing data
        console.warn('Auto-refresh failed:', err)
      }
    }, 15 * 60 * 1000) // Refresh every 15 minutes
    
    return () => clearInterval(interval)
  }, [autoRefresh])

  // Update age periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastUpdate) {
        setAge(Date.now() - lastUpdate.getTime())
      }
    }, 60000) // Update every minute
    
    return () => clearInterval(interval)
  }, [lastUpdate])

  // Manual refresh function
  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await fetchExchangeRates(true) // Force refresh
      setRates(result.rates)
      setLastUpdate(result.lastUpdated)
      setSource(result.source)
      setAge(Date.now() - result.lastUpdated.getTime())
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
    if (!rates) {
      throw new Error('Rates not loaded')
    }
    
    if (from === to) {
      return 1
    }
    
    // All rates are relative to USD
    if (from === 'USD' && rates[to]) {
      return rates[to]
    }
    
    if (to === 'USD' && rates[from]) {
      return 1 / rates[from]
    }
    
    // For cross-currency conversion: USD -> from -> to
    if (rates[from] && rates[to]) {
      return rates[to] / rates[from]
    }
    
    throw new Error(`Cannot convert from ${from} to ${to}`)
  }, [rates])

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