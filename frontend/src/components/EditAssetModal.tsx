import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Save, RefreshCw, TrendingUp, TrendingDown, Calendar, Calculator, Info, Settings } from 'lucide-react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Input } from './ui/Input'
import { Asset } from '../lib/api/assetsApi'
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

interface EditAssetModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdate: (asset: Asset) => void
  asset: Asset | null
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

export function EditAssetModal({ isOpen, onClose, onUpdate, asset }: EditAssetModalProps) {
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
  
  // Stock price fetching for dynamic pricing
  const [stockSymbol, setStockSymbol] = useState<string | null>(null)
  const { stockPrice, isLoading: isLoadingPrice, error: priceError, refetch: refetchPrice } = useBackendStockPrice(stockSymbol)
  
  // Load asset data when modal opens
  useEffect(() => {
    if (asset && isOpen) {
      setAssetType(asset.type)
      setCurrency(asset.currency)
      
      // Format dates for HTML date inputs (YYYY-MM-DD)
      const formatDateForInput = (dateString: string) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return ''
        return date.toISOString().split('T')[0]
      }
      
      setFormData({
        name: asset.name || '',
        ticker: asset.ticker || asset.symbol || '',
        quantity: formatNumberForInput(asset.quantity || 0),
        purchasePrice: formatNumberForInput(asset.purchasePrice || 0),
        currentPrice: formatNumberForInput(asset.currentPrice || 0),
        principal: formatNumberForInput(asset.principal || 0),
        rate: formatNumberForInput(asset.rate || asset.interestRate || 0),
        startDate: formatDateForInput(asset.startDate || ''),
        maturityDate: formatDateForInput(asset.maturityDate || asset.endDate || ''),
        compoundingFrequency: asset.compoundingFrequency || asset.interestSchedule || 'annually',
        interestType: asset.interestType || asset.compounding || 'compound',
        progressiveRates: JSON.stringify(asset.progressiveRates || getDefaultProgressiveRates()),
        variableRates: JSON.stringify(asset.variableRates || ''),
        tieredRates: JSON.stringify(asset.tieredRates || getDefaultTieredRates()),
        weight: formatNumberForInput(asset.weight || 0),
        purity: formatNumberForInput(asset.purity || 0),
        monthlyAmount: formatNumberForInput(asset.monthlyAmount || asset.amountPerPeriod || 0),
        frequency: asset.frequency || 'monthly',
        amount: formatNumberForInput(asset.value || 0),
        // Replenishment fields
        enableReplenishment: Boolean((asset as any).replenishmentAmount).toString(),
        replenishmentAmount: formatNumberForInput((asset as any).replenishmentAmount || 0),
        replenishmentFrequency: (asset as any).replenishmentFrequency || 'monthly',
        replenishmentStartDate: formatDateForInput((asset as any).replenishmentStartDate || ''),
        replenishmentEndDate: formatDateForInput((asset as any).replenishmentEndDate || '')
      })
    }
  }, [asset, isOpen])
  
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
    
    if (!asset) return
    
    // Validate stock ticker if it's a stock
    if (assetType === 'stock' && !isValidStockSymbol(formData.ticker)) {
      alert(t('addAssetModal.invalidTicker'))
      return
    }
    
    // Create updated asset object based on type
    const baseAsset: Partial<Asset> = {
      type: assetType,
      currency: currency,
      name: formData.name,
    }

    let updatedAsset
    switch (assetType) {
      case 'stock':
        const currentPrice = stockPrice?.price || parseFormattedNumber(formData.purchasePrice)
        const quantity = parseFormattedNumber(formData.quantity)
        updatedAsset = {
          ...baseAsset,
          ticker: formData.ticker,
          symbol: formData.ticker,
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
        
        const principal = parseFormattedNumber(formData.principal)
        const rate = parseFormattedNumber(formData.rate)
        
        const depositInfo = {
          principal,
          rate,
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
        
        // Debug logging for deposit update
        console.log('EditAssetModal deposit form data:', {
          compoundingFrequency: formData.compoundingFrequency,
          interestType: formData.interestType,
          startDate: formData.startDate,
          maturityDate: formData.maturityDate
        })
        
        updatedAsset = {
          ...baseAsset,
          principal,
          rate,
          interestRate: rate,
          startDate: formData.startDate,
          maturityDate: formData.maturityDate,
          endDate: formData.maturityDate,
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
        updatedAsset = {
          ...baseAsset,
          weight,
          purity: parseFormattedNumber(formData.purity),
          currentPrice: pricePerUnit,
          value: weight * pricePerUnit,
          metalType: 'gold' // Default, could be configurable
        }
        break
      case 'recurringIncome':
        const monthlyAmount = parseFormattedNumber(formData.monthlyAmount)
        updatedAsset = {
          ...baseAsset,
          monthlyAmount,
          amountPerPeriod: monthlyAmount,
          frequency: formData.frequency,
          value: monthlyAmount * 12 // Annualized value
        }
        break
      case 'cash':
        updatedAsset = {
          ...baseAsset,
          value: parseFormattedNumber(formData.amount)
        }
        break
      default:
        updatedAsset = baseAsset
    }

    // Calculate gain (this might need to be more sophisticated)
    const finalAsset = {
      ...asset,
      ...updatedAsset,
      id: asset.id, // Keep original ID
      updatedAt: new Date().toISOString()
    }

    onUpdate(finalAsset)
    onClose()
  }

  if (!isOpen || !asset) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              {t('assets.editAsset')}
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
                      {t('addAssetModal.purchasePrice')}
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
                    <div className="relative">
                      <Input
                        value={stockPrice ? formatNumberForInput(stockPrice.price) : formData.currentPrice}
                        onChange={(e) => handleNumberInput('currentPrice', e.target.value)}
                        placeholder={t('addAssetModal.currentPrice')}
                        disabled={isLoadingPrice}
                        className={stockPrice ? 'bg-green-50 border-green-300' : ''}
                      />
                      {isLoadingPrice && (
                        <div className="absolute right-2 top-2">
                          <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                        </div>
                      )}
                    </div>
                    {stockPrice && (
                      <div className="text-xs text-green-600 mt-1">
                        {t('addAssetModal.priceFrom')} {stockPrice.source} ({t('addAssetModal.updated')}: {new Date(stockPrice.timestamp).toLocaleTimeString()})
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {assetType === 'deposit' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {t('addAssetModal.principalAmount')}
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
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    {t('addAssetModal.maturityDate')} ({t('common.optional')})
                  </label>
                  <Input
                    type="date"
                    value={formData.maturityDate}
                    onChange={(e) => handleInputChange('maturityDate', e.target.value)}
                  />
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
              </>
            )}

            {assetType === 'preciousMetal' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {t('addAssetModal.weight')}
                    </label>
                    <Input
                      value={formData.weight}
                      onChange={(e) => handleNumberInput('weight', e.target.value)}
                      placeholder="10.5"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {t('addAssetModal.purity')}
                    </label>
                    <Input
                      value={formData.purity}
                      onChange={(e) => handleNumberInput('purity', e.target.value)}
                      placeholder="99.9"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    {t('addAssetModal.currentPrice')}
                  </label>
                  <Input
                    value={formData.currentPrice}
                    onChange={(e) => handleNumberInput('currentPrice', e.target.value)}
                    placeholder="2,000.00"
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
                      {t('addAssetModal.monthlyAmount')}
                    </label>
                    <Input
                      value={formData.monthlyAmount}
                      onChange={(e) => handleNumberInput('monthlyAmount', e.target.value)}
                      placeholder="2,500.00"
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
                      <option value="weekly">{t('addAssetModal.weekly')}</option>
                      <option value="monthly">{t('addAssetModal.monthly')}</option>
                      <option value="quarterly">{t('addAssetModal.quarterly')}</option>
                      <option value="annually">{t('addAssetModal.annually')}</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {assetType === 'cash' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t('addAssetModal.amount')}
                </label>
                <Input
                  value={formData.amount}
                  onChange={(e) => handleNumberInput('amount', e.target.value)}
                  placeholder="10,000.00"
                  required
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                {t('addAssetModal.cancel')}
              </Button>
              <Button type="submit" className="flex items-center space-x-2">
                <Save className="h-4 w-4" />
                <span>{t('assets.assetUpdated')}</span>
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
} 