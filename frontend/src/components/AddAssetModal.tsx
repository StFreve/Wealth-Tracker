import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Plus, RefreshCw, TrendingUp, TrendingDown, Calendar, Calculator, Info, Settings } from 'lucide-react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Input } from './ui/Input'
import { useStockPrice, formatStockPrice, formatStockPriceChange, isValidStockSymbol } from '../lib/stockPrice'
import { 
  calculateDepositValue, 
  formatDepositDuration, 
  getDepositStatus, 
  getInterestTypeInfo,
  getDefaultProgressiveRates,
  getDefaultTieredRates
} from '../lib/depositCalculations'

interface AddAssetModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (asset: any) => void
}

const assetTypes = [
  { value: 'stock', label: 'Stock' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'preciousMetal', label: 'Precious Metal' },
  { value: 'recurringIncome', label: 'Recurring Income' },
  { value: 'cash', label: 'Cash' }
]

const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'AMD', name: 'Armenian Dram', symbol: '֏' },
  { code: 'GEL', name: 'Georgian Lari', symbol: '₾' }
]

export function AddAssetModal({ isOpen, onClose, onAdd }: AddAssetModalProps) {
  const { t } = useTranslation()
  const [assetType, setAssetType] = useState('stock')
  const [currency, setCurrency] = useState('USD')
  const [formData, setFormData] = useState({
    name: '',
    ticker: '',
    quantity: '',
    purchasePrice: '',
    currentPrice: '',
    principal: '',
    rate: '',
    startDate: '',
    maturityDate: '',
    compoundingFrequency: 'annually',
    interestType: 'compound',
    progressiveRates: JSON.stringify(getDefaultProgressiveRates()),
    variableRates: '',
    tieredRates: JSON.stringify(getDefaultTieredRates()),
    weight: '',
    purity: '',
    monthlyAmount: '',
    frequency: 'monthly',
    amount: ''
  })
  
  // Stock price fetching for dynamic pricing
  const [stockSymbol, setStockSymbol] = useState<string | null>(null)
  const { stockPrice, isLoading: isLoadingPrice, error: priceError, refetch: refetchPrice } = useStockPrice(stockSymbol)
  
  // Update stock symbol when ticker changes
  useEffect(() => {
    if (assetType === 'stock' && formData.ticker && isValidStockSymbol(formData.ticker)) {
      const timer = setTimeout(() => {
        setStockSymbol(formData.ticker.toUpperCase())
      }, 500) // Debounce the API call
      
      return () => clearTimeout(timer)
    } else {
      setStockSymbol(null)
    }
  }, [formData.ticker, assetType])
  
  // Auto-populate asset name from ticker
  useEffect(() => {
    if (stockPrice && !formData.name) {
      setFormData(prev => ({
        ...prev,
        name: `${stockPrice.symbol} Stock`
      }))
    }
  }, [stockPrice, formData.name])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate stock ticker if it's a stock
    if (assetType === 'stock' && !isValidStockSymbol(formData.ticker)) {
      alert('Please enter a valid stock ticker symbol (1-5 letters only).')
      return
    }
    
    // Create asset object based on type
    const baseAsset = {
      id: Date.now(), // Temporary ID
      type: assetType,
      currency: currency,
      name: formData.name,
      date: new Date().toISOString().split('T')[0]
    }

    let asset
    switch (assetType) {
      case 'stock':
        const currentPrice = stockPrice?.price || parseFloat(formData.purchasePrice)
        asset = {
          ...baseAsset,
          ticker: formData.ticker,
          quantity: parseFloat(formData.quantity),
          purchasePrice: parseFloat(formData.purchasePrice),
          currentPrice: currentPrice,
          value: parseFloat(formData.quantity) * currentPrice,
          priceSource: stockPrice?.source || 'manual'
        }
        break
      case 'deposit':
        let progressiveRates = undefined
        let variableRates = undefined
        let tieredRates = undefined
        
        // Parse additional rate data based on interest type
        if (formData.interestType === 'progressive' && formData.progressiveRates) {
          try {
            progressiveRates = JSON.parse(formData.progressiveRates)
          } catch (e) {
            console.warn('Invalid progressive rates JSON:', e)
          }
        }
        
        if (formData.interestType === 'variable' && formData.variableRates) {
          try {
            variableRates = JSON.parse(formData.variableRates)
          } catch (e) {
            console.warn('Invalid variable rates JSON:', e)
          }
        }
        
        if (formData.interestType === 'tiered' && formData.tieredRates) {
          try {
            tieredRates = JSON.parse(formData.tieredRates)
          } catch (e) {
            console.warn('Invalid tiered rates JSON:', e)
          }
        }
        
        const depositInfo = {
          principal: parseFloat(formData.principal),
          rate: parseFloat(formData.rate),
          startDate: formData.startDate,
          maturityDate: formData.maturityDate || undefined,
          compoundingFrequency: formData.compoundingFrequency as 'daily' | 'monthly' | 'quarterly' | 'annually',
          interestType: formData.interestType as 'simple' | 'compound' | 'progressive' | 'variable' | 'tiered',
          progressiveRates,
          variableRates,
          tieredRates
        }
        const depositValue = calculateDepositValue(depositInfo)
        
        asset = {
          ...baseAsset,
          principal: parseFloat(formData.principal),
          rate: parseFloat(formData.rate),
          startDate: formData.startDate,
          maturityDate: formData.maturityDate,
          compoundingFrequency: formData.compoundingFrequency,
          interestType: formData.interestType,
          progressiveRates,
          variableRates,
          tieredRates,
          value: depositValue.currentValue,
          accruedInterest: depositValue.accruedInterest,
          daysElapsed: depositValue.daysElapsed,
          status: getDepositStatus(depositValue),
          isMatured: depositValue.isMatured,
          projectedMaturityValue: depositValue.projectedMaturityValue
        }
        break
      case 'preciousMetal':
        asset = {
          ...baseAsset,
          weight: parseFloat(formData.weight),
          purity: parseFloat(formData.purity),
          currentPrice: parseFloat(formData.currentPrice),
          value: parseFloat(formData.weight) * parseFloat(formData.currentPrice)
        }
        break
      case 'recurringIncome':
        asset = {
          ...baseAsset,
          monthlyAmount: parseFloat(formData.monthlyAmount),
          frequency: formData.frequency,
          value: parseFloat(formData.monthlyAmount) * 12 // Annualized value
        }
        break
      case 'cash':
        asset = {
          ...baseAsset,
          value: parseFloat(formData.amount)
        }
        break
      default:
        asset = baseAsset
    }

    // Calculate gain (placeholder for now)
    const assetWithGain = {
      ...asset,
      gain: (asset as any).value * 0.05, // 5% placeholder gain
      gainPercent: 5
    }

    onAdd(assetWithGain)
    onClose()
    
    // Reset form
    setFormData({
      name: '',
      ticker: '',
      quantity: '',
      purchasePrice: '',
      currentPrice: '',
      principal: '',
      rate: '',
      startDate: '',
      maturityDate: '',
      compoundingFrequency: 'annually',
      interestType: 'compound',
      progressiveRates: JSON.stringify(getDefaultProgressiveRates()),
      variableRates: '',
      tieredRates: JSON.stringify(getDefaultTieredRates()),
      weight: '',
      purity: '',
      monthlyAmount: '',
      frequency: 'monthly',
      amount: ''
    })
    setStockSymbol(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              {t('assets.addNewAsset')}
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Asset Type Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Asset Type
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {assetTypes.map((type) => (
                  <Button
                    key={type.value}
                    type="button"
                    variant={assetType === type.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAssetType(type.value)}
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Currency Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {currencies.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.symbol} {curr.name} ({curr.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Common Fields */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Asset Name
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter asset name"
                required
              />
            </div>

            {/* Type-specific Fields */}
            {assetType === 'stock' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Ticker Symbol
                    </label>
                    <div className="relative">
                      <Input
                        value={formData.ticker}
                        onChange={(e) => handleInputChange('ticker', e.target.value.toUpperCase())}
                        placeholder="AAPL"
                        required
                        className={`${
                          formData.ticker && !isValidStockSymbol(formData.ticker) 
                            ? 'border-red-500 focus:ring-red-500' 
                            : ''
                        }`}
                      />
                      {formData.ticker && !isValidStockSymbol(formData.ticker) && (
                        <p className="text-xs text-red-600 mt-1">
                          Invalid ticker symbol. Use 1-5 letters only.
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Quantity
                    </label>
                    <Input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange('quantity', e.target.value)}
                      placeholder="10"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Purchase Price ({currency})
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.purchasePrice}
                      onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
                      placeholder="150.00"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Current Price
                    </label>
                    <div className="border border-input rounded-md bg-background p-3 min-h-[40px] flex items-center justify-between">
                      {formData.ticker && isValidStockSymbol(formData.ticker) ? (
                        <div className="flex items-center gap-2 flex-1">
                          {isLoadingPrice ? (
                            <div className="flex items-center gap-2">
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              <span className="text-sm text-muted-foreground">Fetching price...</span>
                            </div>
                          ) : stockPrice ? (
                            <div className="flex items-center gap-2 flex-1">
                              <div className="flex items-center gap-1">
                                <span className="font-medium">{formatStockPrice(stockPrice)}</span>
                                {stockPrice.changePercent && (
                                  <span className={`text-xs flex items-center gap-1 ${
                                    stockPrice.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {stockPrice.changePercent >= 0 ? 
                                      <TrendingUp className="h-3 w-3" /> : 
                                      <TrendingDown className="h-3 w-3" />
                                    }
                                    {formatStockPriceChange(stockPrice)}
                                  </span>
                                )}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={refetchPrice}
                                className="h-6 w-6 p-0"
                              >
                                <RefreshCw className="h-3 w-3" />
                              </Button>
                            </div>
                                                     ) : priceError ? (
                             <div className="flex items-center justify-between w-full">
                               <div className="flex flex-col">
                                 <span className="text-sm text-red-600">
                                   Failed to fetch price
                                 </span>
                                 <span className="text-xs text-muted-foreground">
                                   Will use purchase price as fallback
                                 </span>
                               </div>
                               <Button
                                 type="button"
                                 variant="ghost"
                                 size="sm"
                                 onClick={refetchPrice}
                                 className="h-6 w-6 p-0"
                               >
                                 <RefreshCw className="h-3 w-3" />
                               </Button>
                             </div>
                           ) : (
                            <span className="text-sm text-muted-foreground">
                              Enter a valid ticker symbol
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Enter ticker symbol to get current price
                        </span>
                      )}
                    </div>
                                         <p className="text-xs text-muted-foreground mt-1">
                       {stockPrice ? (
                         <span>
                           Price from {stockPrice.source} • Updated {new Date(stockPrice.timestamp).toLocaleTimeString()}
                         </span>
                       ) : (
                         'Price will be fetched automatically when you enter a valid ticker symbol'
                       )}
                     </p>
                  </div>
                </div>
              </>
            )}

            {assetType === 'deposit' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Principal Amount ({currency})
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.principal}
                      onChange={(e) => handleInputChange('principal', e.target.value)}
                      placeholder="25000.00"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Interest Rate (% per year)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.rate}
                      onChange={(e) => handleInputChange('rate', e.target.value)}
                      placeholder="4.5"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      Start Date
                    </label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      When the deposit was made
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      <Settings className="inline h-4 w-4 mr-1" />
                      Interest Type
                    </label>
                    <select
                      value={formData.interestType}
                      onChange={(e) => handleInputChange('interestType', e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="compound">Compound Interest</option>
                      <option value="simple">Simple Interest</option>
                      <option value="progressive">Progressive Rates</option>
                      <option value="variable">Variable Rates</option>
                      <option value="tiered">Tiered Rates</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getInterestTypeInfo(formData.interestType).description}
                    </p>
                  </div>
                </div>
                
                {(formData.interestType === 'compound' || formData.interestType === 'progressive') && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Compounding Frequency
                    </label>
                    <select
                      value={formData.compoundingFrequency}
                      onChange={(e) => handleInputChange('compoundingFrequency', e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="daily">Daily</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="annually">Annually</option>
                    </select>
                  </div>
                )}
                
                {/* Progressive Rates Configuration */}
                {formData.interestType === 'progressive' && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      <Info className="inline h-4 w-4 mr-1" />
                      Progressive Rate Schedule (JSON format)
                    </label>
                    <textarea
                      value={formData.progressiveRates}
                      onChange={(e) => handleInputChange('progressiveRates', e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono"
                      rows={4}
                      placeholder='[{"months": 6, "rate": 3.0}, {"months": 6, "rate": 4.0}]'
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Example: First 6 months at 3%, next 6 months at 4%, etc.
                    </p>
                  </div>
                )}
                
                {/* Variable Rates Configuration */}
                {formData.interestType === 'variable' && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      <Info className="inline h-4 w-4 mr-1" />
                      Variable Rate Schedule (JSON format)
                    </label>
                    <textarea
                      value={formData.variableRates}
                      onChange={(e) => handleInputChange('variableRates', e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono"
                      rows={4}
                      placeholder='[{"date": "2024-01-01", "rate": 3.5}, {"date": "2024-06-01", "rate": 4.0}]'
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Specify dates when interest rates change
                    </p>
                  </div>
                )}
                
                {/* Tiered Rates Configuration */}
                {formData.interestType === 'tiered' && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      <Info className="inline h-4 w-4 mr-1" />
                      Tiered Rate Structure (JSON format)
                    </label>
                    <textarea
                      value={formData.tieredRates}
                      onChange={(e) => handleInputChange('tieredRates', e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono"
                      rows={4}
                      placeholder='[{"minBalance": 0, "maxBalance": 10000, "rate": 3.0}]'
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Different rates for different balance ranges
                    </p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Maturity Date (Optional)
                  </label>
                  <Input
                    type="date"
                    value={formData.maturityDate}
                    onChange={(e) => handleInputChange('maturityDate', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty if no specific maturity date
                  </p>
                </div>
                
                {/* Deposit Preview */}
                {formData.principal && formData.rate && formData.startDate && (
                  <div className="bg-muted/50 p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Calculator className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Deposit Preview</span>
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                        {getInterestTypeInfo(formData.interestType).name}
                      </span>
                    </div>
                    {(() => {
                      let progressiveRates = undefined
                      let variableRates = undefined
                      let tieredRates = undefined
                      
                      // Parse additional rate data for preview
                      if (formData.interestType === 'progressive' && formData.progressiveRates) {
                        try {
                          progressiveRates = JSON.parse(formData.progressiveRates)
                        } catch (e) {
                          // Ignore parse errors in preview
                        }
                      }
                      
                      if (formData.interestType === 'variable' && formData.variableRates) {
                        try {
                          variableRates = JSON.parse(formData.variableRates)
                        } catch (e) {
                          // Ignore parse errors in preview
                        }
                      }
                      
                      if (formData.interestType === 'tiered' && formData.tieredRates) {
                        try {
                          tieredRates = JSON.parse(formData.tieredRates)
                        } catch (e) {
                          // Ignore parse errors in preview
                        }
                      }
                      
                      const depositInfo = {
                        principal: parseFloat(formData.principal) || 0,
                        rate: parseFloat(formData.rate) || 0,
                        startDate: formData.startDate,
                        maturityDate: formData.maturityDate || undefined,
                        compoundingFrequency: formData.compoundingFrequency as 'daily' | 'monthly' | 'quarterly' | 'annually',
                        interestType: formData.interestType as 'simple' | 'compound' | 'progressive' | 'variable' | 'tiered',
                        progressiveRates,
                        variableRates,
                        tieredRates
                      }
                      const depositValue = calculateDepositValue(depositInfo)
                      
                      return (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Principal:</span>
                            <span className="font-medium">{currency} {formData.principal}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Interest Type:</span>
                            <span className="font-medium">{getInterestTypeInfo(formData.interestType).name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Duration:</span>
                            <span className="font-medium">{formatDepositDuration(depositValue)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Interest Earned:</span>
                            <span className="font-medium text-green-600">
                              {currency} {depositValue.accruedInterest.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span className="text-muted-foreground">Current Value:</span>
                            <span className="font-bold text-lg">
                              {currency} {depositValue.currentValue.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Status:</span>
                            <span className={`font-medium ${
                              depositValue.isMatured ? 'text-blue-600' : 'text-green-600'
                            }`}>
                              {getDepositStatus(depositValue)}
                            </span>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}
              </>
            )}

            {assetType === 'preciousMetal' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Weight (oz)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.weight}
                      onChange={(e) => handleInputChange('weight', e.target.value)}
                      placeholder="1.00"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Purity (%)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.purity}
                      onChange={(e) => handleInputChange('purity', e.target.value)}
                      placeholder="99.9"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Current Price per oz ({currency})
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.currentPrice}
                    onChange={(e) => handleInputChange('currentPrice', e.target.value)}
                    placeholder="2000.00"
                    required
                  />
                </div>
              </>
            )}

            {assetType === 'recurringIncome' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Monthly Amount ({currency})
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.monthlyAmount}
                      onChange={(e) => handleInputChange('monthlyAmount', e.target.value)}
                      placeholder="500.00"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Frequency
                    </label>
                    <select
                      value={formData.frequency}
                      onChange={(e) => handleInputChange('frequency', e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {assetType === 'cash' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Amount ({currency})
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="1000.00"
                  required
                />
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Asset</span>
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
} 