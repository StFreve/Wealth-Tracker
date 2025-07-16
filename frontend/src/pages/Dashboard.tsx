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
import { usePortfolioMetrics } from '../contexts/PortfolioMetricsContext';

// Backend currency functions
const formatCurrencyWithSymbol = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { displayCurrency } = useCurrency();
  const navigate = useNavigate();
  const { portfolioMetrics, loading, error, isConverting, refresh } = usePortfolioMetrics();

  const formatCurrencyWithSymbol = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatCurrency = (amount: number) => {
    const safeAmount = isNaN(amount) || amount === null || amount === undefined ? 0 : amount;
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

  // Generate wealth change data for the chart with historical and forecast data
  const generateWealthChangeData = (metrics: PortfolioMetrics) => {
    const months = [];
    const currentDate = new Date();
    
    // Generate last 12 months of historical data
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
        change: estimatedChange,
        isForecast: false
      });
    }
    
    // Calculate forecast parameters
    const currentValue = metrics.totalValue;
    const baselineMonthlyChange = metrics.monthlyChange; // This includes recurring income + replenishments + interest
    
    // For forecasting, we'll use the actual monthlyChange as our baseline
    // since it already includes replenishment contributions from the backend calculation
    
    // Calculate a conservative portfolio growth rate for applying to the growing balance
    const totalInvestment = metrics.performanceMetrics.totalInvestment;
    let portfolioGrowthRate = 0.005; // Default 0.5% monthly growth
    
    if (totalInvestment > 0 && metrics.totalGainLoss !== 0) {
      // Calculate annual return rate and convert to monthly, but be conservative
      const annualReturnRate = metrics.totalGainLoss / totalInvestment;
      portfolioGrowthRate = Math.max(-0.02, Math.min(0.02, annualReturnRate / 12)); // Limit to ±2% monthly
    }
    
    // Generate next 12 months of forecast data
    let forecastValue = currentValue;
    
    for (let i = 1; i <= 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      // Only use the baseline monthly change (already includes all growth factors)
      const variabilityFactor = 0.9 + (Math.random() * 0.2); // Random between 0.9 and 1.1 (±10%)
      const forecastChange = baselineMonthlyChange * variabilityFactor;
      
      forecastValue += forecastChange;
      
      // Ensure forecast value doesn't go negative
      forecastValue = Math.max(forecastValue, currentValue * 0.5);
      
      months.push({
        month: monthName,
        value: forecastValue,
        change: forecastChange,
        isForecast: true
      });
    }
    
    return months;
  };

  // Load portfolio metrics
  const loadPortfolioMetrics = async (targetCurrency?: string) => {
    try {
      // setLoading(true); // This is now handled by the context
      // setError(null); // This is now handled by the context
      // const metrics = await portfolioApi.getPortfolioMetrics(); // This is now handled by the context
      // setOriginalMetrics(metrics); // Store original USD metrics // This is now handled by the context
      
      // Use the passed currency or current display currency
      const currency = targetCurrency || displayCurrency;
      
      // If display currency is not USD, convert immediately
      if (currency !== 'USD') {
        // setIsConverting(true); // This is now handled by the context
        // await convertMetricsDirectly(portfolioMetrics!, currency); // Use portfolioMetrics from context
      }
      // else { // This is now handled by the context
      //   // setPortfolioMetrics(metrics); // This is now handled by the context
      // }
    } catch (err) {
      console.error('Failed to load portfolio metrics:', err);
      // setError('Failed to load portfolio data. Please try again.'); // This is now handled by the context
    } finally {
      // setLoading(false); // This is now handled by the context
    }
  };

  // Convert portfolio metrics to display currency
  const convertPortfolioMetrics = async (targetCurrency: string) => {
    if (!portfolioMetrics) { // Use portfolioMetrics from context
      return;
    }
    
    // Ensure targetCurrency is a string
    const safeCurrency = typeof targetCurrency === 'string' ? targetCurrency : String(targetCurrency);
    
    // setIsConverting(true); // This is now handled by the context
    try {
      // If target currency is USD, just use original metrics
      if (safeCurrency === 'USD') {
        // setPortfolioMetrics(originalMetrics); // This is now handled by the context
        return;
      }

      // Convert main metrics from original USD values
      const convertedTotalValue = portfolioMetrics.totalValue; // Use portfolioMetrics from context
      const convertedTotalGainLoss = portfolioMetrics.totalGainLoss; // Use portfolioMetrics from context
      const convertedMonthlyChange = portfolioMetrics.monthlyChange; // Use portfolioMetrics from context
      const convertedYearlyChange = portfolioMetrics.yearlyChange; // Use portfolioMetrics from context

      // Convert asset allocation from original USD values
      const convertedAssetAllocation = portfolioMetrics.assetAllocation; // Use portfolioMetrics from context

      // Convert recent transactions from their original currencies
      const convertedRecentTransactions = portfolioMetrics.recentTransactions; // Use portfolioMetrics from context

      // Convert performance metrics from original USD values
      const convertedPerformanceMetrics = portfolioMetrics.performanceMetrics; // Use portfolioMetrics from context

      // setPortfolioMetrics({ // This is now handled by the context
      //   ...originalMetrics,
      //   totalValue: convertedTotalValue,
      //   totalGainLoss: convertedTotalGainLoss,
      //   monthlyChange: convertedMonthlyChange,
      //   yearlyChange: convertedYearlyChange,
      //   assetAllocation: convertedAssetAllocation,
      //   recentTransactions: convertedRecentTransactions,
      //   performanceMetrics: convertedPerformanceMetrics
      // });
    } catch (error) {
      console.error('Failed to convert currencies:', error);
      // Keep original metrics if conversion fails
      // setPortfolioMetrics(originalMetrics); // This is now handled by the context
    } finally {
      // setIsConverting(false); // This is now handled by the context
    }
  };



  const refreshData = () => {
    refresh(); // Use refresh from context
  };

  // Initialize on mount
  useEffect(() => {
    refresh(); // Use refresh from context
  }, []);

  // Convert metrics when currency changes (but not on initial load)
  useEffect(() => {
    if (portfolioMetrics && portfolioMetrics.totalValue > 0) { // Use portfolioMetrics from context
      // Only convert if we have valid metrics and it's not the initial load
      // convertPortfolioMetrics(displayCurrency);
    }
  }, [displayCurrency, portfolioMetrics]); // Add portfolioMetrics dependency to prevent infinite loops

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

        {/* Estimated Yearly Change */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('dashboard.estimatedYearlyChange')}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(portfolioMetrics.monthlyChange * 12)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {(portfolioMetrics.monthlyChangePercent * 12) >= 0 ? (
                  <ArrowUpIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm ${
                  (portfolioMetrics.monthlyChangePercent * 12) >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {formatPercent(portfolioMetrics.monthlyChangePercent * 12)}
                </span>
              </div>
            </div>
            <div className="p-3 bg-yellow-500/10 rounded-full">
              <TrendingUpIcon className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>


      {/* Wealth Change Over Time Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('dashboard.wealthChangeOverTime')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('dashboard.historicalAndForecastData')}
            </p>
          </div>
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


    </div>
  );
} 