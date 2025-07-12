// Stock price fetching utilities
import { useState, useEffect, useCallback } from 'react'

interface StockPrice {
  symbol: string
  price: number
  currency: string
  timestamp: number
  source: string
  change?: number
  changePercent?: number
}

interface StockPriceCache {
  [symbol: string]: StockPrice
}

// Cache for stock prices
let stockPriceCache: StockPriceCache = {}
const STOCK_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Multiple stock price API sources for redundancy
 */
const STOCK_API_SOURCES = [
  {
    name: 'alpha-vantage',
    url: (symbol: string) => `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=demo`,
    parseResponse: (data: any, symbol: string): StockPrice | null => {
      const quote = data['Global Quote']
      if (!quote || !quote['05. price']) return null
      
      return {
        symbol: symbol.toUpperCase(),
        price: parseFloat(quote['05. price']),
        currency: 'USD', // Alpha Vantage typically returns USD
        timestamp: Date.now(),
        source: 'alpha-vantage',
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent']?.replace('%', ''))
      }
    }
  },
  {
    name: 'finnhub',
    url: (symbol: string) => `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=demo`,
    parseResponse: (data: any, symbol: string): StockPrice | null => {
      if (!data.c || data.c === 0) return null
      
      return {
        symbol: symbol.toUpperCase(),
        price: data.c,
        currency: 'USD',
        timestamp: Date.now(),
        source: 'finnhub',
        change: data.d,
        changePercent: data.dp
      }
    }
  },
  {
    name: 'yahoo-finance',
    url: (symbol: string) => `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
    parseResponse: (data: any, symbol: string): StockPrice | null => {
      const result = data.chart?.result?.[0]
      if (!result?.meta?.regularMarketPrice) return null
      
      return {
        symbol: symbol.toUpperCase(),
        price: result.meta.regularMarketPrice,
        currency: result.meta.currency || 'USD',
        timestamp: Date.now(),
        source: 'yahoo-finance',
        change: result.meta.regularMarketPrice - result.meta.previousClose,
        changePercent: ((result.meta.regularMarketPrice - result.meta.previousClose) / result.meta.previousClose) * 100
      }
    }
  },
  {
    name: 'iex-cloud',
    url: (symbol: string) => `https://cloud.iexapis.com/stable/stock/${symbol}/quote?token=demo`,
    parseResponse: (data: any, symbol: string): StockPrice | null => {
      if (!data.latestPrice) return null
      
      return {
        symbol: symbol.toUpperCase(),
        price: data.latestPrice,
        currency: 'USD',
        timestamp: Date.now(),
        source: 'iex-cloud',
        change: data.change,
        changePercent: data.changePercent * 100
      }
    }
  }
]

/**
 * Validates if a stock symbol is likely valid
 * Supports stocks, ETFs, and other equity securities
 */
export function isValidStockSymbol(symbol: string): boolean {
  // Enhanced validation - should be 1-5 characters, letters only
  // This covers most US stocks, ETFs, and many international listings
  const cleaned = symbol.trim().toUpperCase()
  return /^[A-Z]{1,5}$/.test(cleaned)
}

/**
 * Gets stock suggestions based on partial symbol
 */
export async function getStockSuggestions(query: string): Promise<string[]> {
  // This would typically connect to a stock search API
  // For now, return some common stocks and ETFs that match the query
  const commonSymbols = [
    // Popular Stocks
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX',
    'ORCL', 'CRM', 'ADBE', 'INTC', 'AMD', 'QCOM', 'AVGO', 'TXN',
    'CSCO', 'PYPL', 'UBER', 'LYFT', 'SNAP', 'TWTR', 'PINS', 'SQ',
    // Popular ETFs
    'VOO', 'IWF', 'SPY', 'QQQ', 'VTI', 'IVV', 'VEA', 'VWO', 
    'IEFA', 'IEMG', 'VYM', 'VUG', 'IWM', 'EFA', 'EEM', 'GLD', 
    'SLV', 'TLT', 'HYG', 'LQD'
  ]
  
  const upperQuery = query.toUpperCase()
  return commonSymbols.filter(symbol => 
    symbol.startsWith(upperQuery) || symbol.includes(upperQuery)
  ).slice(0, 10)
}

