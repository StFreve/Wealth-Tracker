import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Portfolio } from './entities/portfolio.entity';
import { Asset } from '../assets/entities/asset.entity';
import { Transaction } from '../assets/entities/transaction.entity';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { MarketDataModule } from '../market-data/market-data.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Portfolio, Asset, Transaction]),
    MarketDataModule,
  ],
  controllers: [PortfolioController],
  providers: [PortfolioService],
  exports: [PortfolioService, TypeOrmModule],
})
export class PortfolioModule {} 