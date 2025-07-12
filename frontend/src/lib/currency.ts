// Currency conversion utilities
interface ExchangeRates {
  [key: string]: number
}

interface CurrencyInfo {
  code: string
  name: string
  symbol: string
}

export interface RatesFetchResult {
  rates: ExchangeRates
  timestamp: number
  source: string
  lastUpdated: Date
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'AMD', name: 'Armenian Dram', symbol: '֏' },
  { code: 'GEL', name: 'Georgian Lari', symbol: '₾' }
]

// Cache for exchange rates
let exchangeRatesCache: RatesFetchResult | null = null
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes for more frequent updates
const FALLBACK_CACHE_DURATION = 60 * 60 * 1000 // 1 hour for fallback rates

// Fallback exchange rates (approximate values for demo)
const FALLBACK_RATES: ExchangeRates = {
  USD: 1.0,
  EUR: 0.85,
  GBP: 0.73,
  JPY: 110.0,
  CAD: 1.25,
  AUD: 1.35,
  CHF: 0.92,
  CNY: 6.4,
  RUB: 75.0,
  INR: 74.0,
  AMD: 390.0,
  GEL: 2.65
}

// Loading state management
let isUpdatingRates = false
const rateUpdateListeners: Array<(result: RatesFetchResult) => void> = []

/**
 * Multiple API sources for redundancy
 */
const API_SOURCES = [
  {
    name: 'exchangerate-api',
    url: 'https://api.exchangerate-api.com/v4/latest/USD',
    parseResponse: (data: any) => data.rates
  },
  {
    name: 'fixer',
    url: 'https://api.fixer.io/latest?base=USD',
    parseResponse: (data: any) => data.rates
  },
  {
    name: 'currencyapi',
    url: 'https://api.currencyapi.com/v3/latest?apikey=YOUR_API_KEY&base_currency=USD',
    parseResponse: (data: any) => {
      const rates: ExchangeRates = {}
      Object.entries(data.data).forEach(([key, value]: [string, any]) => {
        rates[key] = value.value
      })
      return rates
    }
  }
]

/**
 * Fetches exchange rates from multiple sources with fallback
 */
export async function fetchExchangeRates(forceRefresh: boolean = false): Promise<RatesFetchResult> {
  // Check if we have cached rates that are still valid
  if (!forceRefresh && exchangeRatesCache && 
      Date.now() - exchangeRatesCache.timestamp < CACHE_DURATION) {
    return exchangeRatesCache
  }

  // Prevent multiple simultaneous updates
  if (isUpdatingRates && !forceRefresh) {
    return exchangeRatesCache || {
      rates: FALLBACK_RATES,
      timestamp: Date.now(),
      source: 'fallback',
      lastUpdated: new Date()
    }
  }

  isUpdatingRates = true

  try {
    // Try each API source until one succeeds
    for (const apiSource of API_SOURCES) {
      try {
        console.log(`Fetching rates from ${apiSource.name}...`)
        
        const response = await fetch(apiSource.url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        const rates = apiSource.parseResponse(data)
        
        if (rates && typeof rates === 'object') {
          // Ensure USD is always 1.0 as base currency
          const normalizedRates = {
            USD: 1.0,
            ...rates
          }
          
          // Validate that we have most of our supported currencies
          const supportedCurrencies = CURRENCIES.map(c => c.code)
          const availableCurrencies = Object.keys(normalizedRates)
          const missingCurrencies = supportedCurrencies.filter(c => !availableCurrencies.includes(c))
          
          // Add fallback rates for missing currencies
          missingCurrencies.forEach(currency => {
            if (FALLBACK_RATES[currency]) {
              normalizedRates[currency] = FALLBACK_RATES[currency]
              console.warn(`Using fallback rate for ${currency}`)
            }
          })
          
          const result: RatesFetchResult = {
            rates: normalizedRates,
            timestamp: Date.now(),
            source: apiSource.name,
            lastUpdated: new Date()
          }
          
          exchangeRatesCache = result
          
          // Notify listeners
          rateUpdateListeners.forEach(listener => listener(result))
          
          console.log(`Successfully fetched rates from ${apiSource.name}`)
          return result
        }
        
        throw new Error('Invalid response format')
      } catch (error) {
        console.warn(`Failed to fetch from ${apiSource.name}:`, error)
        continue
      }
    }
    
    throw new Error('All API sources failed')
  } catch (error) {
    console.error('Failed to fetch exchange rates from all sources:', error)
    
    // Use cached rates if available, even if expired
    if (exchangeRatesCache && Date.now() - exchangeRatesCache.timestamp < FALLBACK_CACHE_DURATION) {
      console.log('Using expired cached rates')
      return exchangeRatesCache
    }
    
    // Fall back to static rates
    const fallbackResult: RatesFetchResult = {
      rates: FALLBACK_RATES,
      timestamp: Date.now(),
      source: 'fallback',
      lastUpdated: new Date()
    }
    
    exchangeRatesCache = fallbackResult
    return fallbackResult
  } finally {
    isUpdatingRates = false
  }
}

/**
 * Subscribe to rate updates
 */
export function subscribeToRateUpdates(callback: (result: RatesFetchResult) => void): () => void {
  rateUpdateListeners.push(callback)
  
  // Return unsubscribe function
  return () => {
    const index = rateUpdateListeners.indexOf(callback)
    if (index > -1) {
      rateUpdateListeners.splice(index, 1)
    }
  }
}

/**
 * Get current rate status
 */
export function getRateStatus(): {
  isUpdating: boolean
  lastUpdate: Date | null
  source: string | null
  age: number
} {
  return {
    isUpdating: isUpdatingRates,
    lastUpdate: exchangeRatesCache?.lastUpdated || null,
    source: exchangeRatesCache?.source || null,
    age: exchangeRatesCache ? Date.now() - exchangeRatesCache.timestamp : 0
  }
}

/**
 * Force refresh rates
 */
export async function refreshRates(): Promise<RatesFetchResult> {
  return await fetchExchangeRates(true)
}

/**
 * Converts an amount from one currency to another
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return amount
  }

  const rateResult = await fetchExchangeRates()
  const rates = rateResult.rates
  
  // Check if both currencies are available
  if (!rates[fromCurrency] || !rates[toCurrency]) {
    console.warn(`Missing rate for ${fromCurrency} or ${toCurrency}`)
    return amount // Return original amount if conversion not possible
  }
  
  // Convert to USD first (base currency)
  const amountInUSD = amount / rates[fromCurrency]
  
  // Convert from USD to target currency
  const convertedAmount = amountInUSD * rates[toCurrency]
  
  return convertedAmount
}

/**
 * Converts multiple amounts to USD
 */
export async function convertToUSD(
  amounts: Array<{ amount: number; currency: string }>
): Promise<number[]> {
  const rateResult = await fetchExchangeRates()
  const rates = rateResult.rates
  
  return amounts.map(({ amount, currency }) => {
    if (currency === 'USD') {
      return amount
    }
    if (!rates[currency]) {
      console.warn(`Missing rate for ${currency}`)
      return amount
    }
    return amount / rates[currency]
  })
}

/**
 * Get exchange rate between two currencies
 */
export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return 1.0
  }

  const rateResult = await fetchExchangeRates()
  const rates = rateResult.rates
  
  if (!rates[fromCurrency] || !rates[toCurrency]) {
    console.warn(`Missing rate for ${fromCurrency} or ${toCurrency}`)
    return 1.0
  }
  
  // Convert via USD
  return rates[toCurrency] / rates[fromCurrency]
}

