import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Plus, RefreshCw, TrendingUp, TrendingDown, Calendar, Calculator, Info, Settings } from 'lucide-react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Input } from './ui/Input'
import { useBackendStockPrice } from '../hooks/useBackendStockPrice'
import { formatStockPrice, formatStockPriceChange, isValidStockSymbol } from '../lib/api/marketDataApi'
import { 
  calculateDepositValue, 
  formatDepositDuration, 
  getDepositStatus, 
  getInterestTypeInfo,
  getDefaultProgressiveRates,
  getDefaultTieredRates
} from '../lib/depositCalculations'
import { handleNumberInputChange, formatNumberForInput, parseFormattedNumber } from '../lib/numberFormat'

interface AddAssetModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (asset: any) => void
  initialData?: any
}

const assetTypes = [
  { value: 'stock', label: 'assetTypes.stock.title' },
  { value: 'deposit', label: 'assetTypes.deposit.title' },
  { value: 'preciousMetal', label: 'assetTypes.preciousMetal.title' },
  { value: 'recurringIncome', label: 'assetTypes.recurringIncome.title' },
  { value: 'cash', label: 'assets.cash' }
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
  { code: 'GEL', name: 'Georgian Lari', symbol: '₾' },
  { code: 'XAU', name: 'Gold (Troy Ounce)', symbol: 'Au' },
  { code: 'XAG', name: 'Silver (Troy Ounce)', symbol: 'Ag' },
  { code: 'XPT', name: 'Platinum (Troy Ounce)', symbol: 'Pt' },
  { code: 'XPD', name: 'Palladium (Troy Ounce)', symbol: 'Pd' }
]

