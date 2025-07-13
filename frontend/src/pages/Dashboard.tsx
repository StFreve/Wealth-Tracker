import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { CurrencyStatus } from '../components/CurrencyStatus';
import { useBackendCurrencyRates } from '@/hooks/useBackendCurrencyRates';
import { portfolioApi, PortfolioMetrics } from '@/lib/api/portfolioApi';
import { WealthChangeChart } from '@/components/WealthChangeChart';
import { 
  TrendingUpIcon, 
  DollarSignIcon, 
  PieChartIcon, 
  PlusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  RefreshCw,
  AlertCircle,
  BarChart3,
  TrendingDown
} from 'lucide-react';

// Backend currency functions
const formatCurrencyWithSymbol = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

const convertValue = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  convertAmount: (amount: number, from: string, to: string) => Promise<number>
) => {
  // Safety checks
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 0;
  }
  
  if (!fromCurrency || !toCurrency) {
    return amount;
  }
  
  if (fromCurrency === toCurrency) return amount;
  
  try {
    const converted = await convertAmount(amount, fromCurrency, toCurrency);
    return isNaN(converted) ? amount : converted;
  } catch (error) {
    console.error('Failed to convert currency:', error);
    return amount;
  }
};

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { displayCurrency, setDisplayCurrency, isConverting, setIsConverting } = useCurrency();
  const navigate = useNavigate();
  const [portfolioMetrics, setPortfolioMetrics] = useState<PortfolioMetrics | null>(null);
  const [originalMetrics, setOriginalMetrics] = useState<PortfolioMetrics | null>(null); // Store original USD metrics
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use backend currency rates hook
  const { convertAmount } = useBackendCurrencyRates();

  const formatCurrency = (amount: number) => {
    // Safety check for amount
    const safeAmount = isNaN(amount) || amount === null || amount === undefined ? 0 : amount;
    // Ensure displayCurrency is valid
    const safeCurrency = displayCurrency && displayCurrency.length === 3 ? displayCurrency : 'USD';
    return formatCurrencyWithSymbol(safeAmount, safeCurrency);
  };

  const formatPercent = (percent: number) => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  };

  // Navigation handlers
  const handleAddAsset = () => {
    navigate('/assets');
  };

  const handleViewAllAssets = () => {
    navigate('/assets');
  };

  const handleViewAnalytics = () => {
    navigate('/analytics');
  };

  const handleCreateWidget = () => {
    navigate('/settings');
  };

  // Generate wealth change data for the chart
  const generateWealthChangeData = (metrics: PortfolioMetrics) => {
    const months = [];
    const currentDate = new Date();
    
    // Generate last 12 months of data
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      // For now, we'll use the current portfolio value and estimate historical values
      // In a real implementation, this would come from historical data
      const baseValue = metrics.totalValue;
      const monthlyChange = metrics.monthlyChange;
      
      // Estimate historical value (this is simplified - in reality you'd have actual historical data)
      const estimatedValue = baseValue - (monthlyChange * i);
      const estimatedChange = i === 0 ? monthlyChange : monthlyChange * 0.8; // Slight variation
      
      months.push({
        month: monthName,
        value: Math.max(estimatedValue, 0), // Ensure non-negative
        change: estimatedChange
      });
    }
    
    return months;
  };

  // Helper function to convert metrics directly (for immediate conversion after load)
  const convertMetricsDirectly = async (metrics: PortfolioMetrics, targetCurrency: string) => {
    try {
      // Convert main metrics from USD values
      const convertedTotalValue = await convertValue(metrics.totalValue, 'USD', targetCurrency, convertAmount);
      const convertedTotalGainLoss = await convertValue(metrics.totalGainLoss, 'USD', targetCurrency, convertAmount);
      const convertedMonthlyChange = await convertValue(metrics.monthlyChange, 'USD', targetCurrency, convertAmount);
      const convertedYearlyChange = await convertValue(metrics.yearlyChange, 'USD', targetCurrency, convertAmount);

      // Convert asset allocation from USD values
      const convertedAssetAllocation = await Promise.all(
        metrics.assetAllocation.map(async (allocation) => ({
          ...allocation,
          value: await convertValue(allocation.value, 'USD', targetCurrency, convertAmount)
        }))
      );

      // Convert recent transactions from their original currencies
      const convertedRecentTransactions = await Promise.all(
        metrics.recentTransactions.map(async (transaction) => ({
          ...transaction,
          amount: await convertValue(transaction.amount, transaction.currency, targetCurrency, convertAmount)
        }))
      );

      // Convert performance metrics from USD values
      const convertedPerformanceMetrics = {
        totalInvestment: await convertValue(metrics.performanceMetrics.totalInvestment, 'USD', targetCurrency, convertAmount),
        totalReturn: await convertValue(metrics.performanceMetrics.totalReturn, 'USD', targetCurrency, convertAmount),
        averageReturn: await convertValue(metrics.performanceMetrics.averageReturn, 'USD', targetCurrency, convertAmount),
        monthlyRecurringIncome: await convertValue(metrics.performanceMetrics.monthlyRecurringIncome, 'USD', targetCurrency, convertAmount),
        annualRecurringIncome: await convertValue(metrics.performanceMetrics.annualRecurringIncome, 'USD', targetCurrency, convertAmount),
      };

      const convertedMetrics = {
        ...metrics,
        totalValue: convertedTotalValue,
        totalGainLoss: convertedTotalGainLoss,
        monthlyChange: convertedMonthlyChange,
        yearlyChange: convertedYearlyChange,
        assetAllocation: convertedAssetAllocation,
        recentTransactions: convertedRecentTransactions,
        performanceMetrics: convertedPerformanceMetrics
      };

      setPortfolioMetrics(convertedMetrics);
    } catch (error) {
      console.error('Failed to convert metrics directly:', error);
      // Fallback to original metrics if conversion fails
      setPortfolioMetrics(metrics);
    } finally {
      setIsConverting(false);
    }
  };

  // Load portfolio metrics
  const loadPortfolioMetrics = async (targetCurrency?: string) => {
    try {
      setLoading(true);
      setError(null);
      const metrics = await portfolioApi.getPortfolioMetrics();
      setOriginalMetrics(metrics); // Store original USD metrics
      
      // Use the passed currency or current display currency
      const currency = targetCurrency || displayCurrency;
      
      // If display currency is not USD, convert immediately
      if (currency !== 'USD') {
        setIsConverting(true);
        await convertMetricsDirectly(metrics, currency);
      } else {
        setPortfolioMetrics(metrics);
      }
    } catch (err) {
      console.error('Failed to load portfolio metrics:', err);
      setError('Failed to load portfolio data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Convert portfolio metrics to display currency
  const convertPortfolioMetrics = async (targetCurrency: string) => {
    if (!originalMetrics) {
      return;
    }
    
    // Ensure targetCurrency is a string
    const safeCurrency = typeof targetCurrency === 'string' ? targetCurrency : String(targetCurrency);
    
    setIsConverting(true);
    try {
      // If target currency is USD, just use original metrics
      if (safeCurrency === 'USD') {
        setPortfolioMetrics(originalMetrics);
        return;
      }

      // Convert main metrics from original USD values
      const convertedTotalValue = await convertValue(originalMetrics.totalValue, 'USD', safeCurrency, convertAmount);
      const convertedTotalGainLoss = await convertValue(originalMetrics.totalGainLoss, 'USD', safeCurrency, convertAmount);
      const convertedMonthlyChange = await convertValue(originalMetrics.monthlyChange, 'USD', safeCurrency, convertAmount);
      const convertedYearlyChange = await convertValue(originalMetrics.yearlyChange, 'USD', safeCurrency, convertAmount);

      // Convert asset allocation from original USD values
      const convertedAssetAllocation = await Promise.all(
        originalMetrics.assetAllocation.map(async (allocation) => ({
          ...allocation,
          value: await convertValue(allocation.value, 'USD', safeCurrency, convertAmount)
        }))
      );

      // Convert recent transactions from their original currencies
      const convertedRecentTransactions = await Promise.all(
        originalMetrics.recentTransactions.map(async (transaction) => ({
          ...transaction,
          amount: await convertValue(transaction.amount, transaction.currency, safeCurrency, convertAmount)
        }))
      );

      // Convert performance metrics from original USD values
      const convertedPerformanceMetrics = {
        totalInvestment: await convertValue(originalMetrics.performanceMetrics.totalInvestment, 'USD', safeCurrency, convertAmount),
        totalReturn: await convertValue(originalMetrics.performanceMetrics.totalReturn, 'USD', safeCurrency, convertAmount),
        averageReturn: await convertValue(originalMetrics.performanceMetrics.averageReturn, 'USD', safeCurrency, convertAmount),
        monthlyRecurringIncome: await convertValue(originalMetrics.performanceMetrics.monthlyRecurringIncome, 'USD', safeCurrency, convertAmount),
        annualRecurringIncome: await convertValue(originalMetrics.performanceMetrics.annualRecurringIncome, 'USD', safeCurrency, convertAmount),
      };

      setPortfolioMetrics({
        ...originalMetrics,
        totalValue: convertedTotalValue,
        totalGainLoss: convertedTotalGainLoss,
        monthlyChange: convertedMonthlyChange,
        yearlyChange: convertedYearlyChange,
        assetAllocation: convertedAssetAllocation,
        recentTransactions: convertedRecentTransactions,
        performanceMetrics: convertedPerformanceMetrics
      });
    } catch (error) {
      console.error('Failed to convert currencies:', error);
      // Keep original metrics if conversion fails
      setPortfolioMetrics(originalMetrics);
    } finally {
      setIsConverting(false);
    }
  };



  const refreshData = () => {
    loadPortfolioMetrics();
  };

  // Initialize on mount
  useEffect(() => {
    loadPortfolioMetrics(displayCurrency); // Pass the currency to load and convert immediately
  }, []);

  // Convert metrics when currency changes (but not on initial load)
  useEffect(() => {
    if (originalMetrics && displayCurrency && originalMetrics.totalValue > 0) {
      // Only convert if we have valid metrics and it's not the initial load
      convertPortfolioMetrics(displayCurrency);
    }
  }, [displayCurrency]); // Remove originalMetrics dependency to prevent infinite loops

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t('dashboard.errorTitle')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error}
          </p>
          <Button onClick={refreshData}>
            {t('common.tryAgain')}
          </Button>
        </Card>
      </div>
    );
  }

  if (!portfolioMetrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="p-8 text-center">
          <PieChartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t('dashboard.noData')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t('dashboard.noDataDescription')}
          </p>
          <Button onClick={handleAddAsset}>
            <PlusIcon className="h-4 w-4 mr-2" />
            {t('dashboard.addFirstAsset')}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('dashboard.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('dashboard.welcomeBack')}, {user?.name}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button className="flex items-center gap-2" onClick={handleAddAsset}>
            <PlusIcon className="h-4 w-4" />
            {t('dashboard.addAsset')}
          </Button>
        </div>
      </div>

      {/* Currency Status */}
      <CurrencyStatus />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Portfolio Value */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('dashboard.totalNetWorth')}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(portfolioMetrics.totalValue)}
              </p>
              {isConverting && (
                <p className="text-xs text-gray-500 mt-1">Converting...</p>
              )}
            </div>
            <div className="p-3 bg-wealth-500/10 rounded-full">
              <DollarSignIcon className="h-6 w-6 text-wealth-600" />
            </div>
          </div>
        </Card>

        {/* Total Assets Count */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('dashboard.totalAssets')}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {portfolioMetrics.assetCount}
              </p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-full">
              <PieChartIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        {/* Monthly Change */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('dashboard.monthlyChange')}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(portfolioMetrics.monthlyChange)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {portfolioMetrics.monthlyChangePercent >= 0 ? (
                  <ArrowUpIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm ${
                  portfolioMetrics.monthlyChangePercent >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {formatPercent(portfolioMetrics.monthlyChangePercent)}
                </span>
              </div>
            </div>
            <div className="p-3 bg-green-500/10 rounded-full">
              <TrendingUpIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        {/* Total Gain/Loss */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('dashboard.totalGainLoss')}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(portfolioMetrics.totalGainLoss)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {portfolioMetrics.totalGainLossPercent >= 0 ? (
                  <ArrowUpIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm ${
                  portfolioMetrics.totalGainLossPercent >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {formatPercent(portfolioMetrics.totalGainLossPercent)}
                </span>
              </div>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-full">
              {portfolioMetrics.totalGainLoss >= 0 ? (
                <TrendingUpIcon className="h-6 w-6 text-purple-600" />
              ) : (
                <TrendingDown className="h-6 w-6 text-purple-600" />
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {t('dashboard.totalInvestment')}
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(portfolioMetrics.performanceMetrics.totalInvestment)}
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {t('dashboard.monthlyRecurringIncome')}
            </p>
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(portfolioMetrics.performanceMetrics.monthlyRecurringIncome)}
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {t('dashboard.annualRecurringIncome')}
            </p>
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(portfolioMetrics.performanceMetrics.annualRecurringIncome)}
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Allocation */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('dashboard.assetAllocation')}
            </h3>
            <Button variant="outline" size="sm" onClick={handleViewAllAssets}>
              {t('common.viewAll')}
            </Button>
          </div>
          
          <div className="space-y-4">
            {portfolioMetrics.assetAllocation.map((allocation, index) => (
              <div key={allocation.type} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ 
                      backgroundColor: `hsl(${index * 90 + 210}, 70%, 50%)` 
                    }}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {allocation.type}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(allocation.value)}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    {allocation.percentage.toFixed(1)}% • {allocation.count} assets
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Transactions */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('dashboard.recentTransactions')}
            </h3>
            <Button variant="outline" size="sm" onClick={handleViewAllAssets}>
              {t('common.viewAll')}
            </Button>
          </div>
          
          <div className="space-y-4">
            {portfolioMetrics.recentTransactions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                {t('dashboard.noRecentTransactions')}
              </p>
            ) : (
              portfolioMetrics.recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {transaction.assetName}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      {new Date(transaction.date).toLocaleDateString()} • {transaction.type}
                      {transaction.quantity && ` • ${transaction.quantity} shares`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      transaction.type === 'buy' || transaction.type === 'deposit'
                        ? 'text-red-600' 
                        : 'text-green-600'
                    }`}>
                      {(transaction.type === 'buy' || transaction.type === 'deposit') ? '-' : '+'}
                      {formatCurrency(transaction.amount)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Wealth Change Over Time Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('dashboard.wealthChangeOverTime')}
          </h3>
          <Button variant="outline" size="sm" onClick={handleViewAnalytics}>
            <BarChart3 className="h-4 w-4 mr-2" />
            {t('navigation.analytics')}
          </Button>
        </div>
        
        {portfolioMetrics ? (
          <WealthChangeChart 
            data={generateWealthChangeData(portfolioMetrics)}
            currency={displayCurrency}
            height={300}
          />
        ) : (
          <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">
                {t('dashboard.noDataDescription')}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('dashboard.quickActions')}
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" className="h-20 flex-col gap-2" onClick={handleAddAsset}>
            <PlusIcon className="h-6 w-6" />
            <span className="text-xs">{t('assets.addNewAsset')}</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2" onClick={handleViewAnalytics}>
            <BarChart3 className="h-6 w-6" />
            <span className="text-xs">{t('navigation.analytics')}</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2" onClick={handleCreateWidget}>
            <PieChartIcon className="h-6 w-6" />
            <span className="text-xs">{t('widgets.createWidget')}</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2" onClick={handleViewAllAssets}>
            <DollarSignIcon className="h-6 w-6" />
            <span className="text-xs">{t('assets.viewAllAssets')}</span>
          </Button>
        </div>
      </Card>
    </div>
  );
} 