const API_BASE_URL = (window as any).API_URL || 'http://localhost:3001/api'

export interface Asset {
  id: string
  type: string
  name: string
  symbol?: string
  ticker?: string
  quantity?: number
  purchasePrice?: number
  currentPrice?: number
  purchaseDate?: string
  currency: string
  value?: number
  gain?: number
  gainPercent?: number
  
  // Stock-specific
  dividendYield?: number
  dividendTax?: number
  capitalGainsTax?: number
  
  // Deposit-specific
  principal?: number
  interestRate?: number
  rate?: number
  taxRate?: number
  startDate?: string
  endDate?: string
  maturityDate?: string
  compounding?: string
  compoundingFrequency?: string
  interestSchedule?: string
  interestType?: string
  progressiveRates?: any
  variableRates?: any
  tieredRates?: any
  accruedInterest?: number
  daysElapsed?: number
  status?: string
  isMatured?: boolean
  projectedMaturityValue?: number
  
  // Precious metal-specific
  metalType?: string
  weight?: number
  unit?: string
  purity?: number
  acquisitionCost?: number
  
  // Recurring income-specific
  sourceName?: string
  amountPerPeriod?: number
  monthlyAmount?: number
  frequency?: string
  inflationAdjustment?: number
  
  // Metadata
  metadata?: Record<string, any>
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
  userId?: string
  date?: string
  priceSource?: string
}

export interface CreateAssetDto {
  type: string
  name: string
  symbol?: string
  ticker?: string
  quantity?: number
  purchasePrice?: number
  currentPrice?: number
  purchaseDate?: string
  currency: string
  
  // Stock-specific
  dividendYield?: number
  dividendTax?: number
  capitalGainsTax?: number
  
  // Deposit-specific
  principal?: number
  interestRate?: number
  rate?: number
  taxRate?: number
  startDate?: string
  endDate?: string
  maturityDate?: string
  compounding?: string
  compoundingFrequency?: string
  interestSchedule?: string
  interestType?: string
  progressiveRates?: any
  variableRates?: any
  tieredRates?: any
  
  // Precious metal-specific
  metalType?: string
  weight?: number
  unit?: string
  purity?: number
  acquisitionCost?: number
  
  // Recurring income-specific
  sourceName?: string
  amountPerPeriod?: number
  monthlyAmount?: number
  frequency?: string
  inflationAdjustment?: number
  
  // Metadata
  metadata?: Record<string, any>
}

export interface UpdateAssetDto extends Partial<CreateAssetDto> {}

export interface PortfolioSummary {
  totalValue: number
  totalGain: number
  totalGainPercent: number
  assetCount: number
  assetTypes: Record<string, number>
  currencies: Record<string, number>
}

class AssetsApi {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token')
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      const error = await response.text()
      throw new Error(error || `HTTP error! status: ${response.status}`)
    }
    return response.json()
  }

  async getAllAssets(): Promise<Asset[]> {
    const response = await fetch(`${API_BASE_URL}/assets`, {
      headers: this.getAuthHeaders()
    })
    return this.handleResponse(response)
  }

  async getAsset(id: string): Promise<Asset> {
    const response = await fetch(`${API_BASE_URL}/assets/${id}`, {
      headers: this.getAuthHeaders()
    })
    return this.handleResponse(response)
  }

  async createAsset(asset: CreateAssetDto): Promise<Asset> {
    const response = await fetch(`${API_BASE_URL}/assets`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(asset)
    })
    return this.handleResponse(response)
  }

  async updateAsset(id: string, asset: UpdateAssetDto): Promise<Asset> {
    const response = await fetch(`${API_BASE_URL}/assets/${id}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(asset)
    })
    return this.handleResponse(response)
  }

  async deleteAsset(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/assets/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    })
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(error || `HTTP error! status: ${response.status}`)
    }
  }

  async getPortfolioSummary(): Promise<PortfolioSummary> {
    const response = await fetch(`${API_BASE_URL}/assets/portfolio-summary`, {
      headers: this.getAuthHeaders()
    })
    return this.handleResponse(response)
  }

  async createTransaction(assetId: string, transaction: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/assets/${assetId}/transactions`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(transaction)
    })
    return this.handleResponse(response)
  }
}

export const assetsApi = new AssetsApi() 