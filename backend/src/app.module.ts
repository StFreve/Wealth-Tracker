import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AssetsModule } from './assets/assets.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { WidgetsModule } from './widgets/widgets.module';
import { MarketDataModule } from './market-data/market-data.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    DatabaseModule,

    // Cache (simplified for now - Redis can be added later)
    CacheModule.register({
      isGlobal: true,
      ttl: 300, // 5 minutes default TTL
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Feature modules
    AuthModule,
    UsersModule,
    AssetsModule,
    PortfolioModule,
    AnalyticsModule,
    WidgetsModule,
    MarketDataModule,
  ],
})
export class AppModule {} 