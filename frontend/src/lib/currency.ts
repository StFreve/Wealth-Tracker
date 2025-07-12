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
  { code: 'GEL', name: 'Georgian Lari', symbol: '₾' },
  { code: 'XAU', name: 'Gold (Troy Ounce)', symbol: 'Au' },
  { code: 'XAG', name: 'Silver (Troy Ounce)', symbol: 'Ag' },
  { code: 'XPT', name: 'Platinum (Troy Ounce)', symbol: 'Pt' },
  { code: 'XPD', name: 'Palladium (Troy Ounce)', symbol: 'Pd' }
]

// Cache for exchange rates
let exchangeRatesCache: RatesFetchResult | null = null
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes for more frequent updates
const FALLBACK_CACHE_DURATION = 60 * 60 * 1000 // 1 hour for fallback rates

// Development mode check
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

// Fallback exchange rates (approximate values for demo - updated December 2024)
const FALLBACK_RATES: ExchangeRates = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.0,
  CAD: 1.36,
  AUD: 1.53,
  CHF: 0.88,
  CNY: 7.15,
  RUB: 95.0,
  INR: 83.0,
  AMD: 385.0,
  GEL: 2.70,
  XAU: 0.0005,   // Gold: ~$2,000 per troy ounce
  XAG: 0.04,     // Silver: ~$25 per troy ounce
  XPT: 0.001,    // Platinum: ~$1,000 per troy ounce
  XPD: 0.00083   // Palladium: ~$1,200 per troy ounce
}

// Loading state management
let isUpdatingRates = false
const rateUpdateListeners: Array<(result: RatesFetchResult) => void> = []

/**
 * Multiple API sources for redundancy - using CORS-enabled APIs
 */
const API_SOURCES = [
  {
    name: 'exchangerate-host',
    url: 'https://api.exchangerate.host/latest?base=USD',
    parseResponse: (data: any) => data.rates
  },
  {
    name: 'fawazahmed0',
    url: 'https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/usd.json',
    parseResponse: (data: any) => {
      const rates: ExchangeRates = { USD: 1.0 }
      Object.entries(data.usd).forEach(([key, value]: [string, any]) => {
        rates[key.toUpperCase()] = value
      })
      return rates
    }
  },
  {
    name: 'cors-proxy-exchangerate',
    url: 'https://cors-anywhere.herokuapp.com/https://api.exchangerate-api.com/v4/latest/USD',
    parseResponse: (data: any) => data.rates
  },
  {
    name: 'exchangerate-api-free',
    url: 'https://open.er-api.com/v6/latest/USD',
    parseResponse: (data: any) => data.rates
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
          },
          mode: 'cors'
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
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        // More specific error logging for CORS issues
        if (errorMessage.includes('CORS') || errorMessage.includes('Access-Control-Allow-Origin')) {
          console.warn(`CORS error with ${apiSource.name}:`, errorMessage)
          if (isDevelopment) {
            console.info(`💡 Development tip: ${apiSource.name} doesn't support CORS for localhost. Trying next API source...`)
          }
        } else {
          console.warn(`Failed to fetch from ${apiSource.name}:`, errorMessage)
        }
        continue
      }
    }
    
    throw new Error('All API sources failed')
  } catch (error) {
    console.error('Failed to fetch exchange rates from all sources:', error)
    
    // Show user-friendly message in development
    if (isDevelopment) {
      console.info('💡 Exchange Rate APIs Issue: Using fallback rates for development. This is normal and won\'t affect production.')
    }
    
    // Use cached rates if available, even if expired
    if (exchangeRatesCache && Date.now() - exchangeRatesCache.timestamp < FALLBACK_CACHE_DURATION) {
      console.log('Using expired cached rates')
      return exchangeRatesCache
    }
    
    // Fall back to static rates
    const fallbackResult: RatesFetchResult = {
      rates: FALLBACK_RATES,
      timestamp: Date.now(),
      source: 'fallback (demo rates)',
      lastUpdated: new Date()
    }
    
    exchangeRatesCache = fallbackResult
    console.info('Using fallback exchange rates for currency conversion')
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