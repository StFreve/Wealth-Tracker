// Frontend API service for market data
const API_BASE_URL = (window as any).API_URL || 'http://localhost:3001/api';

export interface ExchangeRates {
  [key: string]: number;
}

export interface CurrencyRateResponse {
  rates: ExchangeRates;
  timestamp: number;
  source: string;
  lastUpdated: string; // ISO string from backend
}

export interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
  source: string;
  lastUpdated: string; // ISO string from backend
}

export interface StockPriceResponse {
  [symbol: string]: StockPrice;
}

export interface CacheStatus {
  cached: boolean;
  age: number;
  source: string | null;
  lastUpdated: string | null;
}

class MarketDataApi {
  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const token = localStorage.getItem('auth_token');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    return response;
  }

  // Currency API methods
  async getCurrencyRates(forceRefresh = false): Promise<CurrencyRateResponse> {
    const url = `/market-data/currency/rates${forceRefresh ? '?refresh=true' : ''}`;
    const response = await this.fetchWithAuth(url);
    return response.json();
  }

  async convertCurrency(amount: number, from: string, to: string): Promise<{
    amount: number;
    from: string;
    to: string;
    convertedAmount: number;
    rate: number;
  }> {
    const url = `/market-data/currency/convert?amount=${amount}&from=${from}&to=${to}`;
    const response = await this.fetchWithAuth(url);
    return response.json();
  }

  async getSupportedCurrencies(): Promise<{ currencies: string[] }> {
    const response = await this.fetchWithAuth('/market-data/currency/supported');
    return response.json();
  }

  async getCurrencyStatus(): Promise<CacheStatus> {
    const response = await this.fetchWithAuth('/market-data/currency/status');
    return response.json();
  }

  // Stock API methods
  async getStockPrice(symbol: string, forceRefresh = false): Promise<StockPrice> {
    const url = `/market-data/stocks/${symbol.toUpperCase()}${forceRefresh ? '?refresh=true' : ''}`;
    const response = await this.fetchWithAuth(url);
    return response.json();
  }

  async getMultipleStockPrices(symbols: string[], forceRefresh = false): Promise<{
    requested: string[];
    found: string[];
    data: StockPriceResponse;
  }> {
    const symbolsParam = symbols.join(',');
    const url = `/market-data/stocks?symbols=${symbolsParam}${forceRefresh ? '&refresh=true' : ''}`;
    const response = await this.fetchWithAuth(url);
    return response.json();
  }

  async getStockStatus(symbol: string): Promise<CacheStatus> {
    const response = await this.fetchWithAuth(`/market-data/stocks/${symbol.toUpperCase()}/status`);
    return response.json();
  }

  // Health check
  async getHealthStatus(): Promise<{
    currency: {
      status: string;
      lastUpdate: string | null;
      source: string | null;
      age: number;
    };
    cache: {
      working: boolean;
    };
    scheduledJobs: {
      currencyRefresh: string;
      stockRefresh: string;
    };
  }> {
    const response = await this.fetchWithAuth('/market-data/health');
    return response.json();
  }
}

// Export singleton instance
export const marketDataApi = new MarketDataApi();

// Helper functions for compatibility with existing frontend code
export async function fetchExchangeRates(forceRefresh = false): Promise<{
  rates: ExchangeRates;
  timestamp: number;
  source: string;
  lastUpdated: Date;
}> {
  const response = await marketDataApi.getCurrencyRates(forceRefresh);
  return {
    ...response,
    lastUpdated: new Date(response.lastUpdated),
  };
}

export async function convertCurrency(amount: number, from: string, to: string): Promise<number> {
  const response = await marketDataApi.convertCurrency(amount, from, to);
  return response.convertedAmount;
}

export async function fetchStockPrice(symbol: string, forceRefresh = false): Promise<{
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
  source: string;
  lastUpdated: Date;
} | null> {
  try {
    const response = await marketDataApi.getStockPrice(symbol, forceRefresh);
    return {
      ...response,
      lastUpdated: new Date(response.lastUpdated),
    };
  } catch (error) {
    console.warn(`Failed to fetch stock price for ${symbol}:`, error);
    return null;
  }
}

// Format helpers
export function formatStockPrice(stockPrice: StockPrice): string {
  return `$${stockPrice.price.toFixed(2)}`;
}

export function formatStockPriceChange(stockPrice: StockPrice): string {
  const sign = stockPrice.change >= 0 ? '+' : '';
  return `${sign}${stockPrice.change.toFixed(2)} (${sign}${stockPrice.changePercent.toFixed(2)}%)`;
}

export function isValidStockSymbol(symbol: string): boolean {
  // Enhanced validation for stocks, ETFs, and other equity securities
  // Should be 1-5 characters, letters only - covers most US stocks, ETFs, and international listings
  const cleaned = symbol.trim().toUpperCase();
  return /^[A-Z]{1,5}$/.test(cleaned);
} 