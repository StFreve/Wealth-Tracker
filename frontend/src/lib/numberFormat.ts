/**
 * Format a number with thousands separators (commas)
 * @param value - The number to format
 * @returns Formatted string with comma separators
 */
export function formatWithCommas(value: number | string): string {
  if (value === '' || value === null || value === undefined) {
    return ''
  }
  
  const numStr = value.toString()
  const parts = numStr.split('.')
  
  // Format the integer part with commas
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  
  return parts.join('.')
}

/**
 * Remove commas from a formatted number string
 * @param value - The formatted string with commas
 * @returns Clean number string
 */
export function removeCommas(value: string): string {
  return value.replace(/,/g, '')
}

/**
 * Format a number for display in input fields
 * @param value - The number to format
 * @returns Formatted string suitable for input fields
 */
export function formatNumberForInput(value: number | string): string {
  if (value === '' || value === null || value === undefined) {
    return ''
  }
  
  const numStr = value.toString()
  const num = parseFloat(numStr)
  
  if (isNaN(num)) {
    return ''
  }
  
  // Format with up to 4 decimal places and thousands separators
  return formatWithCommas(num.toFixed(4).replace(/\.?0+$/, ''))
}

/**
 * Parse a formatted number string back to a number
 * @param value - The formatted string
 * @returns The parsed number or 0 if invalid
 */
export function parseFormattedNumber(value: string): number {
  if (!value || value === '') {
    return 0
  }
  
  const cleaned = removeCommas(value)
  const parsed = parseFloat(cleaned)
  
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Handle input change for number fields with formatting
 * @param value - The raw input value
 * @param setter - The state setter function
 */
export function handleNumberInputChange(value: string, setter: (value: string) => void) {
  // Remove commas and validate
  const cleaned = removeCommas(value)
  
  // Allow empty string, numbers, and decimal points
  if (cleaned === '' || /^\d*\.?\d*$/.test(cleaned)) {
    // Format and set the value
    const formatted = cleaned === '' ? '' : formatWithCommas(cleaned)
    setter(formatted)
  }
}

/**
 * Format currency for display
 * @param amount - The amount to format
 * @param currency - The currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Format a percentage value
 * @param value - The percentage value
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value / 100)
} 