export function AddAssetModal({ isOpen, onClose, onAdd, initialData }: AddAssetModalProps) {
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
    amount: '',
    // Replenishment fields
    enableReplenishment: 'false',
    replenishmentAmount: '',
    replenishmentFrequency: 'monthly',
    replenishmentStartDate: '',
    replenishmentEndDate: ''
  })
  
  // Initialize form with copied asset data when provided
  useEffect(() => {
    if (initialData && isOpen) {
      // Format dates for HTML date inputs (YYYY-MM-DD)
      const formatDateForInput = (dateString: string) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return ''
        return date.toISOString().split('T')[0]
      }
      
      setAssetType(initialData.type)
      setCurrency(initialData.currency || 'USD')
      setFormData({
        name: `Copy of ${initialData.name}`,
        ticker: initialData.ticker || initialData.symbol || '',
        quantity: formatNumberForInput(initialData.quantity || 0),
        purchasePrice: formatNumberForInput(initialData.purchasePrice || 0),
        currentPrice: formatNumberForInput(initialData.currentPrice || 0),
        principal: formatNumberForInput(initialData.originalPrincipal || initialData.principal || 0),
        rate: formatNumberForInput(initialData.rate || initialData.interestRate || 0),
        startDate: formatDateForInput(initialData.startDate || ''),
        maturityDate: formatDateForInput(initialData.maturityDate || initialData.endDate || ''),
        compoundingFrequency: initialData.compoundingFrequency || initialData.interestSchedule || 'annually',
        interestType: initialData.interestType || initialData.compounding || 'compound',
        progressiveRates: initialData.progressiveRates ? JSON.stringify(initialData.progressiveRates) : JSON.stringify(getDefaultProgressiveRates()),
        variableRates: initialData.variableRates ? JSON.stringify(initialData.variableRates) : '',
        tieredRates: initialData.tieredRates ? JSON.stringify(initialData.tieredRates) : JSON.stringify(getDefaultTieredRates()),
        weight: formatNumberForInput(initialData.weight || 0),
        purity: formatNumberForInput(initialData.purity || 0),
        monthlyAmount: formatNumberForInput(initialData.monthlyAmount || initialData.amountPerPeriod || 0),
        frequency: initialData.frequency || 'monthly',
        amount: formatNumberForInput(initialData.value || 0),
        // Replenishment fields
        enableReplenishment: Boolean(initialData.replenishmentAmount).toString(),
        replenishmentAmount: formatNumberForInput(initialData.replenishmentAmount || 0),
        replenishmentFrequency: initialData.replenishmentFrequency || 'monthly',
        replenishmentStartDate: formatDateForInput(initialData.replenishmentStartDate || ''),
        replenishmentEndDate: formatDateForInput(initialData.replenishmentEndDate || '')
      })
    } else if (!initialData && isOpen) {
      // Reset form when not copying
      setAssetType('stock')
      setCurrency('USD')
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
        amount: '',
        // Replenishment fields
        enableReplenishment: 'false',
        replenishmentAmount: '',
        replenishmentFrequency: 'monthly',
        replenishmentStartDate: '',
        replenishmentEndDate: ''
      })
    }
  }, [initialData, isOpen])
  
  // Stock price fetching for dynamic pricing
  const [stockSymbol, setStockSymbol] = useState<string | null>(null)
  const { stockPrice, isLoading: isLoadingPrice, error: priceError, refetch: refetchPrice } = useBackendStockPrice(stockSymbol)
  
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

  const handleNumberInput = (field: string, value: string) => {
    handleNumberInputChange(value, (formatted) => {
      setFormData(prev => ({
        ...prev,
        [field]: formatted
      }))
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate stock ticker if it's a stock
    if (assetType === 'stock' && !isValidStockSymbol(formData.ticker)) {
      alert(t('addAssetModal.invalidTicker'))
      return
    }
    
    // Create asset object based on type
    const baseAsset = {
      type: assetType,
      currency: currency,
      name: formData.name,
      date: new Date().toISOString().split('T')[0]
    }

    let asset
    switch (assetType) {
      case 'stock':
        const currentPrice = stockPrice?.price || parseFormattedNumber(formData.purchasePrice)
        const quantity = parseFormattedNumber(formData.quantity)
        asset = {
          ...baseAsset,
          ticker: formData.ticker,
          quantity: quantity,
          purchasePrice: parseFormattedNumber(formData.purchasePrice),
          currentPrice: currentPrice,
          value: quantity * currentPrice,
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
          principal: parseFormattedNumber(formData.principal),
          rate: parseFormattedNumber(formData.rate),
          startDate: formData.startDate,
          maturityDate: formData.maturityDate || undefined,
          compoundingFrequency: formData.compoundingFrequency as 'daily' | 'monthly' | 'quarterly' | 'annually',
          interestType: formData.interestType as 'simple' | 'compound' | 'progressive' | 'variable' | 'tiered',
          progressiveRates,
          variableRates,
          tieredRates,
          // Include replenishment data if enabled
          ...(formData.enableReplenishment === 'true' && {
            replenishmentAmount: parseFormattedNumber(formData.replenishmentAmount),
            replenishmentFrequency: formData.replenishmentFrequency as 'monthly' | 'quarterly' | 'annually',
            replenishmentStartDate: formData.replenishmentStartDate || undefined,
            replenishmentEndDate: formData.replenishmentEndDate || undefined
          })
        }
        const depositValue = calculateDepositValue(depositInfo)
        
        asset = {
          ...baseAsset,
          principal: parseFormattedNumber(formData.principal),
          rate: parseFormattedNumber(formData.rate),
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
          projectedMaturityValue: depositValue.projectedMaturityValue,
          // Include replenishment data if enabled
          ...(formData.enableReplenishment === 'true' && {
            replenishmentAmount: parseFormattedNumber(formData.replenishmentAmount),
            replenishmentFrequency: formData.replenishmentFrequency,
            replenishmentStartDate: formData.replenishmentStartDate || undefined,
            replenishmentEndDate: formData.replenishmentEndDate || undefined,
            totalReplenishments: depositValue.totalReplenishments,
            totalPrincipal: depositValue.totalPrincipal
          })
        }
        break
      case 'preciousMetal':
        const weight = parseFormattedNumber(formData.weight)
        const pricePerUnit = parseFormattedNumber(formData.currentPrice)
        asset = {
          ...baseAsset,
          weight: weight,
          purity: parseFormattedNumber(formData.purity),
          currentPrice: pricePerUnit,
          value: weight * pricePerUnit
        }
        break
      case 'recurringIncome':
        const monthlyAmount = parseFormattedNumber(formData.monthlyAmount)
        asset = {
          ...baseAsset,
          monthlyAmount: monthlyAmount,
          frequency: formData.frequency,
          value: monthlyAmount * 12 // Annualized value
        }
        break
      case 'cash':
        asset = {
          ...baseAsset,
          value: parseFormattedNumber(formData.amount)
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
      amount: '',
      // Replenishment fields
      enableReplenishment: 'false',
      replenishmentAmount: '',
      replenishmentFrequency: 'monthly',
      replenishmentStartDate: '',
      replenishmentEndDate: ''
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
              {t('addAssetModal.title')}
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Asset Type Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('addAssetModal.assetType')}
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
                    {t(type.label)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Currency Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('addAssetModal.currency')}
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
                {t('addAssetModal.assetName')}
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder={t('addAssetModal.assetNamePlaceholder')}
                required
              />
            </div>

            {/* Type-specific Fields */}
            {assetType === 'stock' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {t('addAssetModal.tickerSymbol')}
                    </label>
                    <div className="relative">
                      <Input
                        value={formData.ticker}
                        onChange={(e) => handleInputChange('ticker', e.target.value.toUpperCase())}
                        placeholder="AAPL, VOO, IWF, etc."
                        required
                        className={`${
                          formData.ticker && !isValidStockSymbol(formData.ticker) 
                            ? 'border-red-500 focus:ring-red-500' 
                            : ''
                        }`}
                      />
                      {formData.ticker && !isValidStockSymbol(formData.ticker) && (
                        <p className="text-xs text-red-600 mt-1">
                          {t('addAssetModal.invalidTicker')}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports stocks (AAPL, MSFT) and ETFs (VOO, IWF, SPY)
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {t('addAssetModal.quantity')}
                    </label>
                    <Input
                      value={formData.quantity}
                      onChange={(e) => handleNumberInput('quantity', e.target.value)}
                      placeholder={t('addAssetModal.quantityPlaceholder')}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {t('addAssetModal.purchasePrice')} ({currency})
                    </label>
                    <Input
                      value={formData.purchasePrice}
                      onChange={(e) => handleNumberInput('purchasePrice', e.target.value)}
                      placeholder={t('addAssetModal.purchasePricePlaceholder')}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {t('addAssetModal.currentPrice')}
                    </label>
                    <div className="border border-input rounded-md bg-background p-3 min-h-[40px] flex items-center justify-between">
                      {formData.ticker && isValidStockSymbol(formData.ticker) ? (
                        <div className="flex items-center gap-2 flex-1">
                          {isLoadingPrice ? (
                            <div className="flex items-center gap-2">
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              <span className="text-sm text-muted-foreground">{t('addAssetModal.fetchingPrice')}</span>
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
                                   {t('addAssetModal.failedToFetchPrice')}
                                 </span>
                                 <span className="text-xs text-muted-foreground">
                                   {t('addAssetModal.willUsePurchasePrice')}
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
                              {t('addAssetModal.enterValidTicker')}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {t('addAssetModal.enterTickerToGetPrice')}
                        </span>
                      )}
                    </div>
                                         <p className="text-xs text-muted-foreground mt-1">
                       {stockPrice ? (
                         <span>
                           {t('addAssetModal.priceFrom')} {stockPrice.source} • {t('addAssetModal.updated')} {new Date(stockPrice.timestamp).toLocaleTimeString()}
                         </span>
                       ) : (
                         t('addAssetModal.priceWillBeFetched')
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
                      {t('addAssetModal.principalAmount')} ({currency})
                    </label>
                    <Input
                      value={formData.principal}
                      onChange={(e) => handleNumberInput('principal', e.target.value)}
                      placeholder={t('addAssetModal.principalPlaceholder')}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {t('addAssetModal.interestRate')}
                    </label>
                    <Input
                      value={formData.rate}
                      onChange={(e) => handleNumberInput('rate', e.target.value)}
                      placeholder={t('addAssetModal.interestRatePlaceholder')}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      {t('addAssetModal.startDate')}
                    </label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('addAssetModal.startDateHelp')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      <Settings className="inline h-4 w-4 mr-1" />
                      {t('addAssetModal.interestType')}
                    </label>
                    <select
                      value={formData.interestType}
                      onChange={(e) => handleInputChange('interestType', e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="compound">{t('addAssetModal.interestTypes.compound')}</option>
                      <option value="simple">{t('addAssetModal.interestTypes.simple')}</option>
                      <option value="progressive">{t('addAssetModal.interestTypes.progressive')}</option>
                      <option value="variable">{t('addAssetModal.interestTypes.variable')}</option>
                      <option value="tiered">{t('addAssetModal.interestTypes.tiered')}</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getInterestTypeInfo(formData.interestType).description}
                    </p>
                  </div>
                </div>
                
                {(formData.interestType === 'compound' || formData.interestType === 'progressive') && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {t('addAssetModal.compoundingFrequency')}
                    </label>
                    <select
                      value={formData.compoundingFrequency}
                      onChange={(e) => handleInputChange('compoundingFrequency', e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="daily">{t('assetTypes.deposit.scheduleOptions.daily')}</option>
                      <option value="monthly">{t('assetTypes.deposit.scheduleOptions.monthly')}</option>
                      <option value="quarterly">{t('assetTypes.deposit.scheduleOptions.quarterly')}</option>
                      <option value="annually">{t('assetTypes.deposit.scheduleOptions.annually')}</option>
                    </select>
                  </div>
                )}
                
                {/* Progressive Rates Configuration */}
                {formData.interestType === 'progressive' && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      <Info className="inline h-4 w-4 mr-1" />
                      {t('addAssetModal.progressiveRateSchedule')}
                    </label>
                    <textarea
                      value={formData.progressiveRates}
                      onChange={(e) => handleInputChange('progressiveRates', e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono"
                      rows={4}
                      placeholder={t('addAssetModal.progressiveRatePlaceholder')}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('addAssetModal.progressiveRateExample')}
                    </p>
                  </div>
                )}
                
                {/* Variable Rates Configuration */}
                {formData.interestType === 'variable' && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      <Info className="inline h-4 w-4 mr-1" />
                      {t('addAssetModal.variableRateSchedule')}
                    </label>
                    <textarea
                      value={formData.variableRates}
                      onChange={(e) => handleInputChange('variableRates', e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono"
                      rows={4}
                      placeholder={t('addAssetModal.variableRatePlaceholder')}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('addAssetModal.variableRateExample')}
                    </p>
                  </div>
                )}
                
                {/* Tiered Rates Configuration */}
                {formData.interestType === 'tiered' && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      <Info className="inline h-4 w-4 mr-1" />
                      {t('addAssetModal.tieredRateStructure')}
                    </label>
                    <textarea
                      value={formData.tieredRates}
                      onChange={(e) => handleInputChange('tieredRates', e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono"
                      rows={4}
                      placeholder={t('addAssetModal.tieredRatePlaceholder')}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('addAssetModal.tieredRateExample')}
                    </p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    {t('addAssetModal.maturityDate')}
                  </label>
                  <Input
                    type="date"
                    value={formData.maturityDate}
                    onChange={(e) => handleInputChange('maturityDate', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('addAssetModal.maturityDateHelp')}
                  </p>
                </div>

                {/* Recurring Replenishment Section */}
                <div className="border border-border rounded-lg p-4 bg-muted/50">
                  <div className="flex items-center space-x-2 mb-3">
                    <input
                      type="checkbox"
                      id="enableReplenishment"
                      checked={formData.enableReplenishment === 'true'}
                      onChange={(e) => handleInputChange('enableReplenishment', e.target.checked.toString())}
                      className="rounded border-input"
                    />
                    <label htmlFor="enableReplenishment" className="text-sm font-medium text-foreground">
                      {t('assetTypes.deposit.replenishment.enable')}
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {t('assetTypes.deposit.replenishment.help')}
                  </p>

                  {formData.enableReplenishment === 'true' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">
                            {t('assetTypes.deposit.replenishment.amount')} ({currency})
                          </label>
                          <Input
                            value={formData.replenishmentAmount}
                            onChange={(e) => handleNumberInput('replenishmentAmount', e.target.value)}
                            placeholder="0.00"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">
                            {t('assetTypes.deposit.replenishment.frequency')}
                          </label>
                          <select
                            value={formData.replenishmentFrequency}
                            onChange={(e) => handleInputChange('replenishmentFrequency', e.target.value)}
                            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="monthly">{t('assetTypes.deposit.scheduleOptions.monthly')}</option>
                            <option value="quarterly">{t('assetTypes.deposit.scheduleOptions.quarterly')}</option>
                            <option value="annually">{t('assetTypes.deposit.scheduleOptions.annually')}</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">
                            {t('assetTypes.deposit.replenishment.startDate')}
                          </label>
                          <Input
                            type="date"
                            value={formData.replenishmentStartDate}
                            onChange={(e) => handleInputChange('replenishmentStartDate', e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Leave empty to start with deposit start date
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">
                            {t('assetTypes.deposit.replenishment.endDate')}
                          </label>
                          <Input
                            type="date"
                            value={formData.replenishmentEndDate}
                            onChange={(e) => handleInputChange('replenishmentEndDate', e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Leave empty to continue until maturity
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Deposit Preview */}
                {formData.principal && formData.rate && formData.startDate && (
                  <div className="bg-muted/50 p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Calculator className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{t('addAssetModal.depositPreview')}</span>
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
                        tieredRates,
                        // Include replenishment data if enabled
                        ...(formData.enableReplenishment === 'true' && {
                          replenishmentAmount: parseFloat(formData.replenishmentAmount) || 0,
                          replenishmentFrequency: formData.replenishmentFrequency as 'monthly' | 'quarterly' | 'annually',
                          replenishmentStartDate: formData.replenishmentStartDate || undefined,
                          replenishmentEndDate: formData.replenishmentEndDate || undefined
                        })
                      }
                      const depositValue = calculateDepositValue(depositInfo)
                      
                      return (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('addAssetModal.principal')}:</span>
                            <span className="font-medium">{currency} {formData.principal}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('addAssetModal.interestType')}:</span>
                            <span className="font-medium">{getInterestTypeInfo(formData.interestType).name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('addAssetModal.duration')}:</span>
                            <span className="font-medium">{formatDepositDuration(depositValue)}</span>
                          </div>
                          {formData.enableReplenishment === 'true' && depositValue.totalReplenishments && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('assetTypes.deposit.replenishment.total')}:</span>
                                <span className="font-medium text-blue-600">
                                  {currency} {depositValue.totalReplenishments.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('assetTypes.deposit.replenishment.totalPrincipal')}:</span>
                                <span className="font-medium">
                                  {currency} {(depositValue.totalPrincipal || 0).toFixed(2)}
                                </span>
                              </div>
                            </>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('addAssetModal.interestEarned')}:</span>
                            <span className="font-medium text-green-600">
                              {currency} {depositValue.accruedInterest.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span className="text-muted-foreground">{t('addAssetModal.currentValue')}:</span>
                            <span className="font-bold text-lg">
                              {currency} {depositValue.currentValue.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('addAssetModal.status')}:</span>
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
                      {t('addAssetModal.weightOz')}
                    </label>
                    <Input
                      value={formData.weight}
                      onChange={(e) => handleNumberInput('weight', e.target.value)}
                      placeholder={t('addAssetModal.weightPlaceholder')}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {t('addAssetModal.purityPercent')}
                    </label>
                    <Input
                      value={formData.purity}
                      onChange={(e) => handleNumberInput('purity', e.target.value)}
                      placeholder={t('addAssetModal.purityPlaceholder')}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    {t('addAssetModal.currentPricePerOz')} ({currency})
                  </label>
                  <Input
                    value={formData.currentPrice}
                    onChange={(e) => handleNumberInput('currentPrice', e.target.value)}
                    placeholder={t('addAssetModal.currentPricePlaceholder')}
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
                      {t('addAssetModal.monthlyAmount')} ({currency})
                    </label>
                    <Input
                      value={formData.monthlyAmount}
                      onChange={(e) => handleNumberInput('monthlyAmount', e.target.value)}
                      placeholder={t('addAssetModal.monthlyAmountPlaceholder')}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {t('addAssetModal.frequency')}
                    </label>
                    <select
                      value={formData.frequency}
                      onChange={(e) => handleInputChange('frequency', e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="monthly">{t('addAssetModal.frequencies.monthly')}</option>
                      <option value="quarterly">{t('addAssetModal.frequencies.quarterly')}</option>
                      <option value="yearly">{t('addAssetModal.frequencies.yearly')}</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {assetType === 'cash' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t('addAssetModal.amount')} ({currency})
                </label>
                <Input
                  value={formData.amount}
                  onChange={(e) => handleNumberInput('amount', e.target.value)}
                  placeholder={t('addAssetModal.amountPlaceholder')}
                  required
                />
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                {t('addAssetModal.cancel')}
              </Button>
              <Button type="submit" className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>{t('addAssetModal.addAsset')}</span>
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
} 