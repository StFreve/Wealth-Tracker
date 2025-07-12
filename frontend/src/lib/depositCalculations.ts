// Deposit calculation utilities

export interface DepositInfo {
  principal: number
  rate: number // Annual interest rate as percentage
  startDate: string // ISO date string
  maturityDate?: string // Optional maturity date
  compoundingFrequency?: 'daily' | 'monthly' | 'quarterly' | 'annually'
  interestType?: 'simple' | 'compound' | 'progressive' | 'variable' | 'tiered'
  progressiveRates?: { months: number; rate: number }[] // For progressive interest
  variableRates?: { date: string; rate: number }[] // For variable interest
  tieredRates?: { minBalance: number; maxBalance?: number; rate: number }[] // For tiered interest
}

export interface DepositValue {
  currentValue: number
  accruedInterest: number
  daysElapsed: number
  monthsElapsed: number
  yearsElapsed: number
  isMatured: boolean
  projectedMaturityValue?: number
}

/**
 * Calculate the current value of a deposit based on time elapsed and interest type
 */
export function calculateDepositValue(deposit: DepositInfo, asOfDate: Date = new Date()): DepositValue {
  const startDate = new Date(deposit.startDate)
  const maturityDate = deposit.maturityDate ? new Date(deposit.maturityDate) : null
  
  // Calculate time elapsed
  const timeDiff = asOfDate.getTime() - startDate.getTime()
  const daysElapsed = Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24)))
  const monthsElapsed = Math.max(0, Math.floor(daysElapsed / 30.44)) // Average days per month
  const yearsElapsed = Math.max(0, daysElapsed / 365.25) // Account for leap years
  
  // Check if deposit has matured
  const isMatured = maturityDate ? asOfDate >= maturityDate : false
  const effectiveDate = isMatured && maturityDate ? maturityDate : asOfDate
  const effectiveYears = isMatured && maturityDate ? 
    Math.max(0, (maturityDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : 
    yearsElapsed
  
  const interestType = deposit.interestType || 'compound'
  let currentValue: number
  let projectedMaturityValue: number | undefined
  
  // Calculate based on interest type
  switch (interestType) {
    case 'simple':
      currentValue = calculateSimpleInterestValue(deposit.principal, deposit.rate, effectiveYears)
      if (maturityDate && !isMatured) {
        const maturityYears = Math.max(0, (maturityDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
        projectedMaturityValue = calculateSimpleInterestValue(deposit.principal, deposit.rate, maturityYears)
      }
      break
      
    case 'progressive':
      currentValue = calculateProgressiveInterestValue(deposit, effectiveYears, monthsElapsed)
      if (maturityDate && !isMatured) {
        const maturityYears = Math.max(0, (maturityDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
        const maturityMonths = Math.max(0, Math.floor((maturityDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)))
        projectedMaturityValue = calculateProgressiveInterestValue(deposit, maturityYears, maturityMonths)
      }
      break
      
    case 'variable':
      currentValue = calculateVariableInterestValue(deposit, startDate, effectiveDate)
      if (maturityDate && !isMatured) {
        projectedMaturityValue = calculateVariableInterestValue(deposit, startDate, maturityDate)
      }
      break
      
    case 'tiered':
      currentValue = calculateTieredInterestValue(deposit, effectiveYears)
      if (maturityDate && !isMatured) {
        const maturityYears = Math.max(0, (maturityDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
        projectedMaturityValue = calculateTieredInterestValue(deposit, maturityYears)
      }
      break
      
    case 'compound':
    default:
      currentValue = calculateCompoundInterestValue(deposit, effectiveYears)
      if (maturityDate && !isMatured) {
        const maturityYears = Math.max(0, (maturityDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
        projectedMaturityValue = calculateCompoundInterestValue(deposit, maturityYears)
      }
      break
  }
  
  const accruedInterest = currentValue - deposit.principal
  
  return {
    currentValue: Math.round(currentValue * 100) / 100, // Round to 2 decimal places
    accruedInterest: Math.round(accruedInterest * 100) / 100,
    daysElapsed,
    monthsElapsed,
    yearsElapsed: Math.round(yearsElapsed * 100) / 100,
    isMatured,
    projectedMaturityValue: projectedMaturityValue ? Math.round(projectedMaturityValue * 100) / 100 : undefined
  }
}

/**
 * Calculate simple interest value
 */
export function calculateSimpleInterestValue(principal: number, rate: number, years: number): number {
  return principal * (1 + (rate / 100) * years)
}

/**
 * Calculate simple interest (alternative calculation method)
 */
export function calculateSimpleInterest(principal: number, rate: number, years: number): number {
  return principal * (1 + (rate / 100) * years)
}

/**
 * Calculate compound interest value
 */
export function calculateCompoundInterestValue(deposit: DepositInfo, years: number): number {
  const annualRate = deposit.rate / 100
  const compoundingFrequency = deposit.compoundingFrequency || 'annually'
  
  let compoundingsPerYear = 1
  switch (compoundingFrequency) {
    case 'daily':
      compoundingsPerYear = 365
      break
    case 'monthly':
      compoundingsPerYear = 12
      break
    case 'quarterly':
      compoundingsPerYear = 4
      break
    case 'annually':
      compoundingsPerYear = 1
      break
  }
  
  // A = P(1 + r/n)^(nt)
  return deposit.principal * Math.pow(
    1 + (annualRate / compoundingsPerYear),
    compoundingsPerYear * years
  )
}

/**
 * Calculate progressive interest value (rates increase over time)
 */
export function calculateProgressiveInterestValue(deposit: DepositInfo, years: number, months: number): number {
  if (!deposit.progressiveRates || deposit.progressiveRates.length === 0) {
    return calculateCompoundInterestValue(deposit, years)
  }
  
  let currentValue = deposit.principal
  let remainingMonths = months
  
  // Sort progressive rates by months
  const sortedRates = [...deposit.progressiveRates].sort((a, b) => a.months - b.months)
  
  for (const rateSchedule of sortedRates) {
    if (remainingMonths <= 0) break
    
    const monthsAtThisRate = Math.min(remainingMonths, rateSchedule.months)
    const yearsAtThisRate = monthsAtThisRate / 12
    
    // Apply this rate for the specified period
    const rateForPeriod = rateSchedule.rate / 100
    if (deposit.compoundingFrequency === 'monthly') {
      const monthlyRate = rateForPeriod / 12
      for (let i = 0; i < monthsAtThisRate; i++) {
        currentValue = currentValue * (1 + monthlyRate)
      }
    } else {
      currentValue = currentValue * (1 + rateForPeriod * yearsAtThisRate)
    }
    
    remainingMonths -= monthsAtThisRate
  }
  
  return currentValue
}

/**
 * Calculate variable interest value (rates change at specific dates)
 */
export function calculateVariableInterestValue(deposit: DepositInfo, startDate: Date, endDate: Date): number {
  if (!deposit.variableRates || deposit.variableRates.length === 0) {
    return calculateCompoundInterestValue(deposit, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
  }
  
  let currentValue = deposit.principal
  let currentDate = new Date(startDate)
  
  // Sort variable rates by date
  const sortedRates = [...deposit.variableRates].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  
  for (let i = 0; i < sortedRates.length; i++) {
    const rateChangeDate = new Date(sortedRates[i].date)
    const nextRateChangeDate = i < sortedRates.length - 1 ? new Date(sortedRates[i + 1].date) : endDate
    
    if (rateChangeDate <= endDate && currentDate < rateChangeDate) {
      // Apply current rate until rate change
      const periodEnd = rateChangeDate < endDate ? rateChangeDate : endDate
      const yearsInPeriod = (periodEnd.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
      
      const tempDeposit = { ...deposit, rate: sortedRates[i].rate }
      const valueAtPeriodEnd = calculateCompoundInterestValue(tempDeposit, yearsInPeriod)
      const growth = valueAtPeriodEnd - tempDeposit.principal
      currentValue += growth
      
      currentDate = periodEnd
    }
    
    if (currentDate >= endDate) break
  }
  
  return currentValue
}

/**
 * Calculate tiered interest value (different rates for different balance ranges)
 */
export function calculateTieredInterestValue(deposit: DepositInfo, years: number): number {
  if (!deposit.tieredRates || deposit.tieredRates.length === 0) {
    return calculateCompoundInterestValue(deposit, years)
  }
  
  // Find applicable tier based on principal amount
  const applicableTier = deposit.tieredRates.find(tier => {
    return deposit.principal >= tier.minBalance && 
           (tier.maxBalance === undefined || deposit.principal <= tier.maxBalance)
  })
  
  if (!applicableTier) {
    // If no tier matches, use the highest tier or default rate
    const highestTier = deposit.tieredRates[deposit.tieredRates.length - 1]
    const tempDeposit = { ...deposit, rate: highestTier.rate }
    return calculateCompoundInterestValue(tempDeposit, years)
  }
  
  // Use the rate from the applicable tier
  const tempDeposit = { ...deposit, rate: applicableTier.rate }
  return calculateCompoundInterestValue(tempDeposit, years)
}

/**
 * Calculate effective annual rate for different compounding frequencies
 */
export function calculateEffectiveAnnualRate(nominalRate: number, compoundingFrequency: number): number {
  return Math.pow(1 + (nominalRate / compoundingFrequency), compoundingFrequency) - 1
}

/**
 * Format deposit duration for display
 */
export function formatDepositDuration(depositValue: DepositValue): string {
  const { yearsElapsed, monthsElapsed, daysElapsed } = depositValue
  
  if (yearsElapsed >= 1) {
    const years = Math.floor(yearsElapsed)
    const remainingMonths = Math.floor((yearsElapsed - years) * 12)
    
    if (remainingMonths > 0) {
      return `${years} year${years !== 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`
    } else {
      return `${years} year${years !== 1 ? 's' : ''}`
    }
  } else if (monthsElapsed >= 1) {
    return `${monthsElapsed} month${monthsElapsed !== 1 ? 's' : ''}`
  } else {
    return `${daysElapsed} day${daysElapsed !== 1 ? 's' : ''}`
  }
}

/**
 * Calculate monthly interest rate for recurring deposits
 */
export function calculateMonthlyInterestRate(annualRate: number): number {
  return annualRate / 12 / 100
}

/**
 * Calculate future value of recurring deposits (SIP)
 */
export function calculateRecurringDepositValue(
  monthlyAmount: number,
  annualRate: number,
  months: number
): number {
  const monthlyRate = calculateMonthlyInterestRate(annualRate)
  
  if (monthlyRate === 0) {
    return monthlyAmount * months
  }
  
  // Future value of annuity formula: PMT * (((1 + r)^n - 1) / r)
  const futureValue = monthlyAmount * (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate
  
  return Math.round(futureValue * 100) / 100
}

/**
 * Get deposit status text
 */
export function getDepositStatus(depositValue: DepositValue): string {
  if (depositValue.isMatured) {
    return 'Matured'
  }
  
  if (depositValue.yearsElapsed < 0.1) {
    return 'Recently Started'
  }
  
  return 'Active'
}

/**
 * Calculate annual percentage yield (APY)
 */
export function calculateAPY(
  principal: number,
  finalAmount: number,
  years: number
): number {
  if (years <= 0) return 0
  
  const apy = (Math.pow(finalAmount / principal, 1 / years) - 1) * 100
  return Math.round(apy * 100) / 100
}

/**
 * Get interest type information
 */
export function getInterestTypeInfo(interestType: string): { name: string; description: string } {
  switch (interestType) {
    case 'simple':
      return {
        name: 'Simple Interest',
        description: 'Interest calculated only on the principal amount. I = P × R × T'
      }
    case 'compound':
      return {
        name: 'Compound Interest',
        description: 'Interest calculated on principal plus accumulated interest. More frequent compounding = higher returns'
      }
    case 'progressive':
      return {
        name: 'Progressive Interest',
        description: 'Interest rate increases over time based on predefined schedule'
      }
    case 'variable':
      return {
        name: 'Variable Interest',
        description: 'Interest rate changes at specific dates based on market conditions'
      }
    case 'tiered':
      return {
        name: 'Tiered Interest',
        description: 'Different interest rates apply based on balance ranges'
      }
    default:
      return {
        name: 'Standard Interest',
        description: 'Standard interest calculation'
      }
  }
}

/**
 * Get default progressive rates example
 */
export function getDefaultProgressiveRates(): { months: number; rate: number }[] {
  return [
    { months: 6, rate: 3.0 },
    { months: 6, rate: 4.0 },
    { months: 12, rate: 5.0 }
  ]
}

/**
 * Get default tiered rates example
 */
export function getDefaultTieredRates(): { minBalance: number; maxBalance?: number; rate: number }[] {
  return [
    { minBalance: 0, maxBalance: 10000, rate: 3.0 },
    { minBalance: 10001, maxBalance: 50000, rate: 4.0 },
    { minBalance: 50001, rate: 5.0 }
  ]
} 