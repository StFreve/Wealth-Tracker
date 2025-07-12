import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AddAssetModal } from '@/components/AddAssetModal'
import { EditAssetModal } from '@/components/EditAssetModal'
import { CurrencyStatus } from '@/components/CurrencyStatus'
import { CURRENCIES } from '@/lib/currency'
import { useBackendCurrencyRates } from '@/hooks/useBackendCurrencyRates'
import { useBackendStockPrice } from '@/hooks/useBackendStockPrice'
import { useAuth } from '@/contexts/AuthContext'
import { assetsApi, Asset } from '@/lib/api/assetsApi'
import { 
  Plus, 
  Edit, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  Clock,
  Calendar,
  DollarSign,
  Info,
  AlertCircle,
  Settings,
  ChevronDown,
  ChevronRight,
  Copy
} from 'lucide-react'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { calculateDepositValue, formatDepositDuration, getDepositStatus, getInterestTypeInfo } from '@/lib/depositCalculations'
import { calculateAfterTaxProfit } from '@/lib/taxCalculations'
import { usersApi, TaxSettings } from '@/lib/api/usersApi'

// Backend currency functions
const formatCurrencyWithSymbol = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

const convertAssetValues = async (assets: any[], targetCurrency: string = 'USD', convertAmount: (amount: number, from: string, to: string) => Promise<number>) => {
  const results: any[] = []
  
  for (const asset of assets) {
    try {
      const assetCurrency = asset.currency || 'USD'
      const assetValue = asset.value || 0
      
      let convertedValue = assetValue
      let convertedPrincipal = asset.principal || 0
      let convertedAccruedInterest = asset.accruedInterest || 0
      let convertedGain = asset.gain || 0
      
      // Handle recurring income specific fields
      let convertedAmountPerPeriod = parseFloat(String(asset.amountPerPeriod || asset.originalAmountPerPeriod || 0))
      let convertedMonthlyEquivalent = parseFloat(String(asset.monthlyEquivalent || asset.originalMonthlyEquivalent || 0))
      
      if (assetCurrency !== targetCurrency) {
        // Only convert non-zero amounts to avoid API errors
        if (assetValue > 0) {
          convertedValue = await convertAmount(assetValue, assetCurrency, targetCurrency)
        }
        if (asset.principal && asset.principal > 0) {
          convertedPrincipal = await convertAmount(asset.principal, assetCurrency, targetCurrency)
        }
        if (asset.accruedInterest && asset.accruedInterest > 0) {
          convertedAccruedInterest = await convertAmount(asset.accruedInterest, assetCurrency, targetCurrency)
        }
        if (asset.gain && asset.gain !== 0) {
          convertedGain = await convertAmount(Math.abs(asset.gain), assetCurrency, targetCurrency)
          // Preserve the sign of the original gain
          convertedGain = asset.gain < 0 ? -convertedGain : convertedGain
        }
        
        // Convert recurring income specific fields
        if (asset.type === 'recurringIncome' || asset.type === 'recurring_income') {
          const originalAmountPerPeriod = parseFloat(String(asset.originalAmountPerPeriod || asset.amountPerPeriod || 0))
          const originalMonthlyEquivalent = parseFloat(String(asset.originalMonthlyEquivalent || asset.monthlyEquivalent || 0))
          
          if (originalAmountPerPeriod > 0) {
            convertedAmountPerPeriod = await convertAmount(originalAmountPerPeriod, assetCurrency, targetCurrency)
          }
          if (originalMonthlyEquivalent > 0) {
            convertedMonthlyEquivalent = await convertAmount(originalMonthlyEquivalent, assetCurrency, targetCurrency)
          }
        }
      }
      
      results.push({
        ...asset,
        convertedValue,
        principal: convertedPrincipal,
        accruedInterest: convertedAccruedInterest,
        gain: convertedGain,
        amountPerPeriod: convertedAmountPerPeriod,
        monthlyEquivalent: convertedMonthlyEquivalent,
        originalValue: assetValue,
        originalPrincipal: asset.principal || 0,
        originalGain: asset.gain || 0,
        originalAmountPerPeriod: parseFloat(String(asset.originalAmountPerPeriod || asset.amountPerPeriod || 0)),
        originalMonthlyEquivalent: parseFloat(String(asset.originalMonthlyEquivalent || asset.monthlyEquivalent || 0)),
        originalCurrency: assetCurrency,
        targetCurrency
      })
    } catch (error) {
      console.error('Failed to convert asset:', error)
      results.push({
        ...asset,
        convertedValue: asset.value || 0,
        amountPerPeriod: parseFloat(String(asset.amountPerPeriod || 0)),
        monthlyEquivalent: parseFloat(String(asset.monthlyEquivalent || 0)),
        originalValue: asset.value || 0,
        originalPrincipal: asset.principal || 0,
        originalGain: asset.gain || 0,
        originalAmountPerPeriod: parseFloat(String(asset.amountPerPeriod || 0)),
        originalMonthlyEquivalent: parseFloat(String(asset.monthlyEquivalent || 0)),
        originalCurrency: asset.currency || 'USD',
        targetCurrency
      })
    }
  }
  
  return results
}

// Currency Tooltip Component
interface CurrencyTooltipProps {
  children: React.ReactNode
  originalAmount: number
  originalCurrency: string
  convertedAmount: number
  convertedCurrency: string
  exchangeRate?: number
}

function CurrencyTooltip({ children, originalAmount, originalCurrency, convertedAmount, convertedCurrency, exchangeRate }: CurrencyTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  
  if (originalCurrency === convertedCurrency) {
    return <>{children}</>
  }

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      {showTooltip && (
        <div className="absolute z-10 px-3 py-2 text-sm bg-black text-white rounded-lg shadow-lg -top-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          <div className="text-center">
            <div>Original: {formatCurrencyWithSymbol(originalAmount, originalCurrency)}</div>
            {exchangeRate && (
              <div className="text-xs opacity-75">
                1 {originalCurrency} = {exchangeRate.toFixed(4)} {convertedCurrency}
              </div>
            )}
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
        </div>
      )}
    </div>
  )
}

