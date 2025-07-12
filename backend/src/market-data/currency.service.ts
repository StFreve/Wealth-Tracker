import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';

export interface ExchangeRates {
  [key: string]: number;
}

export interface CurrencyRateResponse {
  rates: ExchangeRates;
  timestamp: number;
  source: string;
  lastUpdated: Date;
}

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);
  private readonly CACHE_KEY = 'currency_rates';

  // Fallback exchange rates (updated December 2024)
  private readonly FALLBACK_RATES: ExchangeRates = {
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
  };

  // API sources with CORS-enabled endpoints
  private readonly API_SOURCES = [
    {
      name: 'exchangerate-host',
      url: 'https://api.exchangerate.host/latest?base=USD',
      parseResponse: (data: any) => data.rates,
    },
    {
      name: 'fawazahmed0',
      url: 'https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/usd.json',
      parseResponse: (data: any) => {
        const rates: ExchangeRates = { USD: 1.0 };
        Object.entries(data.usd).forEach(([key, value]: [string, any]) => {
          rates[key.toUpperCase()] = value;
        });
        return rates;
      },
    },
    {
      name: 'open-exchange-rates',
      url: 'https://open.er-api.com/v6/latest/USD',
      parseResponse: (data: any) => data.rates,
    },
  ];

  constructor(
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getExchangeRates(forceRefresh = false): Promise<CurrencyRateResponse> {
    if (!forceRefresh) {
      // Try to get from cache first
      const cached = await this.cacheManager.get<CurrencyRateResponse>(this.CACHE_KEY);
      if (cached) {
        this.logger.debug('Returning cached exchange rates');
        return cached;
      }
    }

    // Fetch fresh data
    const freshRates = await this.fetchFreshRates();
    
    // Cache the result
    await this.cacheManager.set(this.CACHE_KEY, freshRates, 15 * 60 * 1000); // 15 minutes
    
    return freshRates;
  }

  private async fetchFreshRates(): Promise<CurrencyRateResponse> {
    this.logger.log('Fetching fresh exchange rates...');

    // Try each API source
    for (const apiSource of this.API_SOURCES) {
      try {
        this.logger.debug(`Trying ${apiSource.name}...`);
        
        const response = await firstValueFrom(
          this.httpService.get(apiSource.url, {
            timeout: 10000,
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'WealthTracker/1.0',
            },
          }),
        );

        if (response.data) {
          const rates = apiSource.parseResponse(response.data);
          
          if (rates && typeof rates === 'object') {
            // Ensure USD is always 1.0 as base currency
            const normalizedRates = {
              USD: 1.0,
              ...rates,
            };

            // Add fallback rates for missing currencies
            Object.keys(this.FALLBACK_RATES).forEach(currency => {
              if (!normalizedRates[currency]) {
                normalizedRates[currency] = this.FALLBACK_RATES[currency];
                this.logger.warn(`Using fallback rate for ${currency}`);
              }
            });

            const result: CurrencyRateResponse = {
              rates: normalizedRates,
              timestamp: Date.now(),
              source: apiSource.name,
              lastUpdated: new Date(),
            };

            this.logger.log(`Successfully fetched rates from ${apiSource.name}`);
            return result;
          }
        }
      } catch (error) {
        this.logger.warn(`Failed to fetch from ${apiSource.name}: ${error.message}`);
        continue;
      }
    }

    // All sources failed, use fallback
    this.logger.warn('All API sources failed, using fallback rates');
    return {
      rates: this.FALLBACK_RATES,
      timestamp: Date.now(),
      source: 'fallback',
      lastUpdated: new Date(),
    };
  }

  async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const { rates } = await this.getExchangeRates();
    
    const fromRate = rates[fromCurrency];
    const toRate = rates[toCurrency];

    if (!fromRate || !toRate) {
      throw new Error(`Exchange rate not available for ${fromCurrency} or ${toCurrency}`);
    }

    // Convert: amount * (1/fromRate) * toRate
    return amount * (1 / fromRate) * toRate;
  }

  async getSupportedCurrencies(): Promise<string[]> {
    const { rates } = await this.getExchangeRates();
    return Object.keys(rates);
  }

  async getCacheStatus(): Promise<{ 
    cached: boolean; 
    age: number; 
    source: string | null;
    lastUpdated: Date | null;
  }> {
    const cached = await this.cacheManager.get<CurrencyRateResponse>(this.CACHE_KEY);
    
    if (cached) {
      return {
        cached: true,
        age: Date.now() - cached.timestamp,
        source: cached.source,
        lastUpdated: cached.lastUpdated,
      };
    }

    return {
      cached: false,
      age: 0,
      source: null,
      lastUpdated: null,
    };
  }
} 