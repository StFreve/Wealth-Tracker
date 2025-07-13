import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Asset } from '../assets/entities/asset.entity';
import { Transaction } from '../assets/entities/transaction.entity';
import { PortfolioModule } from '../portfolio/portfolio.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Asset, Transaction]),
    PortfolioModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {} 