// Stock Price Display Component
interface StockPriceDisplayProps {
  ticker: string
  quantity: number
  displayCurrency: string
}

function StockPriceDisplay({ ticker, quantity, displayCurrency }: StockPriceDisplayProps) {
  const { stockPrice, isLoading, error } = useBackendStockPrice(ticker)
  
  if (isLoading) {
    return (
      <div className="flex justify-between">
        <span className="text-sm text-muted-foreground">Market Price</span>
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    )
  }
  
  if (error || !stockPrice) {
    return (
      <div className="flex justify-between">
        <span className="text-sm text-muted-foreground">Market Price</span>
        <span className="text-sm text-muted-foreground">N/A</span>
      </div>
    )
  }
  
  const changeColor = stockPrice.change >= 0 ? 'text-green-600' : 'text-red-600'

  return (
    <>
      <div className="flex justify-between">
        <span className="text-sm text-muted-foreground">Market Price</span>
        <div className="text-right">
          <div className="text-sm text-foreground font-medium">
            ${stockPrice.price.toFixed(2)}
          </div>
          <div className={`text-xs ${changeColor}`}>
            {stockPrice.change >= 0 ? '+' : ''}${stockPrice.change.toFixed(2)} ({stockPrice.changePercent.toFixed(2)}%)
          </div>
        </div>
      </div>
      <div className="flex justify-between">
        <span className="text-sm text-muted-foreground">Total Value</span>
        <span className="text-sm text-foreground font-medium">
          ${(stockPrice.price * quantity).toFixed(2)}
        </span>
      </div>
    </>
  )
}

// Enhanced Asset Card Component
interface AssetCardProps {
  asset: any
  displayCurrency: string
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onCopy: (asset: any) => void
  t: any
  formatCurrencyWithSymbol: (amount: number, currency: string) => string
  getDisplayValue: (asset: any) => number
  getDisplayGain: (asset: any) => number
  formatPercentage: (value: number) => string
  getInterestTypeInfo: (type: string) => any
  formatDepositDuration: (duration: any) => string
}