/**
 * Formats currency with proper symbol and locale
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Gets currency symbol
 */
export function getCurrencySymbol(currency: string): string {
  const currencyInfo = CURRENCIES.find(c => c.code === currency)
  return currencyInfo?.symbol || currency
}

/**
 * Formats amount with currency symbol
 */
export function formatWithSymbol(amount: number, currency: string): string {
  const symbol = getCurrencySymbol(currency)
  return `${symbol}${amount.toFixed(2)}`
}

/**
 * Hook for managing currency preferences
 */
export function useCurrencyPreference() {
  const getPreferredCurrency = (): string => {
    return localStorage.getItem('preferredCurrency') || 'USD'
  }

  const setPreferredCurrency = (currency: string): void => {
    localStorage.setItem('preferredCurrency', currency)
  }

  return {
    preferredCurrency: getPreferredCurrency(),
    setPreferredCurrency
  }
}

/**
 * Asset value conversion utility
 */
export async function convertAssetValue(
  asset: any,
  targetCurrency: string = 'USD'
): Promise<number> {
  if (!asset.value || !asset.currency) {
    return 0
  }

  return await convertCurrency(asset.value, asset.currency, targetCurrency)
}

/**
 * Batch convert multiple assets to target currency
 */
export async function convertAssetValues(
  assets: any[],
  targetCurrency: string = 'USD'
): Promise<any[]> {
  const rateResult = await fetchExchangeRates()
  const rates = rateResult.rates
  
  return assets.map(asset => {
    if (!asset.value || !asset.currency) {
      return { ...asset, convertedValue: 0 }
    }

    let convertedValue = asset.value
    if (asset.currency !== targetCurrency) {
      // Convert to USD first, then to target currency
      if (rates[asset.currency] && rates[targetCurrency]) {
        const valueInUSD = asset.value / rates[asset.currency]
        convertedValue = valueInUSD * rates[targetCurrency]
      }
    }

    return {
      ...asset,
      convertedValue,
      originalValue: asset.value,
      originalCurrency: asset.currency
    }
  })
}

/**
 * Auto-refresh rates at regular intervals
 */
export function startAutoRefresh(intervalMinutes: number = 30): () => void {
  const interval = setInterval(() => {
    fetchExchangeRates(true)
  }, intervalMinutes * 60 * 1000)
  
  return () => clearInterval(interval)
}

/**
 * Get rate change percentage (requires historical data)
 */
export function calculateRateChange(
  currentRate: number,
  previousRate: number
): { change: number; percentage: number; direction: 'up' | 'down' | 'neutral' } {
  const change = currentRate - previousRate
  const percentage = previousRate !== 0 ? (change / previousRate) * 100 : 0
  
  return {
    change,
    percentage,
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
  }
} 