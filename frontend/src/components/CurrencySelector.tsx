import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from './ui/Button'
import { CURRENCIES } from '@/lib/currency'

interface CurrencySelectorProps {
  displayCurrency: string
  onCurrencyChange: (currency: string) => void
  isConverting?: boolean
  onRefresh?: () => void
  loading?: boolean
  className?: string
}

export function CurrencySelector({
  displayCurrency,
  onCurrencyChange,
  isConverting = false,
  onRefresh,
  loading = false,
  className = ''
}: CurrencySelectorProps) {
  const [localCurrency, setLocalCurrency] = useState(displayCurrency)

  // Update local state when prop changes
  useEffect(() => {
    setLocalCurrency(displayCurrency)
  }, [displayCurrency])

  const handleCurrencyChange = (currency: string) => {
    setLocalCurrency(currency)
    onCurrencyChange(currency)
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm text-muted-foreground hidden sm:inline">Display in:</span>
      <select
        value={localCurrency}
        onChange={(e) => handleCurrencyChange(e.target.value)}
        className="px-3 py-1 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        disabled={isConverting}
      >
        {CURRENCIES.map((currency) => (
          <option key={currency.code} value={currency.code}>
            {currency.code} - {currency.symbol}
          </option>
        ))}
      </select>
      {onRefresh && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      )}
    </div>
  )
} 