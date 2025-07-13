const API_BASE_URL = (window as any).API_URL || 'http://localhost:3001/api'

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
  type: string;
  assetName: string;
  amount: number;
  currency: string;
  date: string;
  quantity?: number;
}

export interface PerformanceMetrics {
  totalInvestment: number;
  totalReturn: number;
  averageReturn: number;
  monthlyRecurringIncome: number;
  annualRecurringIncome: number;
}

class PortfolioApi {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token')
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  }

  async getPortfolioMetrics(): Promise<PortfolioMetrics> {
    const response = await fetch(`${API_BASE_URL}/portfolio/metrics`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch portfolio metrics: ${response.statusText}`)
    }

    return response.json()
  }

  async getPortfolioList(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/portfolio`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch portfolio list: ${response.statusText}`)
    }

    return response.json()
  }

  async createPortfolio(portfolioData: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/portfolio`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(portfolioData)
    })

    if (!response.ok) {
      throw new Error(`Failed to create portfolio: ${response.statusText}`)
    }

    return response.json()
  }
}

export const portfolioApi = new PortfolioApi() 