const API_BASE_URL = (window as any).API_URL || 'http://localhost:3001/api'

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
  type: string;
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
  date: string;
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

export class AnalyticsApi {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/analytics`;
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async getPortfolioAnalytics(): Promise<PortfolioAnalytics> {
    const response = await fetch(`${this.baseUrl}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch portfolio analytics: ${response.statusText}`);
    }

    return await response.json();
  }
}

export const analyticsApi = new AnalyticsApi(); 