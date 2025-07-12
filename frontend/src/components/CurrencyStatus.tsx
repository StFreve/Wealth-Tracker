import React from 'react'
import { RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/Tooltip'
import { useBackendCurrencyRates } from '../hooks/useBackendCurrencyRates'
import { cn } from '../lib/utils'

interface CurrencyStatusProps {
  className?: string
  showDetails?: boolean
  compact?: boolean
}

export function CurrencyStatus({ 
  className, 
  showDetails = true, 
  compact = false 
}: CurrencyStatusProps) {
  const { 
    isLoading, 
    error, 
    lastUpdate, 
    source, 
    age, 
    refresh, 
    isStale 
  } = useBackendCurrencyRates()

  const formatAge = (ageMs: number): string => {
    const minutes = Math.floor(ageMs / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  const getStatusColor = (): string => {
    if (error) return 'destructive'
    if (isStale) return 'warning'
    if (source?.includes('fallback')) return 'secondary'
    return 'success'
  }

  const getStatusIcon = () => {
    if (error) return <AlertCircle className="h-3 w-3" />
    if (isStale) return <Clock className="h-3 w-3" />
    return <CheckCircle className="h-3 w-3" />
  }

  const getStatusText = (): string => {
    if (error) return 'Error'
    if (isStale) return 'Stale'
    if (source?.includes('fallback')) return 'Demo Rates'
    return 'Live'
  }

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant={getStatusColor() as any} className="gap-1">
                {getStatusIcon()}
                {getStatusText()}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                <p>Last updated: {lastUpdate ? formatAge(age) : 'Never'}</p>
                {source && <p>Source: {source}</p>}
                {source?.includes('fallback') && (
                  <p className="text-blue-500">Using demo rates for development</p>
                )}
                {error && <p className="text-red-500">Error: {error}</p>}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={refresh}
          disabled={isLoading}
          className="h-6 w-6 p-0"
        >
          <RefreshCw className={cn('h-3 w-3', isLoading && 'animate-spin')} />
        </Button>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-3 p-3 bg-muted/50 rounded-lg', className)}>
      <div className="flex items-center gap-2">
        <Badge variant={getStatusColor() as any} className="gap-1">
          {getStatusIcon()}
          Exchange Rates: {getStatusText()}
        </Badge>
        
        {showDetails && (
          <div className="text-sm text-muted-foreground">
            {lastUpdate ? (
              <span>Updated {formatAge(age)}</span>
            ) : (
              <span>Not loaded</span>
            )}
            {source && !source.includes('fallback') && (
              <span className="ml-2">• {source}</span>
            )}
            {source?.includes('fallback') && (
              <span className="ml-2">• Demo data</span>
            )}
          </div>
        )}
      </div>
      
      {error && showDetails && (
        <div className="text-sm text-destructive">
          {error}
        </div>
      )}
      
      <div className="flex-1" />
      
      <Button
        variant="outline"
        size="sm"
        onClick={refresh}
        disabled={isLoading}
        className="gap-2"
      >
        <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
        Refresh
      </Button>
    </div>
  )
}

export default CurrencyStatus 