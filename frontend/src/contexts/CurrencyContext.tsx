import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface CurrencyContextType {
  displayCurrency: string
  setDisplayCurrency: (currency: string) => void
  isConverting: boolean
  setIsConverting: (converting: boolean) => void
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

interface CurrencyProviderProps {
  children: ReactNode
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const [displayCurrency, setDisplayCurrencyState] = useState('USD')
  const [isConverting, setIsConverting] = useState(false)

  // Initialize currency from localStorage on mount
  useEffect(() => {
    const savedCurrency = localStorage.getItem('displayCurrency') || 'USD'
    
    // Ensure saved currency is a valid string
    const safeCurrency = typeof savedCurrency === 'string' && savedCurrency.length === 3 ? savedCurrency : 'USD'
    
    // If we had to fix the currency, save the corrected version
    if (safeCurrency !== savedCurrency) {
      localStorage.setItem('displayCurrency', safeCurrency)
    }
    
    setDisplayCurrencyState(safeCurrency)
  }, [])

  const setDisplayCurrency = (currency: string) => {
    // Ensure currency is a string
    const currencyString = typeof currency === 'string' ? currency : String(currency)
    
    // Validate currency code (should be 3 characters)
    if (!currencyString || currencyString.length !== 3) {
      console.error('Invalid currency code:', currencyString)
      return
    }
    
    setDisplayCurrencyState(currencyString)
    localStorage.setItem('displayCurrency', currencyString)
  }

  const value = {
    displayCurrency,
    setDisplayCurrency,
    isConverting,
    setIsConverting
  }

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
} 