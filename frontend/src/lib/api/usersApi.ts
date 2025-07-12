const API_BASE_URL = (window as any).API_URL || 'http://localhost:3001/api'

export interface TaxSettings {
  stock?: {
    capitalGainsTax?: number;
    dividendTax?: number;
  };
  deposit?: {
    interestTax?: number;
  };
  preciousMetal?: {
    capitalGainsTax?: number;
  };
  recurringIncome?: {
    incomeTax?: number;
  };
  crypto?: {
    capitalGainsTax?: number;
  };
  realEstate?: {
    capitalGainsTax?: number;
    rentalIncomeTax?: number;
  };
  bonds?: {
    interestTax?: number;
    capitalGainsTax?: number;
  };
  cash?: {
    interestTax?: number;
  };
}

export interface UpdatePreferencesDto {
  language?: string;
  currency?: string;
  theme?: string;
  timezone?: string;
  dateFormat?: string;
  numberFormat?: string;
  taxSettings?: TaxSettings;
}

class UsersAPI {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token')
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    }
  }

  async updatePreferences(preferences: UpdatePreferencesDto): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/users/preferences`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(preferences)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Failed to update preferences')
    }

    return response.json()
  }

  async getProfile(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Failed to get profile')
    }

    return response.json()
  }
}

export const usersApi = new UsersAPI() 