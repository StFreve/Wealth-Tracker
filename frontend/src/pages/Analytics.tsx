import { useTranslation } from 'react-i18next'
import { BarChart3, TrendingUp, PieChart, Calendar, Activity } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { 
  PortfolioValueChart, 
  AssetAllocationChart, 
  MonthlyReturnsChart, 
  PerformanceMetricsChart,
  type PortfolioAnalytics
} from '@/components/charts'
import { analyticsApi } from '@/lib/api/analyticsApi'
import { useBackendCurrencyRates } from '@/hooks/useBackendCurrencyRates'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useState, useEffect } from 'react'

export default function Analytics() {
  const { t } = useTranslation()
  const { convertAmount } = useBackendCurrencyRates()
  const { displayCurrency, setDisplayCurrency, isConverting, setIsConverting } = useCurrency()
  
  const [analytics, setAnalytics] = useState<PortfolioAnalytics | null>(null)
  const [originalAnalytics, setOriginalAnalytics] = useState<PortfolioAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartType, setChartType] = useState<'line' | 'area'>('line')

  // Helper function to safely convert amount
  const safeConvertAmount = async (amount: number | null | undefined, from: string, to: string): Promise<number> => {
    if (amount === null || amount === undefined || isNaN(amount) || amount === 0) {
      return 0
    }
    if (from === to) {
      return amount
    }
    return await convertAmount(amount, from, to)
  }

  // Convert analytics data from USD to target currency
  const convertAnalytics = async (data: PortfolioAnalytics, targetCurrency: string): Promise<PortfolioAnalytics> => {
    if (targetCurrency === 'USD') {
      return data
    }

    const convertedData: PortfolioAnalytics = {
      ...data,
      performance: {
        ...data.performance,
        totalReturn: await safeConvertAmount(data.performance.totalReturn, 'USD', targetCurrency),
        bestAsset: {
          ...data.performance.bestAsset,
          value: await safeConvertAmount(data.performance.bestAsset.value, 'USD', targetCurrency),
          return: await safeConvertAmount(data.performance.bestAsset.return, 'USD', targetCurrency)
        },
        worstAsset: {
          ...data.performance.worstAsset,
          value: await safeConvertAmount(data.performance.worstAsset.value, 'USD', targetCurrency),
          return: await safeConvertAmount(data.performance.worstAsset.return, 'USD', targetCurrency)
        }
      },
      allocation: {
        ...data.allocation,
        byAssetType: await Promise.all(
          data.allocation.byAssetType.map(async (item) => ({
            ...item,
            value: await safeConvertAmount(item.value, 'USD', targetCurrency)
          }))
        ),
        byCurrency: await Promise.all(
          data.allocation.byCurrency.map(async (item) => ({
            ...item,
            value: await safeConvertAmount(item.value, 'USD', targetCurrency)
          }))
        ),
        byRiskLevel: await Promise.all(
          data.allocation.byRiskLevel.map(async (item) => ({
            ...item,
            value: await safeConvertAmount(item.value, 'USD', targetCurrency)
          }))
        )
      },
      trends: {
        ...data.trends,
        dailyReturns: await Promise.all(
          data.trends.dailyReturns.map(async (item) => ({
            ...item,
            value: await safeConvertAmount(item.value, 'USD', targetCurrency),
            return: await safeConvertAmount(item.return, 'USD', targetCurrency)
          }))
        ),
        monthlyReturns: await Promise.all(
          data.trends.monthlyReturns.map(async (item) => ({
            ...item,
            value: await safeConvertAmount(item.value, 'USD', targetCurrency),
            return: await safeConvertAmount(item.return, 'USD', targetCurrency)
          }))
        ),
        yearlyReturns: await Promise.all(
          data.trends.yearlyReturns.map(async (item) => ({
            ...item,
            value: await safeConvertAmount(item.value, 'USD', targetCurrency),
            return: await safeConvertAmount(item.return, 'USD', targetCurrency)
          }))
        )
      },
      riskMetrics: {
        ...data.riskMetrics,
        valueAtRisk: await safeConvertAmount(data.riskMetrics.valueAtRisk, 'USD', targetCurrency),
        conditionalValueAtRisk: await safeConvertAmount(data.riskMetrics.conditionalValueAtRisk, 'USD', targetCurrency)
      }
    }

    return convertedData
  }

  const loadAnalytics = async (targetCurrency?: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await analyticsApi.getPortfolioAnalytics()
      setOriginalAnalytics(data) // Store original USD data
      
      // If target currency is specified and not USD, convert immediately
      if (targetCurrency && targetCurrency !== 'USD') {
        setIsConverting(true)
        const convertedData = await convertAnalytics(data, targetCurrency)
        setAnalytics(convertedData)
        setIsConverting(false)
      } else {
        setAnalytics(data)
      }
    } catch (err) {
      console.error('Failed to load analytics:', err)
      setError('Failed to load analytics data. Please try again.')
    } finally {
      setLoading(false)
    }
  }



  const convertAnalyticsToTargetCurrency = async (targetCurrency: string) => {
    if (!originalAnalytics) return
    
    try {
      setIsConverting(true)
      const convertedData = await convertAnalytics(originalAnalytics, targetCurrency)
      setAnalytics(convertedData)
    } catch (err) {
      console.error('Failed to convert analytics:', err)
      // Keep original analytics if conversion fails
      setAnalytics(originalAnalytics)
    } finally {
      setIsConverting(false)
    }
  }

  // Initialize on mount
  useEffect(() => {
    loadAnalytics(displayCurrency) // Pass the currency to load and convert immediately
  }, [])

  // Convert analytics when currency changes
  useEffect(() => {
    if (originalAnalytics && displayCurrency) {
      convertAnalyticsToTargetCurrency(displayCurrency)
    }
  }, [displayCurrency, originalAnalytics])

  // Format currency with proper symbol and locale (same as Dashboard)
  const formatCurrencyWithSymbol = (amount: number, currency: string = 'USD') => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
      }).format(0);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatCurrencyValue = (amount: number | null | undefined) => {
    return formatCurrencyWithSymbol(amount || 0, displayCurrency)
  }

  const safeToFixed = (value: number | null | undefined, decimals: number = 2): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return '0.00'
    }
    return value.toFixed(decimals)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {t('analytics.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              Loading analytics...
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {t('analytics.title')}
            </h1>
            <p className="text-red-500 mt-1">{error}</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <Button onClick={() => loadAnalytics(displayCurrency)}>Try Again</Button>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {t('analytics.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              No analytics data available
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t('analytics.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isConverting ? 'Converting to ' + displayCurrency + '...' : 'Analyze your portfolio performance'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setChartType(chartType === 'line' ? 'area' : 'line')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {chartType === 'line' ? t('analytics.areaChart') : t('analytics.lineChart')}
          </Button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('analytics.totalReturn')}
              </p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrencyValue(analytics.performance.totalReturn)}
              </p>
                      <p className="text-sm text-gray-500">
          {safeToFixed(analytics.performance.totalReturnPercent, 2)}%
        </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('analytics.sharpeRatio')}
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {safeToFixed(analytics.performance.sharpeRatio, 2)}
              </p>
            </div>
            <Activity className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('analytics.maxDrawdown')}
              </p>
              <p className="text-2xl font-bold text-red-600">
                -{formatPercentage(analytics.performance.maxDrawdown)}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-red-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('analytics.volatility')}
              </p>
              <p className="text-2xl font-bold text-purple-600">
                {formatPercentage(analytics.trends.volatility)}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {t('analytics.monthlyReturns')}
          </h3>
          <MonthlyReturnsChart 
            data={analytics.trends.monthlyReturns} 
            currency={displayCurrency}
            height={320}
          />
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {t('analytics.assetAllocation')}
          </h3>
          <AssetAllocationChart 
            data={analytics.allocation.byAssetType} 
            currency={displayCurrency}
            height={320}
          />
        </Card>
      </div>

      {/* Risk Metrics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          {t('analytics.riskMetrics')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Portfolio Risk
            </p>
            <p className="text-2xl font-bold text-orange-600">
              {formatPercentage(analytics.riskMetrics.portfolioRisk)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Value at Risk
            </p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrencyValue(analytics.riskMetrics.valueAtRisk)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              CVaR
            </p>
            <p className="text-2xl font-bold text-red-700">
              {formatCurrencyValue(analytics.riskMetrics.conditionalValueAtRisk)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Concentration Risk
            </p>
            <p className="text-2xl font-bold text-yellow-600">
              {formatPercentage(analytics.riskMetrics.concentrationRisk)}
            </p>
          </div>
        </div>
      </Card>

      {/* Best/Worst Performers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-green-600">
            {t('analytics.bestPerformer')}
          </h3>
          <div className="space-y-2">
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {analytics.performance.bestAsset.name}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {analytics.performance.bestAsset.type}
            </p>
            <p className="text-lg font-semibold text-green-600">
              +{formatCurrencyValue(analytics.performance.bestAsset.return)} 
              ({safeToFixed(analytics.performance.bestAsset.returnPercent, 2)}%)
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-red-600">
            {t('analytics.worstPerformer')}
          </h3>
          <div className="space-y-2">
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {analytics.performance.worstAsset.name}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {analytics.performance.worstAsset.type}
            </p>
            <p className="text-lg font-semibold text-red-600">
              {formatCurrencyValue(analytics.performance.worstAsset.return)} 
              ({safeToFixed(analytics.performance.worstAsset.returnPercent, 2)}%)
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
} 