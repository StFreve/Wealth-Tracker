export { PortfolioValueChart } from './PortfolioValueChart';
export { AssetAllocationChart } from './AssetAllocationChart';
export { MonthlyReturnsChart } from './MonthlyReturnsChart';
export { PerformanceMetricsChart } from './PerformanceMetricsChart';

// Re-export chart data types
export type { 
  PortfolioAnalytics, 
  PerformanceAnalytics, 
  AllocationAnalytics, 
  TrendAnalytics, 
  RiskMetrics,
  AssetTypeAllocation,
  CurrencyAllocation,
  RiskLevelAllocation,
  DailyReturn,
  MonthlyReturn,
  YearlyReturn,
  AssetPerformance
} from '../../lib/api/analyticsApi'; 