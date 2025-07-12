import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { TrendingUp, DollarSign, PieChart } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { formatCurrency, formatPercentage } from '@/lib/utils'

// Mock widget data
const mockWidgetData = {
  totalValue: 125450.50,
  monthlyChange: 3.2,
  yearlyChange: 15.8,
  assets: [
    { name: 'Stocks', value: 75000, percentage: 60 },
    { name: 'Bonds', value: 25000, percentage: 20 },
    { name: 'Cash', value: 15000, percentage: 12 },
    { name: 'Crypto', value: 10450.50, percentage: 8 }
  ]
}

export default function Widget() {
  const { widgetId } = useParams()
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <TrendingUp className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Portfolio Overview
          </h1>
          <p className="text-muted-foreground">
            Public portfolio widget - {widgetId}
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Portfolio Value
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(mockWidgetData.totalValue)}
                </p>
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Monthly Change
                </p>
                <div className="flex items-center space-x-1">
                  <p className="text-2xl font-bold text-profit">
                    +{formatPercentage(mockWidgetData.monthlyChange)}
                  </p>
                  <TrendingUp className="h-4 w-4 text-profit" />
                </div>
              </div>
              <div className="h-12 w-12 bg-profit/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-profit" />
              </div>
            </div>
          </Card>

          <Card className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Yearly Change
                </p>
                <div className="flex items-center space-x-1">
                  <p className="text-2xl font-bold text-profit">
                    +{formatPercentage(mockWidgetData.yearlyChange)}
                  </p>
                  <TrendingUp className="h-4 w-4 text-profit" />
                </div>
              </div>
              <div className="h-12 w-12 bg-profit/10 rounded-lg flex items-center justify-center">
                <PieChart className="h-6 w-6 text-profit" />
              </div>
            </div>
          </Card>
        </div>

        {/* Asset Allocation */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-6 flex items-center">
            <PieChart className="h-5 w-5 mr-2" />
            Asset Allocation
          </h3>
          
          <div className="space-y-4">
            {mockWidgetData.assets.map((asset, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{
                      backgroundColor: `hsl(${index * 90}, 70%, 50%)`
                    }}
                  />
                  <span className="font-medium text-foreground">
                    {asset.name}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-medium text-foreground">
                    {formatCurrency(asset.value)}
                  </span>
                  <span className="text-sm text-muted-foreground ml-2">
                    ({asset.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex bg-muted rounded-full h-3 overflow-hidden">
              {mockWidgetData.assets.map((asset, index) => (
                <div
                  key={index}
                  className="h-full"
                  style={{
                    width: `${asset.percentage}%`,
                    backgroundColor: `hsl(${index * 90}, 70%, 50%)`
                  }}
                />
              ))}
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Powered by Wealth Tracker • 
            <span className="ml-1">Real-time portfolio tracking</span>
          </p>
        </div>
      </div>
    </div>
  )
} 