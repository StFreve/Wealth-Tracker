import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';

import { MarketDataService } from './market-data.service';
import { MarketDataController } from './market-data.controller';
import { CurrencyService } from './currency.service';
import { StockService } from './stock.service';

@Module({
  imports: [
    HttpModule,
    ScheduleModule.forRoot(),
    CacheModule.register({
      ttl: 15 * 60 * 1000, // 15 minutes
    }),
  ],
  controllers: [MarketDataController],
  providers: [MarketDataService, CurrencyService, StockService],
  exports: [MarketDataService, CurrencyService, StockService],
})
export class MarketDataModule {} 