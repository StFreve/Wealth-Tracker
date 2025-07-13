import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portfolio } from './entities/portfolio.entity';
import { Asset, AssetType } from '../assets/entities/asset.entity';
import { Transaction, TransactionType } from '../assets/entities/transaction.entity';
import { CurrencyService } from '../market-data/currency.service';

export interface PortfolioMetrics {
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  monthlyChange: number;
  monthlyChangePercent: number;
  yearlyChange: number;
  yearlyChangePercent: number;
  assetCount: number;
  assetAllocation: AssetAllocation[];
  recentTransactions: RecentTransaction[];
  performanceMetrics: PerformanceMetrics;
}

export interface AssetAllocation {
  type: string;
  value: number;
  percentage: number;
  count: number;
}

export interface RecentTransaction {
  id: string;
  type: TransactionType;
  assetName: string;
  amount: number;
  currency: string;
  date: Date;
  quantity?: number;
}

export interface PerformanceMetrics {
  totalInvestment: number;
  totalReturn: number;
  averageReturn: number;
  monthlyRecurringIncome: number;
  annualRecurringIncome: number;
}

@Injectable()
export class PortfolioService {
  constructor(
    @InjectRepository(Portfolio)
    private portfolioRepository: Repository<Portfolio>,
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private currencyService: CurrencyService,
  ) {}

