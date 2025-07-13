import { Controller, Get, Query, Param, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam, ApiResponse } from '@nestjs/swagger';
import { MarketDataService } from './market-data.service';

@ApiTags('market-data')
@Controller('market-data')
export class MarketDataController {
  constructor(private readonly marketDataService: MarketDataService) {}

  // Currency endpoints
  @Get('currency/rates')
  @ApiOperation({ summary: 'Get current exchange rates' })
  @ApiQuery({ name: 'refresh', required: false, type: Boolean, description: 'Force refresh from external APIs' })
  @ApiResponse({ status: 200, description: 'Exchange rates retrieved successfully' })
  async getCurrencyRates(@Query('refresh') refresh = false) {
    try {
      return await this.marketDataService.getCurrencyRates(refresh);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch currency rates',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('currency/convert')
  @ApiOperation({ summary: 'Convert amount between currencies' })
  @ApiQuery({ name: 'amount', required: true, type: Number, description: 'Amount to convert' })
  @ApiQuery({ name: 'from', required: true, type: String, description: 'Source currency code (e.g., USD)' })
  @ApiQuery({ name: 'to', required: true, type: String, description: 'Target currency code (e.g., EUR)' })
  @ApiResponse({ status: 200, description: 'Currency conversion completed' })
  async convertCurrency(
    @Query('amount') amount: number,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    try {
      if (amount === undefined || amount === null || !from || !to) {
        throw new HttpException(
          'Missing required parameters: amount, from, to',
          HttpStatus.BAD_REQUEST,
        );
      }

      const convertedAmount = await this.marketDataService.convertCurrency(amount, from.toUpperCase(), to.toUpperCase());
      
      return {
        amount,
        from: from.toUpperCase(),
        to: to.toUpperCase(),
        convertedAmount,
        rate: convertedAmount / amount,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to convert currency',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('currency/supported')
  @ApiOperation({ summary: 'Get list of supported currencies' })
  @ApiResponse({ status: 200, description: 'Supported currencies list retrieved' })
  async getSupportedCurrencies() {
    try {
      const currencies = await this.marketDataService.getSupportedCurrencies();
      return { currencies };
    } catch (error) {
      throw new HttpException(
        'Failed to fetch supported currencies',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('currency/status')
  @ApiOperation({ summary: 'Get currency data cache status' })
  @ApiResponse({ status: 200, description: 'Currency cache status retrieved' })
  async getCurrencyStatus() {
    try {
      return await this.marketDataService.getCurrencyStatus();
    } catch (error) {
      throw new HttpException(
        'Failed to fetch currency status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Stock endpoints
  @Get('stocks/:symbol')
  @ApiOperation({ summary: 'Get stock price for a specific symbol' })
  @ApiParam({ name: 'symbol', type: String, description: 'Stock symbol (e.g., AAPL)' })
  @ApiQuery({ name: 'refresh', required: false, type: Boolean, description: 'Force refresh from external APIs' })
  @ApiResponse({ status: 200, description: 'Stock price retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Stock not found' })
  async getStockPrice(
    @Param('symbol') symbol: string,
    @Query('refresh') refresh = false,
  ) {
    try {
      const stockPrice = await this.marketDataService.getStockPrice(symbol.toUpperCase(), refresh);
      
      if (!stockPrice) {
        throw new HttpException(
          `Stock price not found for symbol: ${symbol}`,
          HttpStatus.NOT_FOUND,
        );
      }

      return stockPrice;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch stock price',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stocks')
  @ApiOperation({ summary: 'Get stock prices for multiple symbols' })
  @ApiQuery({ name: 'symbols', required: true, type: String, description: 'Comma-separated stock symbols (e.g., AAPL,MSFT,GOOGL)' })
  @ApiQuery({ name: 'refresh', required: false, type: Boolean, description: 'Force refresh from external APIs' })
  @ApiResponse({ status: 200, description: 'Stock prices retrieved successfully' })
  async getMultipleStockPrices(
    @Query('symbols') symbols: string,
    @Query('refresh') refresh = false,
  ) {
    try {
      if (!symbols) {
        throw new HttpException(
          'Missing required parameter: symbols',
          HttpStatus.BAD_REQUEST,
        );
      }

      const symbolList = symbols.split(',').map(s => s.trim().toUpperCase());
      
      if (symbolList.length === 0) {
        throw new HttpException(
          'No valid symbols provided',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (symbolList.length > 20) {
        throw new HttpException(
          'Too many symbols. Maximum 20 symbols per request.',
          HttpStatus.BAD_REQUEST,
        );
      }

      const stockPrices = await this.marketDataService.getMultipleStockPrices(symbolList, refresh);
      
      return {
        requested: symbolList,
        found: Object.keys(stockPrices),
        data: stockPrices,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch stock prices',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stocks/:symbol/status')
  @ApiOperation({ summary: 'Get stock data cache status' })
  @ApiParam({ name: 'symbol', type: String, description: 'Stock symbol (e.g., AAPL)' })
  @ApiResponse({ status: 200, description: 'Stock cache status retrieved' })
  async getStockStatus(@Param('symbol') symbol: string) {
    try {
      return await this.marketDataService.getStockStatus(symbol.toUpperCase());
    } catch (error) {
      throw new HttpException(
        'Failed to fetch stock status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Health check endpoint
  @Get('health')
  @ApiOperation({ summary: 'Get market data service health status' })
  @ApiResponse({ status: 200, description: 'Health status retrieved' })
  async getHealthStatus() {
    try {
      return await this.marketDataService.getHealthStatus();
    } catch (error) {
      throw new HttpException(
        'Failed to fetch health status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 