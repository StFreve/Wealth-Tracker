import { useTranslation } from 'react-i18next'
import { BarChart3, TrendingUp, PieChart, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { formatCurrency, formatPercentage } from '@/lib/utils'

export default function Analytics() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t('analytics.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            Analyze your portfolio performance
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            {t('analytics.timeRange')}
          </Button>
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            {t('analytics.chartType')}
          </Button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t('analytics.portfolioValue')}
              </p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(125450)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t('analytics.totalReturn')}
              </p>
              <p className="text-2xl font-bold text-profit">
                +{formatCurrency(15450)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-profit" />
          </div>
        </Card>

        <Card className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t('analytics.averageReturn')}
              </p>
              <p className="text-2xl font-bold text-profit">
                +{formatPercentage(12.5)}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-profit" />
          </div>
        </Card>

        <Card className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t('analytics.volatility')}
              </p>
              <p className="text-2xl font-bold text-foreground">
                {formatPercentage(8.2)}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {t('analytics.performanceChart')}
          </h3>
          <div className="h-80 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Portfolio Performance</p>
              <p className="text-sm">Chart implementation with Recharts</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {t('analytics.assetAllocation')}
          </h3>
          <div className="h-80 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <PieChart className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Asset Allocation</p>
              <p className="text-sm">Pie chart showing portfolio distribution</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Monthly Returns */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          {t('analytics.monthlyReturns')}
        </h3>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Monthly Returns Breakdown</p>
            <p className="text-sm">Bar chart showing month-over-month performance</p>
          </div>
        </div>
      </Card>

      {/* Risk Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="metric-card">
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {t('analytics.sharpeRatio')}
            </p>
            <p className="text-2xl font-bold text-foreground">1.25</p>
          </div>
        </Card>

        <Card className="metric-card">
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {t('analytics.maxDrawdown')}
            </p>
            <p className="text-2xl font-bold text-loss">
              -{formatPercentage(5.8)}
            </p>
          </div>
        </Card>

        <Card className="metric-card">
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Beta Coefficient
            </p>
            <p className="text-2xl font-bold text-foreground">0.85</p>
          </div>
        </Card>
      </div>
    </div>
  )
} 