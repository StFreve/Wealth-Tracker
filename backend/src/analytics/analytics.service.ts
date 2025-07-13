import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset, AssetType } from '../assets/entities/asset.entity';
import { Transaction, TransactionType } from '../assets/entities/transaction.entity';
import { PortfolioService } from '../portfolio/portfolio.service';

export interface PortfolioAnalytics {
  performance: PerformanceAnalytics;
  allocation: AllocationAnalytics;
  trends: TrendAnalytics;
  riskMetrics: RiskMetrics;
}

export interface PerformanceAnalytics {
  totalReturn: number;
  totalReturnPercent: number;
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  bestAsset: AssetPerformance;
  worstAsset: AssetPerformance;
}

export interface AllocationAnalytics {
  byAssetType: AssetTypeAllocation[];
  byCurrency: CurrencyAllocation[];
  byRiskLevel: RiskLevelAllocation[];
  diversificationScore: number;
}

export interface TrendAnalytics {
  dailyReturns: DailyReturn[];
  monthlyReturns: MonthlyReturn[];
  yearlyReturns: YearlyReturn[];
  volatility: number;
  beta: number;
}

export interface RiskMetrics {
  portfolioRisk: number;
  valueAtRisk: number;
  conditionalValueAtRisk: number;
  concentrationRisk: number;
}

export interface AssetPerformance {
  name: string;
  type: AssetType;
  value: number;
  return: number;
  returnPercent: number;
}

export interface AssetTypeAllocation {
  type: string;
  value: number;
  percentage: number;
  count: number;
  averageReturn: number;
}

export interface CurrencyAllocation {
  currency: string;
  value: number;
  percentage: number;
  count: number;
}

export interface RiskLevelAllocation {
  riskLevel: 'low' | 'medium' | 'high';
  value: number;
  percentage: number;
  count: number;
}

export interface DailyReturn {
  date: Date;
  value: number;
  return: number;
  returnPercent: number;
}

export interface MonthlyReturn {
  month: string;
  value: number;
  return: number;
  returnPercent: number;
}

