import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from './entities/asset.entity';
import { Transaction } from './entities/transaction.entity';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  async findAll(userId: string): Promise<Asset[]> {
    return this.assetRepository.find({
      where: { userId },
      relations: ['transactions'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Asset | null> {
    return this.assetRepository.findOne({
      where: { id, userId },
      relations: ['transactions'],
    });
  }

  async create(assetData: Partial<Asset>): Promise<Asset> {
    const asset = this.assetRepository.create(assetData);
    return this.assetRepository.save(asset);
  }

  async update(id: string, userId: string, updateData: Partial<Asset>): Promise<Asset> {
    await this.assetRepository.update({ id, userId }, updateData);
    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.assetRepository.delete({ id, userId });
  }

  async createTransaction(transactionData: Partial<Transaction>): Promise<Transaction> {
    const transaction = this.transactionRepository.create(transactionData);
    return this.transactionRepository.save(transaction);
  }

  async getPortfolioSummary(userId: string) {
    const assets = await this.findAll(userId);
    
    const summary = {
      totalValue: 0,
      totalGainLoss: 0,
      assetCount: assets.length,
      byType: {},
    };

    assets.forEach(asset => {
      summary.totalValue += asset.currentValue || 0;
      summary.totalGainLoss += asset.totalGainLoss || 0;
      
      if (!summary.byType[asset.type]) {
        summary.byType[asset.type] = { count: 0, value: 0 };
      }
      summary.byType[asset.type].count++;
      summary.byType[asset.type].value += asset.currentValue || 0;
    });

    return summary;
  }
} 