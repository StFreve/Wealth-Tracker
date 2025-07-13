import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CurrencyService, CurrencyRateResponse } from './currency.service';
import { StockService, StockPrice, StockPriceResponse } from './stock.service';

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);

  constructor(
    private readonly currencyService: CurrencyService,
    private readonly stockService: StockService,
  ) {}

  // Scheduled task to refresh currency rates every 15 minutes
  @Cron('0 */15 * * * *') // Every 15 minutes
  async refreshCurrencyRates(): Promise<void> {
    this.logger.log('Scheduled currency rates refresh starting...');
    try {
      await this.currencyService.getExchangeRates(true); // Force refresh
      this.logger.log('Scheduled currency rates refresh completed');
    } catch (error) {
      this.logger.error('Scheduled currency rates refresh failed:', error);
    }
  }

  // Scheduled task to refresh popular stock prices every 15 minutes during market hours
  @Cron('0 */15 9-16 * * 1-5') // Every 15 minutes during 9AM-4PM, Monday-Friday
  async refreshPopularStocks(): Promise<void> {
    this.logger.log('Scheduled stock prices refresh starting...');
    
    // List of popular stocks to keep fresh in cache
    const popularStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'SPY'];
    
    try {
      await this.stockService.getMultipleStockPrices(popularStocks, true); // Force refresh
      this.logger.log(`Scheduled refresh completed for ${popularStocks.length} stocks`);
    } catch (error) {
      this.logger.error('Scheduled stock prices refresh failed:', error);
    }
  }

  // Currency methods
  async getCurrencyRates(forceRefresh = false): Promise<CurrencyRateResponse> {
    return this.currencyService.getExchangeRates(forceRefresh);
  }

  async convertCurrency(amount: number, from: string, to: string): Promise<number> {
    return this.currencyService.convertCurrency(amount, from, to);
  }

  async convertCurrencyBatch(conversions: Array<{ amount: number; from: string; to: string }>): Promise<Array<{ amount: number; from: string; to: string; convertedAmount: number; rate: number }>> {
    const results = [];
    
    for (const conversion of conversions) {
      try {
        const convertedAmount = await this.currencyService.convertCurrency(
          conversion.amount, 
          conversion.from.toUpperCase(), 
          conversion.to.toUpperCase()
        );
        
        results.push({
          amount: conversion.amount,
          from: conversion.from.toUpperCase(),
          to: conversion.to.toUpperCase(),
          convertedAmount,
          rate: convertedAmount / conversion.amount,
        });
      } catch (error) {
        this.logger.error(`Failed to convert ${conversion.amount} ${conversion.from} to ${conversion.to}:`, error);
        // Return original amount as fallback
        results.push({
          amount: conversion.amount,
          from: conversion.from.toUpperCase(),
          to: conversion.to.toUpperCase(),
          convertedAmount: conversion.amount,
          rate: 1,
        });
      }
    }
    
    return results;
  }

  async getSupportedCurrencies(): Promise<string[]> {
    return this.currencyService.getSupportedCurrencies();
  }

  async getCurrencyStatus(): Promise<{
    cached: boolean;
    age: number;
    source: string | null;
    lastUpdated: Date | null;
  }> {
    return this.currencyService.getCacheStatus();
  }

  // Stock methods
  async getStockPrice(symbol: string, forceRefresh = false): Promise<StockPrice | null> {
    return this.stockService.getStockPrice(symbol, forceRefresh);
  }

  async getMultipleStockPrices(symbols: string[], forceRefresh = false): Promise<StockPriceResponse> {
    return this.stockService.getMultipleStockPrices(symbols, forceRefresh);
  }

  async getStockStatus(symbol: string): Promise<{
    cached: boolean;
    age: number;
    source: string | null;
    lastUpdated: Date | null;
  }> {
    return this.stockService.getCacheStatus(symbol);
  }

  // Health check method
  async getHealthStatus(): Promise<{
    currency: {
      status: string;
      lastUpdate: Date | null;
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
    const currencyStatus = await this.getCurrencyStatus();
    
    return {
      currency: {
        status: currencyStatus.cached ? 'cached' : 'not_cached',
        lastUpdate: currencyStatus.lastUpdated,
        source: currencyStatus.source,
        age: currencyStatus.age,
      },
      cache: {
        working: true, // We could add more sophisticated cache health checks
      },
      scheduledJobs: {
        currencyRefresh: 'Every 15 minutes',
        stockRefresh: 'Every 15 minutes (9AM-4PM, Mon-Fri)',
      },
    };
  }
} 