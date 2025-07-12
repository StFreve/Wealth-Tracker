import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Edit, Trash2, TrendingUp, TrendingDown, RefreshCw, Calendar, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { AddAssetModal } from '@/components/AddAssetModal'
import { CurrencyStatus } from '@/components/CurrencyStatus'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { convertAssetValues, formatCurrency as formatCurrencyWithSymbol, CURRENCIES } from '@/lib/currency'
import { calculateDepositValue, formatDepositDuration, getDepositStatus, getInterestTypeInfo } from '@/lib/depositCalculations'

// Mock data - now with currency information
const mockAssets = [
  {
    id: 1,
    type: 'stock',
    name: 'Apple Inc.',
    ticker: 'AAPL',
    quantity: 10,
    purchasePrice: 150.00,
    currentPrice: 175.50,
    value: 1755.00,
    currency: 'USD',
    gain: 255.00,
    gainPercent: 17.0,
    date: '2024-01-15'
  },
  {
    id: 2,
    type: 'deposit',
    name: 'High Yield Savings',
    principal: 25000,
    rate: 4.5,
    startDate: '2023-12-01',
    maturityDate: '2025-12-01',
    compoundingFrequency: 'monthly',
    interestType: 'compound',
    value: 25562.50,
    currency: 'EUR',
    gain: 562.50,
    gainPercent: 2.25,
    date: '2023-12-01',
    accruedInterest: 562.50,
    daysElapsed: 45,
    status: 'Active',
    isMatured: false
  }
]

