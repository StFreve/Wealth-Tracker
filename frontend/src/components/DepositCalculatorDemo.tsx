import React, { useState } from 'react'
import { Card } from './ui/Card'
import { Input } from './ui/Input'
import { Button } from './ui/Button'
import { Calculator, Calendar, TrendingUp, Clock } from 'lucide-react'
import { 
  calculateDepositValue, 
  formatDepositDuration, 
  getDepositStatus,
  calculateAPY
} from '../lib/depositCalculations'

export function DepositCalculatorDemo() {
  const [depositInfo, setDepositInfo] = useState({
    principal: '10000',
    rate: '5.5',
    startDate: '2023-01-01',
    maturityDate: '2025-01-01',
    compoundingFrequency: 'monthly' as 'daily' | 'monthly' | 'quarterly' | 'annually'
  })

  const handleInputChange = (field: string, value: string) => {
    setDepositInfo(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const depositValue = calculateDepositValue({
    principal: parseFloat(depositInfo.principal) || 0,
    rate: parseFloat(depositInfo.rate) || 0,
    startDate: depositInfo.startDate,
    maturityDate: depositInfo.maturityDate || undefined,
    compoundingFrequency: depositInfo.compoundingFrequency
  })

  const apy = calculateAPY(
    parseFloat(depositInfo.principal) || 0,
    depositValue.currentValue,
    depositValue.yearsElapsed
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Calculator className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Deposit Calculator Demo</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">
              Principal Amount ($)
            </label>
            <Input
              type="number"
              value={depositInfo.principal}
              onChange={(e) => handleInputChange('principal', e.target.value)}
              placeholder="10000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Interest Rate (% per year)
            </label>
            <Input
              type="number"
              step="0.1"
              value={depositInfo.rate}
              onChange={(e) => handleInputChange('rate', e.target.value)}
              placeholder="5.5"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">
              <Calendar className="inline h-4 w-4 mr-1" />
              Start Date
            </label>
            <Input
              type="date"
              value={depositInfo.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Maturity Date (Optional)
            </label>
            <Input
              type="date"
              value={depositInfo.maturityDate}
              onChange={(e) => handleInputChange('maturityDate', e.target.value)}
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">
            Compounding Frequency
          </label>
          <select
            value={depositInfo.compoundingFrequency}
            onChange={(e) => handleInputChange('compoundingFrequency', e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annually">Annually</option>
          </select>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold">Calculation Results</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
                Current Value
              </div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                ${depositValue.currentValue.toLocaleString()}
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">
                Interest Earned
              </div>
              <div className="text-xl font-bold text-green-700 dark:text-green-300">
                ${depositValue.accruedInterest.toLocaleString()}
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">
                Effective APY
              </div>
              <div className="text-xl font-bold text-purple-700 dark:text-purple-300">
                {apy.toFixed(2)}%
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">
                <Clock className="h-4 w-4" />
                Duration
              </div>
              <div className="text-lg font-semibold">
                {formatDepositDuration(depositValue)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {depositValue.daysElapsed} days elapsed
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">
                Status
              </div>
              <div className={`text-lg font-semibold ${
                depositValue.isMatured ? 'text-blue-600' : 'text-green-600'
              }`}>
                {getDepositStatus(depositValue)}
              </div>
            </div>

            {depositValue.projectedMaturityValue && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <div className="text-sm text-yellow-600 dark:text-yellow-400 font-medium mb-1">
                  Projected Maturity Value
                </div>
                <div className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                  ${depositValue.projectedMaturityValue.toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Summary</h4>
          <div className="text-sm space-y-1">
            <div>
              <strong>Principal:</strong> ${parseFloat(depositInfo.principal).toLocaleString()}
            </div>
            <div>
              <strong>Interest Rate:</strong> {depositInfo.rate}% annually
            </div>
            <div>
              <strong>Compounding:</strong> {depositInfo.compoundingFrequency}
            </div>
            <div>
              <strong>Time Period:</strong> {formatDepositDuration(depositValue)}
            </div>
            <div className="pt-2 border-t">
              <strong>Growth:</strong> ${depositValue.accruedInterest.toLocaleString()} ({((depositValue.accruedInterest / parseFloat(depositInfo.principal)) * 100).toFixed(2)}%)
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default DepositCalculatorDemo 