  async findAll(userId: string): Promise<Portfolio[]> {
    return this.portfolioRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(portfolioData: Partial<Portfolio>): Promise<Portfolio> {
    const portfolio = this.portfolioRepository.create(portfolioData);
    return this.portfolioRepository.save(portfolio);
  }

  async getPortfolioMetrics(userId: string): Promise<PortfolioMetrics> {
    const assets = await this.assetRepository.find({
      where: { userId, isActive: true },
      relations: ['transactions'],
      order: { createdAt: 'DESC' },
    });

    const transactions = await this.transactionRepository.find({
      where: { userId },
      relations: ['asset'],
      order: { transactionDate: 'DESC' },
      take: 10,
    });

    return this.calculatePortfolioMetrics(assets, transactions);
  }

  private async calculatePortfolioMetrics(assets: Asset[], transactions: Transaction[]): Promise<PortfolioMetrics> {
    const metrics: PortfolioMetrics = {
      totalValue: 0,
      totalGainLoss: 0,
      totalGainLossPercent: 0,
      monthlyChange: 0,
      monthlyChangePercent: 0,
      yearlyChange: 0,
      yearlyChangePercent: 0,
      assetCount: assets.length,
      assetAllocation: [],
      recentTransactions: [],
      performanceMetrics: {
        totalInvestment: 0,
        totalReturn: 0,
        averageReturn: 0,
        monthlyRecurringIncome: 0,
        annualRecurringIncome: 0,
      },
    };

    // Helper function to safely convert to number and avoid NaN
    const safeNumber = (value: any): number => {
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    };

    // Calculate enhanced asset values with proper calculations
    const enhancedAssets = assets.map(asset => this.enhanceAssetCalculations(asset));

    // Calculate total portfolio value and gains (convert to USD)
    for (const asset of enhancedAssets) {
      if (asset.type !== AssetType.RECURRING_INCOME) {
        // Use the getter methods to get calculated values
        const currentValue = asset.currentValue;
        const totalGainLoss = asset.totalGainLoss;
        const investment = this.getAssetInvestment(asset);
        

        
        // Convert to USD
        const currentValueUSD = await this.convertAssetValueToUSD(currentValue, asset.currency);
        const totalGainLossUSD = await this.convertAssetValueToUSD(totalGainLoss, asset.currency);
        const investmentUSD = await this.convertAssetValueToUSD(investment, asset.currency);
        
        metrics.totalValue += safeNumber(currentValueUSD);
        metrics.totalGainLoss += safeNumber(totalGainLossUSD);
        metrics.performanceMetrics.totalInvestment += safeNumber(investmentUSD);
      } else {
        // For recurring income, add to monthly income (convert to USD)
        const monthlyIncomeUSD = await this.convertAssetValueToUSD(this.getMonthlyRecurringIncome(asset), asset.currency);
        metrics.performanceMetrics.monthlyRecurringIncome += safeNumber(monthlyIncomeUSD);
      }
    }

    // Calculate percentages
    if (metrics.performanceMetrics.totalInvestment > 0) {
      metrics.totalGainLossPercent = safeNumber((metrics.totalGainLoss / metrics.performanceMetrics.totalInvestment) * 100);
    }

    // Calculate monthly and yearly changes
    metrics.monthlyChange = safeNumber(await this.calculateMonthlyChange(enhancedAssets));
    metrics.yearlyChange = safeNumber(await this.calculateYearlyChange(enhancedAssets));

    if (metrics.totalValue > 0) {
      metrics.monthlyChangePercent = safeNumber((metrics.monthlyChange / metrics.totalValue) * 100);
      metrics.yearlyChangePercent = safeNumber((metrics.yearlyChange / metrics.totalValue) * 100);
    }

    // Calculate asset allocation (with USD conversion)
    metrics.assetAllocation = await this.calculateAssetAllocation(enhancedAssets, metrics.totalValue);

    // Format recent transactions
    metrics.recentTransactions = transactions.map(t => ({
      id: t.id,
      type: t.type,
      assetName: t.asset?.name || 'Unknown',
      amount: t.totalAmount,
      currency: t.currency,
      date: t.transactionDate,
      quantity: t.quantity,
    }));

    // Calculate performance metrics
    metrics.performanceMetrics.totalReturn = metrics.totalGainLoss;
    metrics.performanceMetrics.averageReturn = metrics.monthlyChange;
    metrics.performanceMetrics.annualRecurringIncome = metrics.performanceMetrics.monthlyRecurringIncome * 12;



    // Create a new object to ensure no reference issues
    const result: PortfolioMetrics = {
      totalValue: metrics.totalValue,
      totalGainLoss: metrics.totalGainLoss,
      totalGainLossPercent: metrics.totalGainLossPercent,
      monthlyChange: metrics.monthlyChange,
      monthlyChangePercent: metrics.monthlyChangePercent,
      yearlyChange: metrics.yearlyChange,
      yearlyChangePercent: metrics.yearlyChangePercent,
      assetCount: metrics.assetCount,
      assetAllocation: metrics.assetAllocation,
      recentTransactions: metrics.recentTransactions,
      performanceMetrics: metrics.performanceMetrics,
    };

    // Debug logging to check the values being returned
    console.log('🔍 Portfolio Metrics Debug:', {
      totalValue: result.totalValue,
      totalGainLoss: result.totalGainLoss,
      monthlyChange: result.monthlyChange,
      assetCount: result.assetCount,
      assetsProcessed: enhancedAssets.length,
    });

    return result;
  }

  private async convertAssetValueToUSD(value: number, currency: string): Promise<number> {
    const safeNumber = (value: any): number => {
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    };

    if (!currency || currency === 'USD') {
      return safeNumber(value);
    }

    try {
      console.log(`🔄 Converting ${value} ${currency} to USD`);
      const convertedValue = await this.currencyService.convertCurrency(value, currency, 'USD');
      console.log(`✅ Converted ${value} ${currency} = ${convertedValue} USD`);
      return safeNumber(convertedValue);
    } catch (error) {
      console.error(`Failed to convert ${value} ${currency} to USD:`, error);
      return safeNumber(value); // Return original value if conversion fails
    }
  }

  private enhanceAssetCalculations(asset: Asset): Asset {
    // The Asset entity already has getter methods for currentValue, totalGainLoss, and gainLossPercentage
    // We don't need to enhance the asset object, just return it as is
    // The getters will calculate the values dynamically when accessed
    return asset;
  }

  private calculateDepositValue(asset: Asset): number {
    const safeNumber = (value: any): number => {
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    };

    const now = new Date();
    const startDate = asset.startDate || asset.createdAt;
    const daysDiff = Math.max(0, (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const yearsFraction = daysDiff / 365;
    
    const rate = safeNumber(asset.interestRate) / 100;
    const principal = safeNumber(asset.principal);
    
    if (principal === 0) return 0;
    
    // Simple compound interest calculation
    if (asset.compounding === 'compound') {
      const result = principal * Math.pow(1 + rate, yearsFraction);
      return safeNumber(result);
    } else {
      const result = principal * (1 + rate * yearsFraction);
      return safeNumber(result);
    }
  }

  private getAssetInvestment(asset: Asset): number {
    const safeNumber = (value: any): number => {
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    };

    switch (asset.type) {
      case AssetType.STOCK:
        return safeNumber(asset.purchasePrice) * safeNumber(asset.quantity);
      case AssetType.DEPOSIT:
        return safeNumber(asset.principal);
      case AssetType.PRECIOUS_METAL:
        return safeNumber(asset.acquisitionCost);
      case AssetType.CASH:
        return safeNumber(asset.acquisitionCost);
      default:
        return 0;
    }
  }

  private getMonthlyRecurringIncome(asset: Asset): number {
    if (asset.type !== AssetType.RECURRING_INCOME || !asset.amountPerPeriod) {
      return 0;
    }

    const safeNumber = (value: any): number => {
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    };

    const amount = safeNumber(asset.amountPerPeriod);
    const frequency = asset.frequency;

    let result = 0;
    switch (frequency) {
      case 'weekly':
        result = amount * 4.33; // Average weeks per month
        break;
      case 'biweekly':
        result = amount * 2.17; // Average bi-weeks per month
        break;
      case 'monthly':
        result = amount;
        break;
      case 'quarterly':
        result = amount / 3;
        break;
      case 'semiannual':
        result = amount / 6;
        break;
      case 'annual':
        result = amount / 12;
        break;
      default:
        result = amount;
    }

    return safeNumber(result);
  }

  private async calculateMonthlyChange(assets: Asset[]): Promise<number> {
    const safeNumber = (value: any): number => {
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    };

    let totalMonthlyChange = 0;

    for (const asset of assets) {
      if (asset.type === AssetType.RECURRING_INCOME) {
        const monthlyIncomeUSD = await this.convertAssetValueToUSD(
          this.getMonthlyRecurringIncome(asset), 
          asset.currency
        );
        totalMonthlyChange += safeNumber(monthlyIncomeUSD);
      } else if (asset.type === AssetType.DEPOSIT && asset.principal && asset.interestRate) {
        // Monthly interest for deposits (convert to USD)
        const principal = safeNumber(asset.principal);
        const interestRate = safeNumber(asset.interestRate);
        const monthlyRate = interestRate / 100 / 12;
        const monthlyInterest = principal * monthlyRate;
        const monthlyInterestUSD = await this.convertAssetValueToUSD(monthlyInterest, asset.currency);
        totalMonthlyChange += safeNumber(monthlyInterestUSD);
      } else {
        // Estimate monthly change based on current gain and time held
        const purchaseDate = asset.purchaseDate || asset.createdAt;
        const monthsHeld = Math.max(
          (new Date().getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30),
          1
        );
        const totalGainLoss = safeNumber(asset.totalGainLoss);
        // Convert to USD before calculating monthly change
        const totalGainLossUSD = await this.convertAssetValueToUSD(totalGainLoss, asset.currency);
        totalMonthlyChange += safeNumber(totalGainLossUSD / monthsHeld);
      }
    }

    return safeNumber(totalMonthlyChange);
  }

  private async calculateYearlyChange(assets: Asset[]): Promise<number> {
    const safeNumber = (value: any): number => {
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    };

    let totalYearlyChange = 0;

    for (const asset of assets) {
      if (asset.type === AssetType.RECURRING_INCOME) {
        const monthlyIncome = safeNumber(this.getMonthlyRecurringIncome(asset));
        const annualIncomeUSD = await this.convertAssetValueToUSD(monthlyIncome * 12, asset.currency);
        totalYearlyChange += safeNumber(annualIncomeUSD);
      } else if (asset.type === AssetType.DEPOSIT && asset.principal && asset.interestRate) {
        // Annual interest for deposits (convert to USD)
        const principal = safeNumber(asset.principal);
        const interestRate = safeNumber(asset.interestRate);
        const annualInterest = principal * (interestRate / 100);
        const annualInterestUSD = await this.convertAssetValueToUSD(annualInterest, asset.currency);
        totalYearlyChange += safeNumber(annualInterestUSD);
      } else {
        // Estimate yearly change based on current gain and time held
        const purchaseDate = asset.purchaseDate || asset.createdAt;
        const yearsHeld = Math.max(
          (new Date().getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365),
          1
        );
        const totalGainLoss = safeNumber(asset.totalGainLoss);
        // Convert to USD before calculating yearly change
        const totalGainLossUSD = await this.convertAssetValueToUSD(totalGainLoss, asset.currency);
        totalYearlyChange += safeNumber(totalGainLossUSD / yearsHeld);
      }
    }

    return safeNumber(totalYearlyChange);
  }

  private async calculateAssetAllocation(assets: Asset[], totalValue: number): Promise<AssetAllocation[]> {
    const allocation = new Map<string, { value: number; count: number }>();

    for (const asset of assets) {
      if (asset.type === AssetType.RECURRING_INCOME) continue; // Skip recurring income for allocation

      const typeKey = this.getAssetTypeDisplayName(asset.type);
      const current = allocation.get(typeKey) || { value: 0, count: 0 };
      
      // Convert asset value to USD for allocation
      const currentValueUSD = await this.convertAssetValueToUSD(asset.currentValue, asset.currency);
      
      current.value += currentValueUSD;
      current.count += 1;
      allocation.set(typeKey, current);
    }

    return Array.from(allocation.entries()).map(([type, data]) => ({
      type,
      value: data.value,
      percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
      count: data.count,
    }));
  }

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
} 