function AssetCard({ 
  asset, 
  displayCurrency, 
  onEdit, 
  onDelete, 
  onCopy,
  t, 
  formatCurrencyWithSymbol, 
  getDisplayValue, 
  getDisplayGain, 
  formatPercentage, 
  getInterestTypeInfo, 
  formatDepositDuration 
}: AssetCardProps) {
  const { user } = useAuth()
  const assetAny = asset as any
  
  // Calculate after-tax profit
  const grossProfit = getDisplayGain(asset) // Already converted gain
  
  // Get original gain for tax calculation
  const originalGain = assetAny.originalGain || assetAny.gain || grossProfit
  
  // Calculate tax on original gain, then convert to display currency
  const originalTaxCalculation = calculateAfterTaxProfit(
    asset.type,
    asset.type === 'deposit' ? 'interest' : 'capital_gains',
    originalGain,
    user?.preferences?.taxSettings
  )
  
  // If currency conversion was applied, convert tax amounts
  let taxCalculation
  if (assetAny.originalCurrency && assetAny.originalCurrency !== displayCurrency && originalGain !== 0) {
    // Tax was calculated on original amount, so convert the tax and net amounts
    const conversionRatio = grossProfit / originalGain
    taxCalculation = {
      grossProfit: grossProfit,
      taxAmount: originalTaxCalculation.taxAmount * Math.abs(conversionRatio),
      netProfit: originalTaxCalculation.netProfit * conversionRatio,
      taxRate: originalTaxCalculation.taxRate
    }
  } else {
    // No conversion needed
    taxCalculation = {
      grossProfit: grossProfit,
      taxAmount: originalTaxCalculation.taxAmount,
      netProfit: originalTaxCalculation.netProfit,
      taxRate: originalTaxCalculation.taxRate
    }
  }
  
  return (
    <Card className="asset-card">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-foreground">
                    {asset.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {asset.type === 'stock' ? asset.ticker : t(`assets.${asset.type}`)}
              {assetAny.originalCurrency && assetAny.originalCurrency !== displayCurrency && (
                <span className="ml-2 text-xs bg-secondary px-1 rounded">
                  from {assetAny.originalCurrency}
                </span>
              )}
                  </p>
                </div>
                <div className="flex space-x-1">
            <Button variant="ghost" size="sm" onClick={() => onEdit(asset.id)} title={t('common.edit')}>
                    <Edit className="h-4 w-4" />
                  </Button>
            <Button variant="ghost" size="sm" onClick={() => onCopy(asset)} title={t('common.copy')}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(asset.id)} title={t('common.delete')}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    {asset.type === 'deposit' ? t('assets.accountBalance') : 
                     asset.type === 'recurringIncome' ? 'Annual Income Value' : 
                     t('assets.marketValue')}
                  </span>
                  <CurrencyTooltip
                    originalAmount={assetAny.originalValue || getDisplayValue(asset)}
                    originalCurrency={assetAny.originalCurrency || asset.currency || displayCurrency}
                    convertedAmount={getDisplayValue(asset)}
                    convertedCurrency={displayCurrency}
                    exchangeRate={assetAny.originalCurrency !== displayCurrency ? getDisplayValue(asset) / (assetAny.originalValue || getDisplayValue(asset)) : undefined}
                  >
                    <span className="font-medium text-foreground">
                      {formatCurrencyWithSymbol(getDisplayValue(asset), displayCurrency)}
                    </span>
                  </CurrencyTooltip>
                </div>

                {asset.type === 'stock' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        {t('assets.quantity')}
                      </span>
                      <span className="text-sm text-foreground">
                        {asset.quantity} shares
                      </span>
                    </div>
              <StockPriceDisplay 
                ticker={asset.ticker} 
                quantity={asset.quantity} 
                displayCurrency={displayCurrency}
              />
            </>
          )}

          {asset.type === 'deposit' && (
            <>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Principal
                </span>
                <CurrencyTooltip
                  originalAmount={assetAny.originalValue || (asset.principal || 0)}
                  originalCurrency={assetAny.originalCurrency || asset.currency || displayCurrency}
                  convertedAmount={asset.principal || 0}
                  convertedCurrency={displayCurrency}
                >
                  <span className="text-sm text-foreground">
                    {formatCurrencyWithSymbol(asset.principal || 0, displayCurrency)}
                  </span>
                </CurrencyTooltip>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Interest Rate
                </span>
                <span className="text-sm text-foreground">
                  {(asset.rate || asset.interestRate || 0).toFixed(2)}% per year
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                  Interest Type
                </span>
                <span className="text-sm text-foreground font-medium">
                  {getInterestTypeInfo(asset.interestType || asset.compounding || 'compound').name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Duration
                      </span>
                      <span className="text-sm text-foreground">
                  {asset.startDate ? formatDepositDuration({
                    daysElapsed: asset.daysElapsed || 0,
                    monthsElapsed: Math.floor((asset.daysElapsed || 0) / 30),
                    yearsElapsed: (asset.daysElapsed || 0) / 365,
                    currentValue: 0,
                    accruedInterest: 0,
                    isMatured: asset.isMatured || false
                  }) : '0 days'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Interest Earned
                </span>
                <CurrencyTooltip
                  originalAmount={assetAny.originalAccruedInterest || (asset.accruedInterest || 0)}
                  originalCurrency={assetAny.originalCurrency || asset.currency || displayCurrency}
                  convertedAmount={asset.accruedInterest || 0}
                  convertedCurrency={displayCurrency}
                >
                  <span className="text-sm text-green-600 font-medium">
                    +{formatCurrencyWithSymbol(asset.accruedInterest || 0, displayCurrency)}
                  </span>
                </CurrencyTooltip>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Status
                </span>
                <span className={`text-sm font-medium ${
                  asset.isMatured ? 'text-blue-600' : 'text-green-600'
                }`}>
                  {asset.status || 'Active'}
                      </span>
                    </div>
              {(asset.maturityDate || asset.endDate) && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Maturity Date
                  </span>
                  <span className="text-sm text-foreground">
                    {new Date(asset.maturityDate || asset.endDate).toLocaleDateString()}
                  </span>
                </div>
              )}
                  </>
                )}

            {asset.type === 'recurringIncome' && (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Amount per Period
                  </span>
                  <CurrencyTooltip
                    originalAmount={assetAny.originalAmountPerPeriod || (asset.amountPerPeriod || 0)}
                    originalCurrency={assetAny.originalCurrency || asset.currency || displayCurrency}
                    convertedAmount={asset.amountPerPeriod || 0}
                    convertedCurrency={displayCurrency}
                  >
                    <span className="text-sm text-foreground">
                      {formatCurrencyWithSymbol(asset.amountPerPeriod || 0, displayCurrency)}
                    </span>
                  </CurrencyTooltip>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Payment Frequency
                  </span>
                  <span className="text-sm text-foreground font-medium">
                    {t(`addAssetModal.${asset.frequency || 'monthly'}`)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Monthly Equivalent
                  </span>
                  <CurrencyTooltip
                    originalAmount={assetAny.originalMonthlyEquivalent || (asset.monthlyEquivalent || 0)}
                    originalCurrency={assetAny.originalCurrency || asset.currency || displayCurrency}
                    convertedAmount={asset.monthlyEquivalent || 0}
                    convertedCurrency={displayCurrency}
                  >
                    <span className="text-sm text-green-600 font-medium">
                      {formatCurrencyWithSymbol(asset.monthlyEquivalent || 0, displayCurrency)}
                    </span>
                  </CurrencyTooltip>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Annualized Value
                  </span>
                  <span className="text-sm text-foreground">
                    {formatCurrencyWithSymbol(getDisplayValue(asset), displayCurrency)}
                  </span>
                </div>
              </>
            )}

          {/* Gross Profit/Loss */}
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-sm text-muted-foreground">
                {asset.type === 'recurringIncome' ? 'Annual Income' : t('assets.grossProfitLoss')}
              </span>
              <div className="flex items-center space-x-1">
                <CurrencyTooltip
                  originalAmount={assetAny.originalGain || Math.abs(grossProfit)}
                  originalCurrency={assetAny.originalCurrency || asset.currency || displayCurrency}
                  convertedAmount={Math.abs(grossProfit)}
                  convertedCurrency={displayCurrency}
                >
                  <span className={`font-medium ${asset.type === 'recurringIncome' ? 'text-green-600' : grossProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {asset.type === 'recurringIncome' ? '+' : grossProfit >= 0 ? '+' : ''}
                    {formatCurrencyWithSymbol(Math.abs(grossProfit), displayCurrency)}
                  </span>
                </CurrencyTooltip>
                {asset.type !== 'recurringIncome' && (
                  <span className={`text-sm ${(asset.gainPercent || 0) >= 0 ? 'text-profit' : 'text-loss'}`}>
                    ({formatPercentage(Math.abs(asset.gainPercent || 0))})
                  </span>
                )}
              </div>
            </div>

            {/* Tax Information */}
            {taxCalculation.taxRate > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {t('assets.tax')} ({formatPercentage(taxCalculation.taxRate)})
                </span>
                <span className="font-medium text-loss">
                  -{formatCurrencyWithSymbol(taxCalculation.taxAmount, displayCurrency)}
                </span>
              </div>
            )}

            {/* Net Profit/Loss */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {asset.type === 'recurringIncome' ? 'Net Annual Income' : t('assets.netProfitLoss')}
              </span>
              <div className="flex items-center space-x-1">
                <span className={`font-medium ${asset.type === 'recurringIncome' ? 'text-green-600' : taxCalculation.netProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {asset.type === 'recurringIncome' ? '+' : taxCalculation.netProfit >= 0 ? '+' : ''}
                  {formatCurrencyWithSymbol(Math.abs(taxCalculation.netProfit), displayCurrency)}
                </span>
                {asset.type === 'recurringIncome' ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : taxCalculation.netProfit >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-profit" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-loss" />
                )}
              </div>
            </div>
              </div>
            </div>
          </Card>
  )
}

function Assets() {
  const { t } = useTranslation()
  const { isAuthenticated, user } = useAuth()
  const [assets, setAssets] = useState<Asset[]>([])
  const [convertedAssets, setConvertedAssets] = useState<Asset[]>([])
  const [displayCurrency, setDisplayCurrency] = useState('USD')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [copyingAsset, setCopyingAsset] = useState<Asset | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Tax settings state
  const [showTaxSettings, setShowTaxSettings] = useState(false)
  const [taxSettings, setTaxSettings] = useState<TaxSettings>({
    stock: {
      capitalGainsTax: 0,
      dividendTax: 0,
    },
    deposit: {
      interestTax: 0,
    },
    preciousMetal: {
      capitalGainsTax: 0,
    },
    recurringIncome: {
      incomeTax: 0,
    },
    crypto: {
      capitalGainsTax: 0,
    },
    realEstate: {
      capitalGainsTax: 0,
      rentalIncomeTax: 0,
    },
    bonds: {
      interestTax: 0,
      capitalGainsTax: 0,
    },
    cash: {
      interestTax: 0,
    },
  })
  
  // Use backend currency rates hook
  const { convertAmount } = useBackendCurrencyRates()

  // Load assets from backend
  const loadAssets = async () => {
    setIsLoading(true)
    try {
      const data = await assetsApi.getAllAssets()
      // Map backend asset types to frontend types
      const mappedAssets = data.map(asset => ({
        ...asset,
        type: mapAssetTypeFromBackend(asset.type)
      }))
      setAssets(mappedAssets)
      
      // Load user preferences to get tax settings
      if (user?.preferences?.taxSettings) {
        setTaxSettings(user.preferences.taxSettings)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assets')
      console.error('Failed to load assets:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTaxSettingChange = (assetType: keyof TaxSettings, taxType: string, value: number) => {
    setTaxSettings(prev => ({
      ...prev,
      [assetType]: {
        ...prev[assetType],
        [taxType]: value
      }
    }))
  }

  const handleTaxSettingsSave = async () => {
    try {
      await usersApi.updatePreferences({
        taxSettings
      })
      // Show success message or notification
    } catch (error) {
      console.error('Failed to save tax settings:', error)
      setError('Failed to save tax settings')
    }
  }

  const handleAddAsset = () => {
    setCopyingAsset(null)
    setShowAddModal(true)
  }

  // Helper functions for mapping frontend to backend format
  const mapAssetType = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'stock': 'stock',
      'deposit': 'deposit', 
      'preciousMetal': 'precious_metal',
      'recurringIncome': 'recurring_income',
      'cash': 'cash'
    }
    return typeMap[type] || type
  }

  const mapAssetTypeFromBackend = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'stock': 'stock',
      'deposit': 'deposit', 
      'precious_metal': 'preciousMetal',
      'recurring_income': 'recurringIncome',
      'cash': 'cash'
    }
    return typeMap[type] || type
  }

  // Map compounding frequency to backend enum
  const mapCompounding = (freq: string) => {
    switch (freq) {
      case 'annually': return 'annually'
      case 'quarterly': return 'quarterly'
      case 'monthly': return 'monthly'
      case 'daily': return 'daily'
      default: return freq
    }
  }

  const handleAddAssetSubmit = async (newAsset: any) => {
    try {
      setIsLoading(true)

      // Convert the frontend asset format to backend format
      const backendAsset: any = {
        type: mapAssetType(newAsset.type),
        name: newAsset.name,
        currency: newAsset.currency
      }

      // Add type-specific fields
      if (newAsset.type === 'stock') {
        if (newAsset.ticker) backendAsset.symbol = newAsset.ticker
        if (newAsset.quantity) backendAsset.quantity = newAsset.quantity
        if (newAsset.purchasePrice) backendAsset.purchasePrice = newAsset.purchasePrice
        if (newAsset.currentPrice) backendAsset.currentPrice = newAsset.currentPrice
      }

      if (newAsset.type === 'deposit') {
        if (newAsset.principal) backendAsset.principal = newAsset.principal
        if (newAsset.rate) backendAsset.interestRate = newAsset.rate
        if (newAsset.startDate) backendAsset.startDate = newAsset.startDate
        if (newAsset.maturityDate) backendAsset.endDate = newAsset.maturityDate
        if (newAsset.compoundingFrequency) backendAsset.interestSchedule = newAsset.compoundingFrequency.toLowerCase()
        if (newAsset.interestType) backendAsset.compounding = newAsset.interestType === 'compound' ? 'compound' : 'simple'
      }

      if (newAsset.type === 'preciousMetal') {
        if (newAsset.weight) backendAsset.weight = newAsset.weight
        if (newAsset.purity) backendAsset.purity = newAsset.purity
        if (newAsset.currentPrice) backendAsset.acquisitionCost = newAsset.currentPrice
        backendAsset.metalType = 'gold' // Default metal type
      }

      if (newAsset.type === 'recurringIncome') {
        if (newAsset.monthlyAmount) backendAsset.amountPerPeriod = newAsset.monthlyAmount
        if (newAsset.frequency) backendAsset.frequency = newAsset.frequency
      }

      if (newAsset.type === 'cash') {
        if (newAsset.value) backendAsset.acquisitionCost = newAsset.value
      }

      // Debug logging
      console.log('Frontend asset:', newAsset)
      console.log('Backend asset:', backendAsset)
      
      const createdAsset = await assetsApi.createAsset(backendAsset)
      setAssets(prev => [...prev, createdAsset])
      setShowAddModal(false)
      
      // Update converted assets
      const updatedAssets = [...assets, createdAsset]
      await updateDisplayCurrency(displayCurrency, updatedAssets)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create asset')
      console.error('Failed to create asset:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditAsset = (assetId: string) => {
    const asset = assets.find(a => a.id === assetId)
    if (asset) {
      setEditingAsset(asset)
      setShowEditModal(true)
    }
  }

  const handleCopyAsset = (asset: Asset) => {
    // Find the original asset from the assets array (not the converted one)
    // to ensure principal and other values are in their original currency
    const originalAsset = assets.find(a => a.id === asset.id) || asset
    setCopyingAsset(originalAsset)
    setShowAddModal(true)
  }

  const handleEditAssetSubmit = async (updatedAsset: Asset) => {
    try {
      setIsLoading(true)
      
      // Map frontend asset to backend format
      const mapAssetForBackend = (asset: Asset) => {
        const backendAsset: any = {
          type: mapAssetType(asset.type),
          name: asset.name,
          currency: asset.currency
        }

        // Map type-specific fields
        if (asset.type === 'stock') {
          if (asset.ticker) backendAsset.symbol = asset.ticker
          if (asset.quantity) backendAsset.quantity = asset.quantity
          if (asset.purchasePrice) backendAsset.purchasePrice = asset.purchasePrice
          if (asset.currentPrice) backendAsset.currentPrice = asset.currentPrice
        }

        if (asset.type === 'deposit') {
          if (asset.principal) backendAsset.principal = asset.principal
          if (asset.rate) backendAsset.interestRate = asset.rate
          if (asset.startDate) backendAsset.startDate = asset.startDate
          if (asset.maturityDate) backendAsset.endDate = asset.maturityDate
          
          // Debug logging
          console.log('Frontend deposit fields:', {
            compoundingFrequency: asset.compoundingFrequency,
            interestType: asset.interestType
          })
          
          if (asset.compoundingFrequency) {
            // Make sure compoundingFrequency is a valid frequency, not the interest type
            const validFrequencies = ['daily', 'monthly', 'quarterly', 'annually']
            const frequency = validFrequencies.includes(asset.compoundingFrequency.toLowerCase()) 
              ? asset.compoundingFrequency.toLowerCase() 
              : 'annually' // default fallback
            backendAsset.interestSchedule = frequency
            console.log('Mapped interestSchedule:', frequency)
          }
          
          if (asset.interestType) {
            const compoundingType = asset.interestType === 'compound' ? 'compound' : 'simple'
            backendAsset.compounding = compoundingType
            console.log('Mapped compounding:', compoundingType)
          }
        }

        if (asset.type === 'preciousMetal') {
          if (asset.weight) backendAsset.weight = asset.weight
          if (asset.purity) backendAsset.purity = asset.purity
          if (asset.currentPrice) backendAsset.acquisitionCost = asset.currentPrice
          backendAsset.metalType = 'gold' // Default metal type
        }

        if (asset.type === 'recurringIncome') {
          if (asset.monthlyAmount) backendAsset.amountPerPeriod = asset.monthlyAmount
          if (asset.frequency) backendAsset.frequency = asset.frequency
        }

        if (asset.type === 'cash') {
          if (asset.value) backendAsset.acquisitionCost = asset.value
        }

        console.log('Mapping asset for backend update:', { frontend: asset, backend: backendAsset })
        return backendAsset
      }

      const backendAsset = mapAssetForBackend(updatedAsset)
      const savedAsset = await assetsApi.updateAsset(updatedAsset.id, backendAsset)
      setAssets(prev => prev.map(asset => asset.id === savedAsset.id ? savedAsset : asset))
      setShowEditModal(false)
      setEditingAsset(null)
      
      // Update converted assets
      const updatedAssets = assets.map(asset => asset.id === savedAsset.id ? savedAsset : asset)
      await updateDisplayCurrency(displayCurrency, updatedAssets)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update asset')
      console.error('Failed to update asset:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAsset = async (assetId: string) => {
    if (!window.confirm(t('assets.confirmDelete'))) {
      return
    }
    
    try {
      setIsLoading(true)
      await assetsApi.deleteAsset(assetId)
      const updatedAssets = assets.filter(asset => asset.id !== assetId)
      setAssets(updatedAssets)
      await updateDisplayCurrency(displayCurrency, updatedAssets)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete asset')
      console.error('Failed to delete asset:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const updateDisplayCurrency = async (currency: string, assetsToConvert = assets) => {
    setIsConverting(true)
    try {
      // First, fetch live prices for all stock assets
      const stockAssets = assetsToConvert.filter(asset => asset.type === 'stock')
      const livePrices: { [symbol: string]: number } = {}
      
      // Fetch live prices for all stocks in parallel
      if (stockAssets.length > 0) {
        const pricePromises = stockAssets.map(async (asset) => {
          const symbol = asset.ticker || asset.symbol
          if (symbol) {
            try {
              const response = await fetch(`http://localhost:3001/api/market-data/stocks/${symbol}`, {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                  'Content-Type': 'application/json',
                }
              })
              if (response.ok) {
                const stockData = await response.json()
                return { symbol, price: stockData.price }
              }
            } catch (error) {
              console.warn(`Failed to fetch live price for ${symbol}:`, error)
            }
          }
          return null
        })
        
        const priceResults = await Promise.all(pricePromises)
        priceResults.forEach(result => {
          if (result) {
            livePrices[result.symbol] = result.price
          }
        })
      }

      // Update asset values with current calculations before conversion
      const updatedAssets = assetsToConvert.map(asset => {
        // Process stocks - calculate current value and gains using live prices when available
        if (asset.type === 'stock' && asset.quantity) {
          const quantity = parseFloat(asset.quantity?.toString() || '0')
          const purchasePrice = parseFloat(asset.purchasePrice?.toString() || '0')
          const symbol = asset.ticker || asset.symbol
          
          // Use live price if available, otherwise fall back to stored price
          const currentPrice = (symbol && livePrices[symbol]) || parseFloat(asset.currentPrice?.toString() || '0')
          
          if (quantity > 0 && currentPrice > 0) {
            const currentValue = currentPrice * quantity
            const purchaseCost = purchasePrice * quantity
            const gain = currentValue - purchaseCost
            const gainPercent = purchaseCost > 0 ? (gain / purchaseCost) * 100 : 0
            
            console.log('Processing stock with live price:', {
              name: asset.name,
              symbol: symbol,
              quantity,
              storedPrice: asset.currentPrice,
              livePrice: symbol ? livePrices[symbol] : undefined,
              currentPrice,
              purchasePrice,
              currentValue,
              gain,
              gainPercent
            })
            
            return {
              ...asset,
              ticker: asset.ticker || asset.symbol, // Map symbol to ticker for compatibility
              currentPrice: currentPrice, // Update with live price
              value: currentValue,
              gain: gain,
              gainPercent: gainPercent
            }
          }
        }
        
        // Process deposits - calculate current value with interest
        if (asset.type === 'deposit' && asset.startDate && asset.principal) {
          // Map backend field names to frontend expected names
          const principal = asset.principal || asset.purchasePrice || 0
          const rate = parseFloat(asset.rate?.toString() || asset.interestRate?.toString() || '0')
          const startDate = asset.startDate
          const maturityDate = asset.maturityDate || asset.endDate
          const compoundingFrequency = asset.compoundingFrequency || asset.interestSchedule || 'annually'
          const interestType = asset.interestType || asset.compounding || 'compound'
          
          console.log('Processing deposit:', {
            name: asset.name,
            principal,
            rate,
            startDate,
            maturityDate,
            compoundingFrequency,
            interestType
          })
          
          if (principal > 0 && rate > 0) {
            const depositInfo = {
              principal,
              rate,
              startDate,
              maturityDate,
              compoundingFrequency: (compoundingFrequency as 'daily' | 'monthly' | 'quarterly' | 'annually'),
              interestType: (interestType as 'simple' | 'compound' | 'progressive' | 'variable' | 'tiered'),
              progressiveRates: (asset as any).progressiveRates,
              variableRates: (asset as any).variableRates,
              tieredRates: (asset as any).tieredRates
            }
            const depositValue = calculateDepositValue(depositInfo)
            
            return {
              ...asset,
              // Add mapped fields for display
              rate,
              maturityDate,
              compoundingFrequency,
              interestType,
              // Add calculated values
              value: depositValue.currentValue,
              accruedInterest: depositValue.accruedInterest,
              daysElapsed: depositValue.daysElapsed,
              status: getDepositStatus(depositValue),
              isMatured: depositValue.isMatured,
              projectedMaturityValue: depositValue.projectedMaturityValue,
              gain: depositValue.accruedInterest,
              gainPercent: principal > 0 ? (depositValue.accruedInterest / principal) * 100 : 0
            }
          }
        }
        
        // Process recurring income - calculate monthly and annual values
        if (asset.type === 'recurringIncome') {
          const monthlyAmount = parseFloat(String(asset.monthlyAmount || asset.amountPerPeriod || 0))
          const frequency = asset.frequency || 'monthly'
          
          // Calculate monthly equivalent
          let monthlyEquivalent = monthlyAmount
          switch (frequency) {
            case 'weekly':
              monthlyEquivalent = monthlyAmount * 4.33
              break
            case 'biweekly':
              monthlyEquivalent = monthlyAmount * 2.17
              break
            case 'monthly':
              monthlyEquivalent = monthlyAmount
              break
            case 'quarterly':
              monthlyEquivalent = monthlyAmount / 3
              break
            case 'semiannually':
              monthlyEquivalent = monthlyAmount / 6
              break
            case 'annually':
              monthlyEquivalent = monthlyAmount / 12
              break
            default:
              monthlyEquivalent = monthlyAmount
          }
          
          // Calculate annual value
          const annualValue = monthlyEquivalent * 12
          
          console.log(`Processing recurring income ${asset.name}: monthlyAmount=${monthlyAmount}, frequency=${frequency}, monthlyEquivalent=${monthlyEquivalent}, annualValue=${annualValue}`)
          
          return {
            ...asset,
            value: annualValue,
            monthlyEquivalent,
            gain: annualValue, // Recurring income is pure gain
            gainPercent: 100, // 100% gain since it's all income
            // Store original amounts for currency conversion
            originalAmountPerPeriod: monthlyAmount,
            originalMonthlyEquivalent: monthlyEquivalent
          }
        }
        
        return asset
      })
      
      const converted = await convertAssetValues(updatedAssets, currency, convertAmount)
      setConvertedAssets(converted)
      setDisplayCurrency(currency)
    } catch (error) {
      console.error('Failed to convert currencies:', error)
      // Fallback to original values
      setConvertedAssets(assetsToConvert)
    } finally {
      setIsConverting(false)
    }
  }

  const handleCurrencyChange = (currency: string) => {
    updateDisplayCurrency(currency)
  }

  const refreshRates = () => {
    updateDisplayCurrency(displayCurrency)
  }

  // Initialize with USD conversion on mount and load assets
  useEffect(() => {
    loadAssets()
  }, [])

  // Load assets when component mounts
  useEffect(() => {
    if (assets.length > 0) {
      updateDisplayCurrency('USD')
    }
  }, [assets.length])

  const getTotalValue = () => {
    return convertedAssets
      .filter(asset => asset.type !== 'recurringIncome')
      .reduce((sum, asset) => {
        return sum + ((asset as any).convertedValue || asset.value || 0)
      }, 0)
  }

  const getTotalGain = () => {
    return convertedAssets
      .filter(asset => asset.type !== 'recurringIncome')
      .reduce((sum, asset) => {
        const assetAny = asset as any
        const gainValue = assetAny.convertedValue && assetAny.originalValue
          ? (asset.gain || 0) * (assetAny.convertedValue / assetAny.originalValue)
          : (asset.gain || 0)
        return sum + gainValue
      }, 0)
  }

  const getTotalNetGain = () => {
    return convertedAssets
      .filter(asset => asset.type !== 'recurringIncome')
      .reduce((sum, asset) => {
        const assetAny = asset as any
        
        // Calculate after-tax profit for this asset
        const grossProfit = getDisplayGain(asset) // Already converted gain
        
        // Get original gain for tax calculation
        const originalGain = assetAny.originalGain || assetAny.gain || grossProfit
        
        // Calculate tax on original gain, then convert to display currency
        const originalTaxCalculation = calculateAfterTaxProfit(
          asset.type,
          asset.type === 'deposit' ? 'interest' : 'capital_gains',
          originalGain,
          user?.preferences?.taxSettings
        )
        
        // If currency conversion was applied, convert tax amounts
        let taxCalculation
        if (assetAny.originalCurrency && assetAny.originalCurrency !== displayCurrency && originalGain !== 0) {
          // Tax was calculated on original amount, so convert the tax and net amounts
          const conversionRatio = grossProfit / originalGain
          taxCalculation = {
            grossProfit: grossProfit,
            taxAmount: originalTaxCalculation.taxAmount * Math.abs(conversionRatio),
            netProfit: originalTaxCalculation.netProfit * conversionRatio,
            taxRate: originalTaxCalculation.taxRate
          }
        } else {
          // No conversion needed
          taxCalculation = {
            grossProfit: grossProfit,
            taxAmount: originalTaxCalculation.taxAmount,
            netProfit: originalTaxCalculation.netProfit,
            taxRate: originalTaxCalculation.taxRate
          }
        }
        
        return sum + taxCalculation.netProfit
      }, 0)
  }

  const getLastMonthProfitLoss = () => {
    if (convertedAssets.length === 0) return 0
    
    console.log('🔍 Debug: Starting monthly profit calculation')
    console.log('📊 Total assets:', convertedAssets.length)
    
    let totalLastMonthProfit = 0
    
    convertedAssets.forEach(asset => {
      console.log('Processing asset:', asset.name, 'Type:', asset.type)
      
      const assetAny = asset as any
      const currentValue = getDisplayValue(asset)
      const currentGain = getDisplayGain(asset)
      
      // Calculate what the value would have been a month ago
      const dateString = asset.purchaseDate || asset.createdAt
      if (!dateString && asset.type !== 'recurringIncome') {
        console.log('⚠️ Asset without date:', asset.name)
        return
      }
      
      // For recurring income, we don't need purchase date - it's ongoing income
      let lastMonthProfit = 0
      
      if (asset.type === 'recurringIncome') {
        const assetAny = asset as any
        
        // Use the converted monthly equivalent if available, otherwise calculate from original values
        if (assetAny.monthlyEquivalent && !isNaN(assetAny.monthlyEquivalent)) {
          lastMonthProfit = assetAny.monthlyEquivalent
          console.log(`💰 Recurring Income ${asset.name}: Using converted monthly equivalent = ${lastMonthProfit}`)
        } else {
          // Calculate from original values
          const amount = parseFloat(String(assetAny.amountPerPeriod || assetAny.monthlyAmount || 0))
          const frequency = assetAny.frequency || 'monthly'
          
          switch (frequency) {
            case 'weekly':
              lastMonthProfit = amount * 4.33 // Average weeks per month
              break
            case 'biweekly':
              lastMonthProfit = amount * 2.17 // Average bi-weeks per month
              break
            case 'monthly':
              lastMonthProfit = amount
              break
            case 'quarterly':
              lastMonthProfit = amount / 3
              break
            case 'semiannually':
              lastMonthProfit = amount / 6
              break
            case 'annually':
              lastMonthProfit = amount / 12
              break
            default:
              lastMonthProfit = amount // Default to monthly
          }
          console.log(`💰 Recurring Income ${asset.name}: Calculated monthly equivalent = ${lastMonthProfit} from amount=${amount}, frequency=${frequency}`)
        }
        
        totalLastMonthProfit += lastMonthProfit
        console.log(`   Adding ${lastMonthProfit} to total. New total: ${totalLastMonthProfit}`)
        return // Early return for recurring income
      }
      
      const purchaseDate = new Date(dateString || new Date())
      const currentDate = new Date()
      const lastMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate())
      
      // Calculate months held now vs months held last month
      const monthsHeldNow = Math.max(
        (currentDate.getFullYear() - purchaseDate.getFullYear()) * 12 + 
        (currentDate.getMonth() - purchaseDate.getMonth()), 0
      )
      const monthsHeldLastMonth = Math.max(
        (lastMonthDate.getFullYear() - purchaseDate.getFullYear()) * 12 + 
        (lastMonthDate.getMonth() - purchaseDate.getMonth()), 0
      )
      
      if (asset.type === 'deposit') {
        // For deposits, calculate monthly interest earned
        const principal = asset.principal || asset.purchasePrice || 0
        const annualRate = (asset.interestRate || 0) / 100
        const monthlyRate = annualRate / 12
        lastMonthProfit = principal * monthlyRate
        console.log(`🏦 Deposit ${asset.name}: Monthly interest = ${lastMonthProfit}`)
      } else {
        // For other assets, calculate the profit change from last month
        if (monthsHeldNow > monthsHeldLastMonth) {
          // Asset was acquired this month, so last month profit is the gain divided by months held
          lastMonthProfit = currentGain / Math.max(monthsHeldNow, 1)
        } else if (monthsHeldNow > 0) {
          // Estimate last month's profit as 1/12 of annualized gain
          const annualizedGain = currentGain * (12 / monthsHeldNow)
          lastMonthProfit = annualizedGain / 12
        }
        console.log(`📈 Asset ${asset.name}: Last month profit = ${lastMonthProfit}`)
      }
      
      totalLastMonthProfit += lastMonthProfit
      console.log(`   Adding ${lastMonthProfit} to total. New total: ${totalLastMonthProfit}`)
    })
    
    console.log('💰 Final total last month profit:', totalLastMonthProfit)
    return totalLastMonthProfit
  }

  const getDisplayValue = (asset: any) => {
    return asset.convertedValue || asset.value || 0
  }

  const getDisplayGain = (asset: any) => {
    // The gain should already be converted in convertAssetValues function
    // Don't apply additional conversion here as it would double-convert
    return asset.gain || 0
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t('assets.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your investment portfolio
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Currency Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Display in:</span>
            <select
              value={displayCurrency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="px-3 py-1 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isConverting}
            >
              {CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.symbol}
                </option>
              ))}
            </select>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshRates}
              disabled={isConverting}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${isConverting ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          <Button className="flex items-center space-x-2" onClick={handleAddAsset}>
            <Plus className="h-4 w-4" />
            <span>{t('assets.addNewAsset')}</span>
          </Button>
        </div>
      </div>

      {/* Tax Settings */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">
              {t('settings.taxSettings')}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTaxSettings(!showTaxSettings)}
            className="flex items-center space-x-2"
          >
            {showTaxSettings ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span>{showTaxSettings ? t('common.hide') : t('common.show')}</span>
          </Button>
        </div>
        
        {showTaxSettings && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Stock Tax Settings */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">{t('assets.stock')}</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {t('settings.capitalGainsTax')} (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={taxSettings.stock?.capitalGainsTax || 0}
                      onChange={(e) => handleTaxSettingChange('stock', 'capitalGainsTax', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {t('settings.dividendTax')} (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={taxSettings.stock?.dividendTax || 0}
                      onChange={(e) => handleTaxSettingChange('stock', 'dividendTax', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Deposit Tax Settings */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">{t('assets.deposit')}</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {t('settings.interestTax')} (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={taxSettings.deposit?.interestTax || 0}
                      onChange={(e) => handleTaxSettingChange('deposit', 'interestTax', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Precious Metal Tax Settings */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">{t('assets.preciousMetal')}</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {t('settings.capitalGainsTax')} (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={taxSettings.preciousMetal?.capitalGainsTax || 0}
                      onChange={(e) => handleTaxSettingChange('preciousMetal', 'capitalGainsTax', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Recurring Income Tax Settings */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">{t('assets.recurringIncome')}</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {t('settings.incomeTax')} (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={taxSettings.recurringIncome?.incomeTax || 0}
                      onChange={(e) => handleTaxSettingChange('recurringIncome', 'incomeTax', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Crypto Tax Settings */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">{t('assets.crypto')}</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {t('settings.capitalGainsTax')} (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={taxSettings.crypto?.capitalGainsTax || 0}
                      onChange={(e) => handleTaxSettingChange('crypto', 'capitalGainsTax', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Real Estate Tax Settings */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">{t('assets.realEstate')}</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {t('settings.capitalGainsTax')} (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={taxSettings.realEstate?.capitalGainsTax || 0}
                      onChange={(e) => handleTaxSettingChange('realEstate', 'capitalGainsTax', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {t('settings.rentalIncomeTax')} (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={taxSettings.realEstate?.rentalIncomeTax || 0}
                      onChange={(e) => handleTaxSettingChange('realEstate', 'rentalIncomeTax', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
              <Button onClick={handleTaxSettingsSave} className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span>{t('settings.saveTaxSettings')}</span>
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Currency Status */}
      <CurrencyStatus />

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <div className="p-4 flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setError(null)}
              className="ml-auto"
            >
              Dismiss
            </Button>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card className="border-blue-200 bg-blue-50">
          <div className="p-4 flex items-center space-x-3">
            <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
            <p className="text-sm text-blue-800">Loading assets...</p>
          </div>
        </Card>
      )}

      {/* Assets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {convertedAssets.map((asset) => {
          const assetAny = asset as any
          return (
            <AssetCard
              key={asset.id}
              asset={asset}
              displayCurrency={displayCurrency}
              onEdit={handleEditAsset}
              onDelete={handleDeleteAsset}
              onCopy={handleCopyAsset}
              t={t}
              formatCurrencyWithSymbol={formatCurrencyWithSymbol}
              getDisplayValue={getDisplayValue}
              getDisplayGain={getDisplayGain}
              formatPercentage={formatPercentage}
              getInterestTypeInfo={getInterestTypeInfo}
              formatDepositDuration={formatDepositDuration}
            />
          )
        })}

        {/* Add New Asset Card */}
        <Card className="asset-card border-dashed border-2 hover:border-primary/50 transition-colors">
          <div className="p-6 h-full flex items-center justify-center">
            <div className="text-center">
              <Plus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-3">
                {t('assets.addNewAsset')}
              </p>
              <Button variant="outline" size="sm" onClick={handleAddAsset}>
                {t('common.add')}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Assets Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="metric-card">
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Total Portfolio Value
            </p>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrencyWithSymbol(getTotalValue(), displayCurrency)}
            </p>
            {isConverting && (
              <p className="text-xs text-muted-foreground mt-1">Converting...</p>
            )}
          </div>
        </Card>

        <Card className="metric-card">
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Total Net Gain/Loss
            </p>
            <p className="text-2xl font-bold text-profit">
              +{formatCurrencyWithSymbol(getTotalNetGain(), displayCurrency)}
            </p>
          </div>
        </Card>

        <Card className="metric-card">
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {t('analytics.averageReturn')}
            </p>
            <p className="text-2xl font-bold text-profit">
              +{formatCurrencyWithSymbol(getLastMonthProfitLoss(), displayCurrency)}
            </p>
          </div>
        </Card>
      </div>

      {/* Add Asset Modal */}
      <AddAssetModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setCopyingAsset(null)
        }}
        onAdd={handleAddAssetSubmit}
        initialData={copyingAsset}
      />

      {/* Edit Asset Modal */}
      <EditAssetModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingAsset(null)
        }}
        onUpdate={handleEditAssetSubmit}
        asset={editingAsset}
      />
    </div>
  )
} 

export default Assets