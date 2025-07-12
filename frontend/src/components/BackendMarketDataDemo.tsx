import React, { useState } from 'react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Input } from './ui/Input'
import { RefreshCw, DollarSign, TrendingUp, Clock, Server, AlertCircle, CheckCircle } from 'lucide-react'
import { useBackendCurrencyRates } from '../hooks/useBackendCurrencyRates'
import { useBackendStockPrice, useMultipleStockPrices } from '../hooks/useBackendStockPrice'
import { formatStockPrice, formatStockPriceChange } from '../lib/api/marketDataApi'

export function BackendMarketDataDemo() {
  const [stockSymbol, setStockSymbol] = useState('AAPL')
  const [stockSymbols, setStockSymbols] = useState(['AAPL', 'MSFT', 'GOOGL'])
  const [conversionAmount, setConversionAmount] = useState(100)
  const [fromCurrency, setFromCurrency] = useState('USD')
  const [toCurrency, setToCurrency] = useState('EUR')
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null)

  // Hooks
  const { 
    rates, 
    isLoading: currencyLoading, 
    error: currencyError, 
    lastUpdate: currencyLastUpdate, 
    source: currencySource,
    age: currencyAge,
    refresh: refreshCurrency,
    convertAmount,
    isStale: currencyStale
  } = useBackendCurrencyRates()

  const { 
    stockPrice, 
    isLoading: stockLoading, 
    error: stockError, 
    refetch: refetchStock,
    lastUpdated: stockLastUpdated,
    isStale: stockStale
  } = useBackendStockPrice(stockSymbol)

  const {
    stockPrices,
    isLoading: multipleStocksLoading,
    error: multipleStocksError,
    refetch: refetchMultiple,
    lastUpdated: multipleLastUpdated
  } = useMultipleStockPrices(stockSymbols)

  // Helper functions
  const formatAge = (ageMs: number): string => {
    const minutes = Math.floor(ageMs / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    if (hours > 0) return `${hours}h ${minutes % 60}m ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  const handleConvert = async () => {
    try {
      const result = await convertAmount(conversionAmount, fromCurrency, toCurrency)
      setConvertedAmount(result)
    } catch (error) {
      console.error('Conversion failed:', error)
    }
  }

  const getStatusIcon = (isStale: boolean, error: string | null) => {
    if (error) return <AlertCircle className="h-4 w-4 text-red-500" />
    if (isStale) return <Clock className="h-4 w-4 text-yellow-500" />
    return <CheckCircle className="h-4 w-4 text-green-500" />
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Server className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Backend Market Data Integration</h3>
        </div>
        
        <div className="text-sm text-muted-foreground mb-4">
          <p>✅ Currency rates and stock prices are now fetched from backend</p>
          <p>✅ Data is cached for 15 minutes</p>
          <p>✅ Scheduled updates every 15 minutes</p>
          <p>✅ Last update timestamps displayed</p>
        </div>
      </Card>

      {/* Currency Rates Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <h4 className="text-md font-semibold">Currency Rates</h4>
            {getStatusIcon(currencyStale, currencyError)}
          </div>
          <Button 
            onClick={refreshCurrency} 
            disabled={currencyLoading}
            size="sm"
            variant="outline"
          >
            {currencyLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>

        {currencyLastUpdate && (
          <div className="text-sm text-muted-foreground mb-3">
            <p>Last updated: {currencyLastUpdate.toLocaleString()}</p>
            <p>Age: {formatAge(currencyAge)} • Source: {currencySource}</p>
            {currencyStale && <p className="text-yellow-600">⚠️ Data is stale (older than 15 minutes)</p>}
          </div>
        )}

        {currencyError && (
          <div className="text-sm text-red-600 mb-3">
            Error: {currencyError}
          </div>
        )}

        {rates && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-4">
            {Object.entries(rates).slice(0, 8).map(([code, rate]) => (
              <div key={code} className="flex justify-between bg-muted p-2 rounded">
                <span>{code}:</span>
                <span>{typeof rate === 'number' ? rate.toFixed(4) : 'N/A'}</span>
              </div>
            ))}
          </div>
        )}

        {/* Currency Conversion */}
        <div className="border-t pt-4">
          <h5 className="font-medium mb-3">Currency Conversion</h5>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
            <Input
              type="number"
              value={conversionAmount}
              onChange={(e) => setConversionAmount(Number(e.target.value))}
              placeholder="Amount"
            />
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background"
            >
              {rates && Object.keys(rates).map(currency => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
            <span className="flex items-center justify-center">→</span>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background"
            >
              {rates && Object.keys(rates).map(currency => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
            <Button onClick={handleConvert} size="sm">
              Convert
            </Button>
          </div>
          {convertedAmount !== null && (
            <div className="text-sm bg-green-50 dark:bg-green-900/20 p-2 rounded">
              {conversionAmount} {fromCurrency} = {convertedAmount.toFixed(2)} {toCurrency}
            </div>
          )}
        </div>
      </Card>

      {/* Single Stock Price Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h4 className="text-md font-semibold">Stock Price</h4>
            {getStatusIcon(stockStale, stockError)}
          </div>
          <Button 
            onClick={refetchStock} 
            disabled={stockLoading}
            size="sm"
            variant="outline"
          >
            {stockLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <Input
            value={stockSymbol}
            onChange={(e) => setStockSymbol(e.target.value.toUpperCase())}
            placeholder="Stock Symbol (e.g., AAPL)"
          />
        </div>

        {stockLastUpdated && (
          <div className="text-sm text-muted-foreground mb-3">
            <p>Last updated: {stockLastUpdated.toLocaleString()}</p>
            {stockStale && <p className="text-yellow-600">⚠️ Data is stale (older than 15 minutes)</p>}
          </div>
        )}

        {stockError && (
          <div className="text-sm text-red-600 mb-3">
            Error: {stockError}
          </div>
        )}

        {stockPrice && (
          <div className="bg-muted p-4 rounded">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-semibold">{stockPrice.symbol}</h5>
                <p className="text-2xl font-bold">{formatStockPrice(stockPrice)}</p>
              </div>
              <div className="text-right">
                <p className={`font-medium ${stockPrice.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatStockPriceChange(stockPrice)}
                </p>
                <p className="text-sm text-muted-foreground">Source: {stockPrice.source}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Multiple Stocks Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-semibold">Multiple Stock Prices</h4>
          <Button 
            onClick={refetchMultiple} 
            disabled={multipleStocksLoading}
            size="sm"
            variant="outline"
          >
            {multipleStocksLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>

        {multipleLastUpdated && (
          <div className="text-sm text-muted-foreground mb-3">
            <p>Last updated: {multipleLastUpdated.toLocaleString()}</p>
          </div>
        )}

        {multipleStocksError && (
          <div className="text-sm text-red-600 mb-3">
            Error: {multipleStocksError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(stockPrices).map(([symbol, price]) => (
            <div key={symbol} className="bg-muted p-3 rounded">
              <div className="flex justify-between items-start">
                <div>
                  <h6 className="font-medium">{symbol}</h6>
                  <p className="text-lg font-bold">{formatStockPrice(price)}</p>
                </div>
                <p className={`text-sm font-medium ${price.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {price.change >= 0 ? '+' : ''}{price.changePercent.toFixed(2)}%
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(price.lastUpdated).toLocaleTimeString()}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default BackendMarketDataDemo 