export default function Assets() {
  const { t } = useTranslation()
  const [assets, setAssets] = useState(mockAssets)
  const [convertedAssets, setConvertedAssets] = useState<any[]>(assets)
  const [displayCurrency, setDisplayCurrency] = useState('USD')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isConverting, setIsConverting] = useState(false)

  // Asset management handlers
  const handleAddAsset = () => {
    setIsModalOpen(true)
  }

  const handleAddAssetSubmit = async (newAsset: any) => {
    const updatedAssets = [...assets, newAsset]
    setAssets(updatedAssets)
    
    // Convert the new asset list to display currency
    if (displayCurrency !== 'USD') {
      await updateDisplayCurrency(displayCurrency, updatedAssets)
    } else {
      setConvertedAssets(updatedAssets)
    }
  }

  const handleEditAsset = (assetId: number) => {
    // For now, just show a placeholder alert
    alert(`Edit Asset ${assetId} functionality coming soon!`)
  }

  const handleDeleteAsset = (assetId: number) => {
    if (confirm('Are you sure you want to delete this asset?')) {
      const updatedAssets = assets.filter(asset => asset.id !== assetId)
      setAssets(updatedAssets)
      setConvertedAssets(convertedAssets.filter(asset => asset.id !== assetId))
    }
  }

  // Currency conversion
  const updateDisplayCurrency = async (currency: string, assetsToConvert = assets) => {
    setIsConverting(true)
    try {
      // Update deposit values with current calculations before conversion
      const updatedAssets = assetsToConvert.map(asset => {
        if (asset.type === 'deposit' && asset.startDate) {
          const depositInfo = {
            principal: asset.principal,
            rate: asset.rate,
            startDate: asset.startDate,
            maturityDate: asset.maturityDate,
            compoundingFrequency: (asset.compoundingFrequency as 'daily' | 'monthly' | 'quarterly' | 'annually') || 'annually',
            interestType: (asset.interestType as 'simple' | 'compound' | 'progressive' | 'variable' | 'tiered') || 'compound',
            progressiveRates: (asset as any).progressiveRates,
            variableRates: (asset as any).variableRates,
            tieredRates: (asset as any).tieredRates
          }
          const depositValue = calculateDepositValue(depositInfo)
          
          return {
            ...asset,
            value: depositValue.currentValue,
            accruedInterest: depositValue.accruedInterest,
            daysElapsed: depositValue.daysElapsed,
            status: getDepositStatus(depositValue),
            isMatured: depositValue.isMatured,
            projectedMaturityValue: depositValue.projectedMaturityValue,
            gain: depositValue.accruedInterest,
            gainPercent: depositValue.accruedInterest > 0 ? (depositValue.accruedInterest / asset.principal) * 100 : 0
          }
        }
        return asset
      })
      
      const converted = await convertAssetValues(updatedAssets, currency)
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

  // Initialize with USD conversion on mount
  useEffect(() => {
    updateDisplayCurrency('USD')
  }, [])

  const getTotalValue = () => {
    return convertedAssets.reduce((sum, asset) => {
      return sum + ((asset as any).convertedValue || asset.value || 0)
    }, 0)
  }

  const getTotalGain = () => {
    return convertedAssets.reduce((sum, asset) => {
      const assetAny = asset as any
      const gainValue = assetAny.convertedValue && assetAny.originalValue
        ? (asset.gain || 0) * (assetAny.convertedValue / assetAny.originalValue)
        : (asset.gain || 0)
      return sum + gainValue
    }, 0)
  }

  const getDisplayValue = (asset: any) => {
    return asset.convertedValue || asset.value || 0
  }

  const getDisplayGain = (asset: any) => {
    if (asset.convertedValue && asset.originalValue) {
      return (asset.gain || 0) * (asset.convertedValue / asset.originalValue)
    }
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

      {/* Currency Status */}
      <CurrencyStatus />

      {/* Assets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {convertedAssets.map((asset) => {
          const assetAny = asset as any
          return (
            <Card key={asset.id} className="asset-card">
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
                    <Button variant="ghost" size="sm" onClick={() => handleEditAsset(asset.id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteAsset(asset.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      {t('assets.marketValue')}
                    </span>
                    <span className="font-medium text-foreground">
                      {formatCurrencyWithSymbol(getDisplayValue(asset), displayCurrency)}
                    </span>
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
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          {t('assets.currentPrice')}
                        </span>
                        <span className="text-sm text-foreground">
                          {formatCurrencyWithSymbol(asset.currentPrice || 0, assetAny.originalCurrency || asset.currency || displayCurrency)}
                        </span>
                      </div>
                    </>
                  )}

                  {asset.type === 'deposit' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Principal
                        </span>
                        <span className="text-sm text-foreground">
                          {formatCurrencyWithSymbol(asset.principal || 0, assetAny.originalCurrency || asset.currency || displayCurrency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Interest Rate
                        </span>
                        <span className="text-sm text-foreground">
                          {(asset.rate || 0).toFixed(2)}% per year
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Interest Type
                        </span>
                        <span className="text-sm text-foreground font-medium">
                          {getInterestTypeInfo(asset.interestType || 'compound').name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Duration
                        </span>
                        <span className="text-sm text-foreground">
                          {asset.startDate && formatDepositDuration({
                            daysElapsed: asset.daysElapsed || 0,
                            monthsElapsed: Math.floor((asset.daysElapsed || 0) / 30),
                            yearsElapsed: (asset.daysElapsed || 0) / 365,
                            currentValue: 0,
                            accruedInterest: 0,
                            isMatured: asset.isMatured || false
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Interest Earned
                        </span>
                        <span className="text-sm text-green-600 font-medium">
                          +{formatCurrencyWithSymbol(asset.accruedInterest || 0, displayCurrency)}
                        </span>
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
                      {asset.maturityDate && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Maturity Date
                          </span>
                          <span className="text-sm text-foreground">
                            {new Date(asset.maturityDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <span className="text-sm text-muted-foreground">
                      {t('assets.profitLoss')}
                    </span>
                    <div className="flex items-center space-x-1">
                      <span className={`font-medium ${getDisplayGain(asset) >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {getDisplayGain(asset) >= 0 ? '+' : ''}
                        {formatCurrencyWithSymbol(Math.abs(getDisplayGain(asset)), displayCurrency)}
                      </span>
                      <span className={`text-sm ${asset.gainPercent >= 0 ? 'text-profit' : 'text-loss'}`}>
                        ({formatPercentage(Math.abs(asset.gainPercent))})
                      </span>
                      {asset.gainPercent >= 0 ? (
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
              Total Gain/Loss
            </p>
            <p className="text-2xl font-bold text-profit">
              +{formatCurrencyWithSymbol(getTotalGain(), displayCurrency)}
            </p>
          </div>
        </Card>

        <Card className="metric-card">
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Average Return
            </p>
            <p className="text-2xl font-bold text-profit">
              +{formatPercentage(12.5)}
            </p>
          </div>
        </Card>
      </div>

      {/* Add Asset Modal */}
      <AddAssetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddAssetSubmit}
      />
    </div>
  )
} 