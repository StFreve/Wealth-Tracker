import { TaxSettings } from './api/usersApi'

export interface TaxCalculationResult {
  grossProfit: number
  taxAmount: number
  netProfit: number
  taxRate: number
}

/**
 * Calculate after-tax profit for an asset
 */
export function calculateAfterTaxProfit(
  assetType: string,
  profitType: 'capital_gains' | 'dividend' | 'interest' | 'rental_income',
  grossProfit: number,
  taxSettings?: TaxSettings
): TaxCalculationResult {
  // If no tax settings or gross profit is 0 or negative, return as-is
  if (!taxSettings || grossProfit <= 0) {
    return {
      grossProfit,
      taxAmount: 0,
      netProfit: grossProfit,
      taxRate: 0
    }
  }

  let taxRate = 0

  // Map asset types to tax settings
  switch (assetType) {
    case 'stock':
      if (profitType === 'capital_gains') {
        taxRate = taxSettings.stock?.capitalGainsTax || 0
      } else if (profitType === 'dividend') {
        taxRate = taxSettings.stock?.dividendTax || 0
      }
      break
    case 'deposit':
      if (profitType === 'interest') {
        taxRate = taxSettings.deposit?.interestTax || 0
      }
      break
    case 'preciousMetal':
      if (profitType === 'capital_gains') {
        taxRate = taxSettings.preciousMetal?.capitalGainsTax || 0
      }
      break
    case 'recurringIncome':
      taxRate = taxSettings.recurringIncome?.incomeTax || 0
      break
    case 'crypto':
      if (profitType === 'capital_gains') {
        taxRate = taxSettings.crypto?.capitalGainsTax || 0
      }
      break
    case 'realEstate':
      if (profitType === 'capital_gains') {
        taxRate = taxSettings.realEstate?.capitalGainsTax || 0
      } else if (profitType === 'rental_income') {
        taxRate = taxSettings.realEstate?.rentalIncomeTax || 0
      }
      break
    case 'bonds':
      if (profitType === 'capital_gains') {
        taxRate = taxSettings.bonds?.capitalGainsTax || 0
      } else if (profitType === 'interest') {
        taxRate = taxSettings.bonds?.interestTax || 0
      }
      break
    case 'cash':
      if (profitType === 'interest') {
        taxRate = taxSettings.cash?.interestTax || 0
      }
      break
    default:
      // For unknown asset types, apply no tax
      taxRate = 0
  }

  // Calculate tax amount and net profit
  const taxAmount = (grossProfit * taxRate) / 100
  const netProfit = grossProfit - taxAmount

  return {
    grossProfit,
    taxAmount,
    netProfit,
    taxRate
  }
}

/**
 * Calculate after-tax profit for deposits based on accrued interest
 */
export function calculateDepositAfterTaxProfit(
  accruedInterest: number,
  taxSettings?: TaxSettings
): TaxCalculationResult {
  return calculateAfterTaxProfit('deposit', 'interest', accruedInterest, taxSettings)
}

/**
 * Calculate after-tax profit for stocks based on capital gains
 */
export function calculateStockAfterTaxProfit(
  capitalGains: number,
  taxSettings?: TaxSettings
): TaxCalculationResult {
  return calculateAfterTaxProfit('stock', 'capital_gains', capitalGains, taxSettings)
}

/**
 * Calculate after-tax dividend income
 */
export function calculateDividendAfterTaxProfit(
  dividendAmount: number,
  taxSettings?: TaxSettings
): TaxCalculationResult {
  return calculateAfterTaxProfit('stock', 'dividend', dividendAmount, taxSettings)
}

/**
 * Calculate after-tax profit for precious metals
 */
export function calculatePreciousMetalAfterTaxProfit(
  capitalGains: number,
  taxSettings?: TaxSettings
): TaxCalculationResult {
  return calculateAfterTaxProfit('preciousMetal', 'capital_gains', capitalGains, taxSettings)
}

/**
 * Calculate after-tax profit for recurring income
 */
export function calculateRecurringIncomeAfterTaxProfit(
  incomeAmount: number,
  taxSettings?: TaxSettings
): TaxCalculationResult {
  return calculateAfterTaxProfit('recurringIncome', 'capital_gains', incomeAmount, taxSettings)
} 