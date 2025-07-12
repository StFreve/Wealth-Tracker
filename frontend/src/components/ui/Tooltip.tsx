import React, { useState, useRef, useEffect } from 'react'
import { cn } from '../../lib/utils'

interface TooltipProps {
  children: React.ReactNode
  className?: string
}

interface TooltipContentProps {
  children: React.ReactNode
  className?: string
}

interface TooltipTriggerProps {
  children: React.ReactNode
  asChild?: boolean
  className?: string
}

interface TooltipProviderProps {
  children: React.ReactNode
}

const TooltipContext = React.createContext<{
  showTooltip: boolean
  setShowTooltip: (show: boolean) => void
} | null>(null)

export function TooltipProvider({ children }: TooltipProviderProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  
  return (
    <TooltipContext.Provider value={{ showTooltip, setShowTooltip }}>
      {children}
    </TooltipContext.Provider>
  )
}

export function Tooltip({ children, className }: TooltipProps) {
  return (
    <div className={cn('relative inline-block', className)}>
      {children}
    </div>
  )
}

export function TooltipTrigger({ children, asChild, className }: TooltipTriggerProps) {
  const context = React.useContext(TooltipContext)
  
  if (!context) {
    throw new Error('TooltipTrigger must be used within a TooltipProvider')
  }
  
  const { setShowTooltip } = context
  
  const handleMouseEnter = () => setShowTooltip(true)
  const handleMouseLeave = () => setShowTooltip(false)
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    } as any)
  }
  
  return (
    <div
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  )
}

export function TooltipContent({ children, className }: TooltipContentProps) {
  const context = React.useContext(TooltipContext)
  
  if (!context) {
    throw new Error('TooltipContent must be used within a TooltipProvider')
  }
  
  const { showTooltip } = context
  
  if (!showTooltip) return null
  
  return (
    <div
      className={cn(
        'absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2',
        'bg-popover text-popover-foreground border border-border rounded-md px-3 py-2 text-sm shadow-lg',
        'animate-in fade-in-0 zoom-in-95',
        className
      )}
    >
      {children}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-popover" />
    </div>
  )
}

export default Tooltip 