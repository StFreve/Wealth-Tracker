import React, { useState } from 'react'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Calculator, TrendingUp, Info, DollarSign, Calendar } from 'lucide-react'
import { 
  calculateDepositValue, 
  formatDepositDuration, 
  getDepositStatus, 
  getInterestTypeInfo,
  calculateAPY
} from '../lib/depositCalculations'

export function InterestTypesDemo() {
  const [principal, setPrincipal] = useState('10000')
  const [years, setYears] = useState('2')
  
  const baseDeposit = {
    principal: parseFloat(principal) || 10000,
    rate: 5.0,
    startDate: '2022-01-01',
    maturityDate: '2024-01-01'
  }
  
  const examples = [
    {
      type: 'simple',
      name: 'Simple Interest',
      description: 'Interest calculated only on principal',
      config: {
        ...baseDeposit,
        interestType: 'simple' as const
      },
      color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
    },
    {
      type: 'compound',
      name: 'Compound Interest (Monthly)',
      description: 'Interest compounds monthly for higher returns',
      config: {
        ...baseDeposit,
        interestType: 'compound' as const,
        compoundingFrequency: 'monthly' as const
      },
      color: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
    },
    {
      type: 'progressive',
      name: 'Progressive Rates',
      description: 'Rates increase over time: 3% → 4% → 6%',
      config: {
        ...baseDeposit,
        interestType: 'progressive' as const,
        compoundingFrequency: 'monthly' as const,
        progressiveRates: [
          { months: 6, rate: 3.0 },
          { months: 6, rate: 4.0 },
          { months: 12, rate: 6.0 }
        ]
      },
      color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
    },
    {
      type: 'variable',
      name: 'Variable Rates',
      description: 'Rates change on specific dates',
      config: {
        ...baseDeposit,
        interestType: 'variable' as const,
        variableRates: [
          { date: '2022-01-01', rate: 4.0 },
          { date: '2022-07-01', rate: 5.0 },
          { date: '2023-01-01', rate: 6.0 },
          { date: '2023-07-01', rate: 5.5 }
        ]
      },
      color: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
    },
    {
      type: 'tiered',
      name: 'Tiered Rates',
      description: 'Different rates based on balance amount',
      config: {
        ...baseDeposit,
        interestType: 'tiered' as const,
        compoundingFrequency: 'monthly' as const,
        tieredRates: [
          { minBalance: 0, maxBalance: 5000, rate: 3.0 },
          { minBalance: 5001, maxBalance: 20000, rate: 5.0 },
          { minBalance: 20001, rate: 7.0 }
        ]
      },
      color: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
    }
  ]
  
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Interest Types Comparison</h2>
        </div>
        
        <p className="text-muted-foreground mb-6">
          Compare how different interest calculation methods affect your deposit returns over time.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">
              <DollarSign className="inline h-4 w-4 mr-1" />
              Principal Amount ($)
            </label>
            <Input
              type="number"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              placeholder="10000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              <Calendar className="inline h-4 w-4 mr-1" />
              Time Period (years)
            </label>
            <Input
              type="number"
              step="0.5"
              value={years}
              onChange={(e) => setYears(e.target.value)}
              placeholder="2"
            />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {examples.map((example) => {
          const maturityDate = new Date()
          maturityDate.setFullYear(maturityDate.getFullYear() + parseFloat(years))
          
          const config = {
            ...example.config,
            principal: parseFloat(principal) || 10000,
            maturityDate: maturityDate.toISOString().split('T')[0]
          }
          
          const result = calculateDepositValue(config, maturityDate)
          const apy = calculateAPY(config.principal, result.currentValue, parseFloat(years))
          
          return (
            <Card key={example.type} className={`p-4 border-2 ${example.color}`}>
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">{example.name}</h3>
                  <p className="text-sm text-muted-foreground">{example.description}</p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Principal:</span>
                    <span className="font-medium">${config.principal.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time Period:</span>
                    <span className="font-medium">{years} years</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Rate:</span>
                    <span className="font-medium">{config.rate.toFixed(1)}%</span>
                  </div>
                  
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-muted-foreground">Final Value:</span>
                    <span className="font-bold text-lg">${result.currentValue.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Interest Earned:</span>
                    <span className="font-medium text-green-600">
                      +${result.accruedInterest.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Effective APY:</span>
                    <span className="font-medium">{apy.toFixed(2)}%</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Return:</span>
                    <span className="font-medium">
                      {((result.accruedInterest / config.principal) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                                 {/* Type-specific details */}
                 {example.type === 'progressive' && (config as any).progressiveRates && (
                   <div className="mt-3 p-2 bg-background rounded text-xs">
                     <div className="font-medium mb-1">Rate Schedule:</div>
                     {(config as any).progressiveRates.map((rate: any, index: number) => (
                       <div key={index} className="flex justify-between">
                         <span>Months {index * 6 + 1}-{(index + 1) * 6}:</span>
                         <span>{rate.rate}%</span>
                       </div>
                     ))}
                   </div>
                 )}
                 
                 {example.type === 'tiered' && (config as any).tieredRates && (
                   <div className="mt-3 p-2 bg-background rounded text-xs">
                     <div className="font-medium mb-1">Rate Tiers:</div>
                     {(config as any).tieredRates.map((tier: any, index: number) => (
                       <div key={index} className="flex justify-between">
                         <span>
                           ${tier.minBalance.toLocaleString()}{tier.maxBalance ? `-$${tier.maxBalance.toLocaleString()}` : '+'}:
                         </span>
                         <span>{tier.rate}%</span>
                       </div>
                     ))}
                     <div className="mt-1 text-muted-foreground">
                       Your balance: ${config.principal.toLocaleString()} → {
                         (config as any).tieredRates.find((tier: any) => 
                           config.principal >= tier.minBalance && 
                           (tier.maxBalance === undefined || config.principal <= tier.maxBalance)
                         )?.rate || (config as any).tieredRates[(config as any).tieredRates.length - 1].rate
                       }%
                     </div>
                   </div>
                 )}
              </div>
            </Card>
          )
        })}
      </div>
      
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Info className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Interest Type Explanations</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">Simple Interest</h4>
            <p className="text-muted-foreground mb-3">
              Interest is calculated only on the original principal amount. Formula: I = P × R × T
            </p>
            
            <h4 className="font-medium mb-2">Compound Interest</h4>
            <p className="text-muted-foreground mb-3">
              Interest is calculated on principal plus accumulated interest. More frequent compounding = higher returns.
            </p>
            
            <h4 className="font-medium mb-2">Progressive Rates</h4>
            <p className="text-muted-foreground">
              Interest rates increase over time according to a predefined schedule. Great for long-term savings incentives.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Variable Rates</h4>
            <p className="text-muted-foreground mb-3">
              Interest rates change on specific dates, often tied to market conditions or central bank rates.
            </p>
            
            <h4 className="font-medium mb-2">Tiered Rates</h4>
            <p className="text-muted-foreground mb-3">
              Different interest rates apply based on your account balance. Higher balances typically earn higher rates.
            </p>
            
            <div className="bg-muted p-3 rounded">
              <div className="font-medium text-primary mb-1">💡 Pro Tip</div>
              <p className="text-xs">
                Compare the "Effective APY" to see which option gives you the best return for your specific amount and time period.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default InterestTypesDemo 