export interface YearlyReturn {
  year: number;
  value: number;
  return: number;
  returnPercent: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private portfolioService: PortfolioService,
  ) {}

  async getPortfolioAnalytics(userId: string): Promise<PortfolioAnalytics> {
    const assets = await this.assetRepository.find({
      where: { userId, isActive: true },
      relations: ['transactions'],
      order: { createdAt: 'DESC' },
    });

    const transactions = await this.transactionRepository.find({
      where: { userId },
      relations: ['asset'],
      order: { transactionDate: 'DESC' },
    });

    const portfolioMetrics = await this.portfolioService.getPortfolioMetrics(userId);

    return {
      performance: this.calculatePerformanceAnalytics(assets, transactions, portfolioMetrics),
      allocation: this.calculateAllocationAnalytics(assets, portfolioMetrics),
      trends: this.calculateTrendAnalytics(assets, transactions),
      riskMetrics: this.calculateRiskMetrics(assets, transactions),
    };
  }

  private calculatePerformanceAnalytics(
    assets: Asset[],
    transactions: Transaction[],
    portfolioMetrics: any
  ): PerformanceAnalytics {
    const totalInvestment = portfolioMetrics.performanceMetrics.totalInvestment;
    const totalReturn = portfolioMetrics.totalGainLoss;
    const totalReturnPercent = portfolioMetrics.totalGainLossPercent;

    // Calculate annualized return
    const oldestAsset = assets.reduce((oldest, asset) => {
      const assetDate = asset.purchaseDate || asset.createdAt;
      const oldestDate = oldest.purchaseDate || oldest.createdAt;
      return assetDate < oldestDate ? asset : oldest;
    }, assets[0]);

    const yearsHeld = oldestAsset
      ? Math.max((new Date().getTime() - (oldestAsset.purchaseDate || oldestAsset.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 365), 0.1)
      : 0.1;

    const annualizedReturn = totalInvestment > 0 && yearsHeld > 0
      ? (Math.pow(1 + (totalReturn / totalInvestment), 1 / yearsHeld) - 1) * 100
      : 0;

    // Calculate win rate
    const profitableAssets = assets.filter(asset => asset.totalGainLoss > 0).length;
    const winRate = assets.length > 0 ? (profitableAssets / assets.length) * 100 : 0;

    // Find best and worst performing assets
    const assetPerformances = assets.map(asset => ({
      name: asset.name,
      type: asset.type,
      value: asset.currentValue,
      return: asset.totalGainLoss,
      returnPercent: asset.gainLossPercentage,
    }));

    const bestAsset = assetPerformances.reduce((best, current) => 
      current.returnPercent > best.returnPercent ? current : best,
      assetPerformances[0]
    );

    const worstAsset = assetPerformances.reduce((worst, current) => 
      current.returnPercent < worst.returnPercent ? current : worst,
      assetPerformances[0]
    );

    // Placeholder calculations for advanced metrics
    const sharpeRatio = this.calculateSharpeRatio(assets);
    const maxDrawdown = this.calculateMaxDrawdown(assets);

    return {
      totalReturn,
      totalReturnPercent,
      annualizedReturn,
      sharpeRatio,
      maxDrawdown,
      winRate,
      bestAsset: bestAsset || { name: 'N/A', type: AssetType.OTHER, value: 0, return: 0, returnPercent: 0 },
      worstAsset: worstAsset || { name: 'N/A', type: AssetType.OTHER, value: 0, return: 0, returnPercent: 0 },
    };
  }

  private calculateAllocationAnalytics(
    assets: Asset[],
    portfolioMetrics: any
  ): AllocationAnalytics {
    const totalValue = portfolioMetrics.totalValue;

    // Asset type allocation with average returns
    const byAssetType = portfolioMetrics.assetAllocation.map(allocation => {
      const typeAssets = assets.filter(asset => 
        this.getAssetTypeDisplayName(asset.type) === allocation.type
      );
      const averageReturn = typeAssets.length > 0
        ? typeAssets.reduce((sum, asset) => sum + asset.gainLossPercentage, 0) / typeAssets.length
        : 0;

      return {
        type: allocation.type,
        value: allocation.value,
        percentage: allocation.percentage,
        count: allocation.count,
        averageReturn,
      };
    });

    // Currency allocation
    const currencyMap = new Map<string, { value: number; count: number }>();
    assets.forEach(asset => {
      const currency = asset.currency;
      const current = currencyMap.get(currency) || { value: 0, count: 0 };
      current.value += asset.currentValue;
      current.count += 1;
      currencyMap.set(currency, current);
    });

    const byCurrency = Array.from(currencyMap.entries()).map(([currency, data]) => ({
      currency,
      value: data.value,
      percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
      count: data.count,
    }));

    // Risk level allocation (simplified calculation)
    const byRiskLevel = this.calculateRiskLevelAllocation(assets, totalValue);

    // Diversification score (simplified)
    const diversificationScore = this.calculateDiversificationScore(assets);

    return {
      byAssetType,
      byCurrency,
      byRiskLevel,
      diversificationScore,
    };
  }

  private calculateTrendAnalytics(
    assets: Asset[],
    transactions: Transaction[]
  ): TrendAnalytics {
    // Simplified trend calculations
    const dailyReturns = this.calculateDailyReturns(transactions);
    const monthlyReturns = this.calculateMonthlyReturns(transactions);
    const yearlyReturns = this.calculateYearlyReturns(transactions);
    const volatility = this.calculateVolatility(assets);
    const beta = this.calculateBeta(assets);

    return {
      dailyReturns,
      monthlyReturns,
      yearlyReturns,
      volatility,
      beta,
    };
  }

  private calculateRiskMetrics(
    assets: Asset[],
    transactions: Transaction[]
  ): RiskMetrics {
    const portfolioRisk = this.calculatePortfolioRisk(assets);
    const valueAtRisk = this.calculateValueAtRisk(assets);
    const conditionalValueAtRisk = this.calculateConditionalValueAtRisk(assets);
    const concentrationRisk = this.calculateConcentrationRisk(assets);

    return {
      portfolioRisk,
      valueAtRisk,
      conditionalValueAtRisk,
      concentrationRisk,
    };
  }

  // Helper methods for calculations
  private getAssetTypeDisplayName(type: AssetType): string {
    switch (type) {
      case AssetType.STOCK:
        return 'Stocks';
      case AssetType.DEPOSIT:
        return 'Deposits';
      case AssetType.PRECIOUS_METAL:
        return 'Precious Metals';
      case AssetType.CASH:
        return 'Cash';
      case AssetType.CRYPTO:
        return 'Cryptocurrency';
      case AssetType.REAL_ESTATE:
        return 'Real Estate';
      case AssetType.BONDS:
        return 'Bonds';
      default:
        return 'Other';
    }
  }

  private calculateSharpeRatio(assets: Asset[]): number {
    // Simplified Sharpe ratio calculation
    const returns = assets.map(asset => asset.gainLossPercentage);
    const averageReturn = returns.length > 0 ? returns.reduce((sum, r) => sum + r, 0) / returns.length : 0;
    const volatility = this.calculateVolatility(assets);
    const riskFreeRate = 2; // Assume 2% risk-free rate
    
    return volatility > 0 ? (averageReturn - riskFreeRate) / volatility : 0;
  }

  private calculateMaxDrawdown(assets: Asset[]): number {
    // Simplified max drawdown calculation
    const returns = assets.map(asset => asset.gainLossPercentage);
    if (returns.length === 0) return 0;
    
    let maxDrawdown = 0;
    let peak = 0;
    
    for (const return_ of returns) {
      if (return_ > peak) {
        peak = return_;
      }
      const drawdown = (peak - return_) / peak * 100;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
    
    return maxDrawdown;
  }

  private calculateRiskLevelAllocation(assets: Asset[], totalValue: number): RiskLevelAllocation[] {
    const riskLevels: { [key: string]: { value: number; count: number } } = {
      low: { value: 0, count: 0 },
      medium: { value: 0, count: 0 },
      high: { value: 0, count: 0 },
    };

    assets.forEach(asset => {
      const riskLevel = this.getAssetRiskLevel(asset.type);
      riskLevels[riskLevel].value += asset.currentValue;
      riskLevels[riskLevel].count += 1;
    });

    return Object.entries(riskLevels).map(([level, data]) => ({
      riskLevel: level as 'low' | 'medium' | 'high',
      value: data.value,
      percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
      count: data.count,
    }));
  }

  private getAssetRiskLevel(type: AssetType): 'low' | 'medium' | 'high' {
    switch (type) {
      case AssetType.CASH:
      case AssetType.DEPOSIT:
        return 'low';
      case AssetType.BONDS:
      case AssetType.PRECIOUS_METAL:
        return 'medium';
      case AssetType.STOCK:
      case AssetType.CRYPTO:
      case AssetType.REAL_ESTATE:
        return 'high';
      default:
        return 'medium';
    }
  }

  private calculateDiversificationScore(assets: Asset[]): number {
    // Simplified diversification score based on asset type diversity
    const assetTypes = new Set(assets.map(asset => asset.type));
    const maxTypes = Object.keys(AssetType).length;
    return (assetTypes.size / maxTypes) * 100;
  }

  private calculateDailyReturns(transactions: Transaction[]): DailyReturn[] {
    // Simplified daily returns calculation
    return [];
  }

  private calculateMonthlyReturns(transactions: Transaction[]): MonthlyReturn[] {
    // Simplified monthly returns calculation
    return [];
  }

  private calculateYearlyReturns(transactions: Transaction[]): YearlyReturn[] {
    // Simplified yearly returns calculation
    return [];
  }

  private calculateVolatility(assets: Asset[]): number {
    const returns = assets.map(asset => asset.gainLossPercentage);
    if (returns.length === 0) return 0;
    
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }

  private calculateBeta(assets: Asset[]): number {
    // Simplified beta calculation (assume market beta of 1.0)
    return 1.0;
  }

  private calculatePortfolioRisk(assets: Asset[]): number {
    return this.calculateVolatility(assets);
  }

  private calculateValueAtRisk(assets: Asset[]): number {
    // Simplified VaR calculation at 95% confidence level
    const returns = assets.map(asset => asset.gainLossPercentage);
    if (returns.length === 0) return 0;
    
    returns.sort((a, b) => a - b);
    const varIndex = Math.floor(returns.length * 0.05);
    return returns[varIndex] || 0;
  }

  private calculateConditionalValueAtRisk(assets: Asset[]): number {
    // Simplified CVaR calculation
    const var95 = this.calculateValueAtRisk(assets);
    const returns = assets.map(asset => asset.gainLossPercentage);
    const tailReturns = returns.filter(r => r <= var95);
    
    return tailReturns.length > 0 
      ? tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length 
      : 0;
  }

  private calculateConcentrationRisk(assets: Asset[]): number {
    // Simplified concentration risk using Herfindahl index
    const totalValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
    if (totalValue === 0) return 0;
    
    const herfindahlIndex = assets.reduce((sum, asset) => {
      const weight = asset.currentValue / totalValue;
      return sum + Math.pow(weight, 2);
    }, 0);
    
    return herfindahlIndex * 100;
  }
} 