/**
 * Fetches current stock price with caching and fallback
 */
export async function fetchStockPrice(symbol: string): Promise<StockPrice> {
  const normalizedSymbol = symbol.trim().toUpperCase()
  
  // Validate symbol
  if (!isValidStockSymbol(normalizedSymbol)) {
    throw new Error(`Invalid stock symbol: ${symbol}`)
  }
  
  // Check cache first
  const cached = stockPriceCache[normalizedSymbol]
  if (cached && Date.now() - cached.timestamp < STOCK_CACHE_DURATION) {
    return cached
  }
  
  // Try each API source
  for (const apiSource of STOCK_API_SOURCES) {
    try {
      console.log(`Fetching ${normalizedSymbol} price from ${apiSource.name}...`)
      
      const response = await fetch(apiSource.url(normalizedSymbol), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      const stockPrice = apiSource.parseResponse(data, normalizedSymbol)
      
      if (stockPrice && stockPrice.price > 0) {
        // Cache the result
        stockPriceCache[normalizedSymbol] = stockPrice
        console.log(`Successfully fetched ${normalizedSymbol} price: $${stockPrice.price}`)
        return stockPrice
      }
      
      throw new Error('Invalid price data')
    } catch (error) {
      console.warn(`Failed to fetch from ${apiSource.name}:`, error)
      continue
    }
  }
  
  // If all APIs fail, try to use a cached value even if expired
  if (cached) {
    console.log(`Using expired cached price for ${normalizedSymbol}`)
    return cached
  }
  
  throw new Error(`Unable to fetch price for ${normalizedSymbol} from any source`)
}

/**
 * Fetches multiple stock prices in parallel
 */
export async function fetchMultipleStockPrices(symbols: string[]): Promise<{ [symbol: string]: StockPrice | null }> {
  const promises = symbols.map(async (symbol) => {
    try {
      const price = await fetchStockPrice(symbol)
      return { symbol: symbol.toUpperCase(), price }
    } catch (error) {
      console.error(`Failed to fetch price for ${symbol}:`, error)
      return { symbol: symbol.toUpperCase(), price: null }
    }
  })
  
  const results = await Promise.all(promises)
  
  return results.reduce((acc, result) => {
    acc[result.symbol] = result.price
    return acc
  }, {} as { [symbol: string]: StockPrice | null })
}

/**
 * Clears the stock price cache
 */
export function clearStockPriceCache(): void {
  stockPriceCache = {}
}

/**
 * Gets cached stock price if available
 */
export function getCachedStockPrice(symbol: string): StockPrice | null {
  const cached = stockPriceCache[symbol.toUpperCase()]
  return cached || null
}

/**
 * Formats stock price with currency
 */
export function formatStockPrice(stockPrice: StockPrice): string {
  const symbol = stockPrice.currency === 'USD' ? '$' : stockPrice.currency
  return `${symbol}${stockPrice.price.toFixed(2)}`
}

/**
 * Formats stock price change
 */
export function formatStockPriceChange(stockPrice: StockPrice): string {
  if (!stockPrice.change || !stockPrice.changePercent) return ''
  
  const sign = stockPrice.change >= 0 ? '+' : ''
  const changeStr = `${sign}${stockPrice.change.toFixed(2)}`
  const percentStr = `${sign}${stockPrice.changePercent.toFixed(2)}%`
  
  return `${changeStr} (${percentStr})`
}

/**
 * Hook for React components to fetch stock prices
 */
export function useStockPrice(symbol: string | null) {
  const [stockPrice, setStockPrice] = useState<StockPrice | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fetchPrice = useCallback(async (stockSymbol: string) => {
    if (!stockSymbol) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const price = await fetchStockPrice(stockSymbol)
      setStockPrice(price)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stock price')
      setStockPrice(null)
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  useEffect(() => {
    if (symbol) {
      fetchPrice(symbol)
    } else {
      setStockPrice(null)
      setError(null)
    }
  }, [symbol, fetchPrice])
  
  return {
    stockPrice,
    isLoading,
    error,
    refetch: () => symbol && fetchPrice(symbol)
  }
}

// Export hook for React components 