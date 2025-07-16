import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useCurrency } from './CurrencyContext';
import { useBackendCurrencyRates } from '../hooks/useBackendCurrencyRates';
import { portfolioApi, PortfolioMetrics } from '../lib/api/portfolioApi';

interface PortfolioMetricsContextType {
  portfolioMetrics: PortfolioMetrics | null;
  loading: boolean;
  error: string | null;
  isConverting: boolean;
  refresh: () => void;
}

const PortfolioMetricsContext = createContext<PortfolioMetricsContextType | undefined>(undefined);

export function PortfolioMetricsProvider({ children }: { children: ReactNode }) {
  const { displayCurrency, setIsConverting, isConverting } = useCurrency();
  const { convertAmount } = useBackendCurrencyRates();
  const [portfolioMetrics, setPortfolioMetrics] = useState<PortfolioMetrics | null>(null);
  const [originalMetrics, setOriginalMetrics] = useState<PortfolioMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const convertMetricsDirectly = async (metrics: PortfolioMetrics, targetCurrency: string) => {
    try {
      const convertedTotalValue = await convertValue(metrics.totalValue, 'USD', targetCurrency, convertAmount);
      const convertedTotalGainLoss = await convertValue(metrics.totalGainLoss, 'USD', targetCurrency, convertAmount);
      const convertedMonthlyChange = await convertValue(metrics.monthlyChange, 'USD', targetCurrency, convertAmount);
      const convertedYearlyChange = await convertValue(metrics.yearlyChange, 'USD', targetCurrency, convertAmount);
      const convertedAssetAllocation = await Promise.all(
        metrics.assetAllocation.map(async (allocation) => ({
          ...allocation,
          value: await convertValue(allocation.value, 'USD', targetCurrency, convertAmount)
        }))
      );
      const convertedRecentTransactions = await Promise.all(
        metrics.recentTransactions.map(async (transaction) => ({
          ...transaction,
          amount: await convertValue(transaction.amount, transaction.currency, targetCurrency, convertAmount)
        }))
      );
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
      setPortfolioMetrics(metrics);
    } finally {
      setIsConverting(false);
    }
  };

  const loadPortfolioMetrics = async (targetCurrency?: string) => {
    try {
      setLoading(true);
      setError(null);
      const metrics = await portfolioApi.getPortfolioMetrics();
      setOriginalMetrics(metrics);
      const currency = targetCurrency || displayCurrency;
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

  const convertPortfolioMetrics = async (targetCurrency: string) => {
    if (!originalMetrics) {
      return;
    }
    const safeCurrency = typeof targetCurrency === 'string' ? targetCurrency : String(targetCurrency);
    setIsConverting(true);
    try {
      if (safeCurrency === 'USD') {
        setPortfolioMetrics(originalMetrics);
        return;
      }
      const convertedTotalValue = await convertValue(originalMetrics.totalValue, 'USD', safeCurrency, convertAmount);
      const convertedTotalGainLoss = await convertValue(originalMetrics.totalGainLoss, 'USD', safeCurrency, convertAmount);
      const convertedMonthlyChange = await convertValue(originalMetrics.monthlyChange, 'USD', safeCurrency, convertAmount);
      const convertedYearlyChange = await convertValue(originalMetrics.yearlyChange, 'USD', safeCurrency, convertAmount);
      const convertedAssetAllocation = await Promise.all(
        originalMetrics.assetAllocation.map(async (allocation) => ({
          ...allocation,
          value: await convertValue(allocation.value, 'USD', safeCurrency, convertAmount)
        }))
      );
      const convertedRecentTransactions = await Promise.all(
        originalMetrics.recentTransactions.map(async (transaction) => ({
          ...transaction,
          amount: await convertValue(transaction.amount, transaction.currency, safeCurrency, convertAmount)
        }))
      );
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
      setPortfolioMetrics(originalMetrics);
    } finally {
      setIsConverting(false);
    }
  };

  const refresh = () => {
    loadPortfolioMetrics();
  };

  useEffect(() => {
    loadPortfolioMetrics(displayCurrency);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (originalMetrics && displayCurrency && originalMetrics.totalValue > 0) {
      convertPortfolioMetrics(displayCurrency);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayCurrency]);

  return (
    <PortfolioMetricsContext.Provider value={{ portfolioMetrics, loading, error, isConverting, refresh }}>
      {children}
    </PortfolioMetricsContext.Provider>
  );
}

export function usePortfolioMetrics() {
  const context = useContext(PortfolioMetricsContext);
  if (context === undefined) {
    throw new Error('usePortfolioMetrics must be used within a PortfolioMetricsProvider');
  }
  return context;
} 