import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CurrencyStatus } from '../components/CurrencyStatus';
import { CURRENCIES } from '@/lib/currency';
import { useBackendCurrencyRates } from '@/hooks/useBackendCurrencyRates';
import { 
  TrendingUpIcon, 
  DollarSignIcon, 
  PieChartIcon, 
  PlusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  RefreshCw
} from 'lucide-react';

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
      
      if (assetCurrency !== targetCurrency) {
        convertedValue = await convertAmount(assetValue, assetCurrency, targetCurrency)
      }
      
      results.push({
        ...asset,
        convertedValue,
        originalValue: assetValue,
        originalCurrency: assetCurrency,
        targetCurrency
      })
    } catch (error) {
      console.error('Failed to convert asset:', error)
      results.push({
        ...asset,
        convertedValue: asset.value || 0,
        originalValue: asset.value || 0,
        originalCurrency: asset.currency || 'USD',
        targetCurrency
      })
    }
  }
  
  return results
}

// Mock data for demonstration - now with currency support
const mockPortfolioData = {
  totalNetWorth: 125750.00,
  totalAssets: 4,
  monthlyChange: 2850.50,
  monthlyChangePercent: 2.32,
  yearlyChange: 15420.75,
  yearlyChangePercent: 14.02,
  recentTransactions: [
    {
      id: 1,
      type: 'buy',
      asset: 'AAPL',
      amount: 1500.00,
      currency: 'USD',
      date: '2024-01-15',
      quantity: 10
    },
    {
      id: 2,
      type: 'dividend',
      asset: 'MSFT',
      amount: 45.20,
      currency: 'USD',
      date: '2024-01-12'
    },
    {
      id: 3,
      type: 'deposit',
      asset: 'Term Deposit',
      amount: 5000.00,
      currency: 'EUR',
      date: '2024-01-10'
    }
  ],
  assetAllocation: [
    { type: 'Stocks', value: 75500, currency: 'USD', percentage: 60 },
    { type: 'Deposits', value: 25150, currency: 'EUR', percentage: 20 },
    { type: 'Precious Metals', value: 18850, currency: 'GBP', percentage: 15 },
    { type: 'Cash', value: 6250, currency: 'USD', percentage: 5 }
  ]
};

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  const [convertedData, setConvertedData] = useState<any>(mockPortfolioData);
  const [isConverting, setIsConverting] = useState(false);
  
  // Use backend currency rates hook
  const { convertAmount } = useBackendCurrencyRates();

  const formatCurrency = (amount: number) => {
    return formatCurrencyWithSymbol(amount, displayCurrency);
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
    // For now, navigate to settings or create a modal
    navigate('/settings');
  };

  // Currency conversion using backend API
  const updateDisplayCurrency = async (currency: string) => {
    setIsConverting(true);
    try {
      // Convert asset allocation
      const convertedAllocation = await convertAssetValues(
        mockPortfolioData.assetAllocation.map(item => ({ 
          ...item, 
          value: item.value 
        })), 
        currency,
        convertAmount
      );

      // Convert transactions
      const convertedTransactions = await convertAssetValues(
        mockPortfolioData.recentTransactions.map(transaction => ({
          ...transaction,
          value: transaction.amount
        })),
        currency,
        convertAmount
      );

      // Convert main portfolio values (assuming they're in USD base)
      const portfolioValues = [
        { value: mockPortfolioData.totalNetWorth, currency: 'USD' },
        { value: mockPortfolioData.monthlyChange, currency: 'USD' },
        { value: mockPortfolioData.yearlyChange, currency: 'USD' }
      ];

      const convertedPortfolioValues = await convertAssetValues(portfolioValues, currency, convertAmount);

      setConvertedData({
        ...mockPortfolioData,
        totalNetWorth: convertedPortfolioValues[0].convertedValue || convertedPortfolioValues[0].value,
        monthlyChange: convertedPortfolioValues[1].convertedValue || convertedPortfolioValues[1].value,
        yearlyChange: convertedPortfolioValues[2].convertedValue || convertedPortfolioValues[2].value,
        assetAllocation: convertedAllocation.map((item, index) => ({
          ...mockPortfolioData.assetAllocation[index],
          value: item.convertedValue || item.value,
          originalCurrency: item.originalCurrency
        })),
        recentTransactions: convertedTransactions.map((item, index) => ({
          ...mockPortfolioData.recentTransactions[index],
          amount: item.convertedValue || item.value,
          originalCurrency: item.originalCurrency
        }))
      });

      setDisplayCurrency(currency);
    } catch (error) {
      console.error('Failed to convert currencies:', error);
      // Fallback to original values
      setConvertedData(mockPortfolioData);
    } finally {
      setIsConverting(false);
    }
  };

  const handleCurrencyChange = (currency: string) => {
    updateDisplayCurrency(currency);
  };

  const refreshRates = () => {
    updateDisplayCurrency(displayCurrency);
  };

  // Initialize with USD conversion on mount
  useEffect(() => {
    updateDisplayCurrency('USD');
  }, []);

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
          {/* Currency Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Display in:</span>
            <select
              value={displayCurrency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        {/* Total Net Worth */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('dashboard.totalNetWorth')}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(convertedData.totalNetWorth)}
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

        {/* Total Assets */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('dashboard.totalAssets')}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {convertedData.totalAssets}
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
                {formatCurrency(convertedData.monthlyChange)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {convertedData.monthlyChangePercent >= 0 ? (
                  <ArrowUpIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm ${
                  convertedData.monthlyChangePercent >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {formatPercent(convertedData.monthlyChangePercent)}
                </span>
              </div>
            </div>
            <div className="p-3 bg-green-500/10 rounded-full">
              <TrendingUpIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        {/* Yearly Change */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('dashboard.yearlyChange')}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(convertedData.yearlyChange)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {convertedData.yearlyChangePercent >= 0 ? (
                  <ArrowUpIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm ${
                  convertedData.yearlyChangePercent >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {formatPercent(convertedData.yearlyChangePercent)}
                </span>
              </div>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-full">
              <TrendingUpIcon className="h-6 w-6 text-purple-600" />
            </div>
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
            {convertedData.assetAllocation.map((asset: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ 
                      backgroundColor: `hsl(${index * 90 + 210}, 70%, 50%)` 
                    }}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {asset.type}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(asset.value)}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    {asset.percentage}%
                    {asset.originalCurrency && asset.originalCurrency !== displayCurrency && (
                      <span className="bg-gray-200 dark:bg-gray-700 px-1 rounded text-xs">
                        from {asset.originalCurrency}
                      </span>
                    )}
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
            {convertedData.recentTransactions.map((transaction: any) => (
              <div key={transaction.id} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {transaction.asset}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    {transaction.date} • {transaction.type}
                    {transaction.quantity && ` • ${transaction.quantity} shares`}
                    {transaction.originalCurrency && transaction.originalCurrency !== displayCurrency && (
                      <span className="bg-gray-200 dark:bg-gray-700 px-1 rounded">
                        from {transaction.originalCurrency}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${
                    transaction.type === 'buy' 
                      ? 'text-red-600' 
                      : 'text-green-600'
                  }`}>
                    {transaction.type === 'buy' ? '-' : '+'}
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Performance Chart Placeholder */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('dashboard.portfolioGrowth')}
          </h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">1M</Button>
            <Button variant="outline" size="sm">3M</Button>
            <Button variant="outline" size="sm">6M</Button>
            <Button size="sm">1Y</Button>
          </div>
        </div>
        
        <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <TrendingUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">
              Portfolio performance chart will be displayed here
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Chart library integration needed
            </p>
          </div>
        </div>
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
            <TrendingUpIcon className="h-6 w-6" />
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