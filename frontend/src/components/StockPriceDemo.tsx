import React, { useState } from 'react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Card } from './ui/Card'
import { RefreshCw } from 'lucide-react'
import { useBackendStockPrice } from '../hooks/useBackendStockPrice'
import { formatStockPrice, formatStockPriceChange, isValidStockSymbol } from '../lib/api/marketDataApi'

export function StockPriceDemo() {
  const [ticker, setTicker] = useState('')
  const [searchTicker, setSearchTicker] = useState<string | null>(null)
  const { stockPrice, isLoading, error, refetch } = useBackendStockPrice(searchTicker)

  const handleSearch = () => {
    if (ticker && isValidStockSymbol(ticker)) {
      setSearchTicker(ticker.toUpperCase())
    }
  }

  return (
    <Card className="p-6 max-w-md">
      <h3 className="text-lg font-semibold mb-4">Stock Price Demo</h3>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="Enter ticker (e.g., AAPL, VOO, IWF)"
            className={ticker && !isValidStockSymbol(ticker) ? 'border-red-500' : ''}
          />
          <Button 
            onClick={handleSearch}
            disabled={!ticker || !isValidStockSymbol(ticker)}
          >
            Search
          </Button>
        </div>

        {ticker && !isValidStockSymbol(ticker) && (
          <p className="text-xs text-red-600">
            Invalid ticker symbol. Use 1-5 letters only.
          </p>
        )}

        {searchTicker && (
          <div className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{searchTicker}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={refetch}
                disabled={isLoading}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {isLoading && (
              <div className="text-sm text-muted-foreground">
                Fetching price...
              </div>
            )}

            {error && (
              <div className="text-sm text-red-600">
                Error: {error}
              </div>
            )}

            {stockPrice && (
              <div className="space-y-2">
                <div className="text-lg font-bold">
                  {formatStockPrice(stockPrice)}
                </div>
                {stockPrice.changePercent && (
                  <div className={`text-sm ${
                    stockPrice.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatStockPriceChange(stockPrice)}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Source: {stockPrice.source} • {new Date(stockPrice.timestamp).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

export default StockPriceDemo 