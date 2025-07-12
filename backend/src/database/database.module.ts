import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

import { User } from '../users/entities/user.entity';
import { Asset } from '../assets/entities/asset.entity';
import { Transaction } from '../assets/entities/transaction.entity';
import { Portfolio } from '../portfolio/entities/portfolio.entity';
import { Widget } from '../widgets/entities/widget.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: configService.get('DATABASE_PORT', 5432),
        username: configService.get('DATABASE_USERNAME', 'postgres'),
        password: configService.get('DATABASE_PASSWORD', 'postgres'),
        database: configService.get('DATABASE_NAME', 'wealth_tracker'),
        entities: [User, Asset, Transaction, Portfolio, Widget],
        synchronize: true, // Force synchronization for development
        logging: true, // Enable logging to debug
        dropSchema: false, // Don't drop existing schema
        ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {} 