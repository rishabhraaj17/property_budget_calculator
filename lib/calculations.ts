import { PropertyInput, CalculationResult, PropertyType, StateCharges } from './types'
import { DEFAULTS, LTV_TIERS } from './constants'

/**
 * Get LTV rate based on agreement value and RBI tier guidelines
 */
export function getLtvRate(agreementValue: number): { rate: number; tier: string } {
  for (const tier of LTV_TIERS) {
    if (agreementValue <= tier.maxAmount) {
      return { rate: tier.ltvRate, tier: tier.description }
    }
  }
  const lastTier = LTV_TIERS[LTV_TIERS.length - 1]
  return { rate: lastTier.ltvRate, tier: lastTier.description }
}

/**
 * Get GST rate based on property type and agreement value
 * - Resale: 0%
 * - Builder + Agreement < ₹45L: 1% (affordable)
 * - Builder + Agreement >= ₹45L: 5%
 */
export function getGstRate(
  propertyType: PropertyType,
  agreementValue: number,
  stateCharges?: StateCharges | null
): number {
  if (propertyType === 'resale') {
    return 0
  }

  // Use state-specific rates if available
  if (stateCharges) {
    const affordableLimit = stateCharges.affordableLimit ?? DEFAULTS.AFFORDABLE_THRESHOLD
    if (agreementValue < affordableLimit) {
      return stateCharges.gstRateAffordable ?? DEFAULTS.GST_RATE_AFFORDABLE
    }
    return stateCharges.gstRateStandard ?? DEFAULTS.GST_RATE_STANDARD
  }

  return agreementValue < DEFAULTS.AFFORDABLE_THRESHOLD
    ? DEFAULTS.GST_RATE_AFFORDABLE
    : DEFAULTS.GST_RATE_STANDARD
}

/**
 * Get stamp duty rate based on state
 */
export function getStampDutyRate(stateCharges?: StateCharges | null): number {
  if (stateCharges) {
    return stateCharges.stampDutyRate
  }
  return DEFAULTS.STAMP_DUTY_RATE
}

/**
 * Get registration fee based on state
 * Some states have percentage-based, some have fixed fees
 */
export function getRegistrationFee(
  agreementValue: number,
  stateCharges?: StateCharges | null
): number {
  if (stateCharges) {
    // If registrationFee is 0 and otherCharges exists, it's percentage-based
    if (stateCharges.registrationFee === 0 && stateCharges.otherCharges) {
      return Math.round(agreementValue * stateCharges.otherCharges)
    }
    return stateCharges.registrationFee
  }
  return DEFAULTS.REGISTRATION_FEE
}

/**
 * Calculate EMI using standard formula
 * EMI = P × r × (1 + r)^n / ((1 + r)^n - 1)
 * where P = principal, r = monthly rate, n = number of months
 */
export function calculateEmi(principal: number, annualRate: number, tenureYears: number): number {
  if (principal <= 0 || annualRate <= 0 || tenureYears <= 0) {
    return 0
  }

  const monthlyRate = annualRate / 12
  const numberOfMonths = tenureYears * 12

  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfMonths)) /
    (Math.pow(1 + monthlyRate, numberOfMonths) - 1)

  return Math.round(emi)
}

/**
 * Main calculation function for property investment analysis
 */
export function calculatePropertyCosts(
  input: PropertyInput,
  stateCharges?: StateCharges | null
): CalculationResult {
  const { propertyType, totalDealValue, blackComponent, overrides = {} } = input

  // Calculate white component (agreement value)
  const agreementValue = totalDealValue - blackComponent
  const whiteComponent = agreementValue

  // Track which values are auto-selected vs manually overridden
  const autoSelected = {
    gstRate: overrides.gstRate === undefined,
    stampDutyRate: overrides.stampDutyRate === undefined,
    registrationFee: overrides.registrationFee === undefined,
    ltvRate: overrides.ltvRate === undefined,
  }

  // Get LTV rate with tier description
  const ltvResult = getLtvRate(agreementValue)

  // Get rates (use overrides if provided, else state charges, else defaults)
  const gstRate = overrides.gstRate ?? getGstRate(propertyType, agreementValue, stateCharges)
  const stampDutyRate = overrides.stampDutyRate ?? getStampDutyRate(stateCharges)
  const registrationFee = overrides.registrationFee ?? getRegistrationFee(agreementValue, stateCharges)
  const ltvRate = overrides.ltvRate ?? ltvResult.rate
  const ltvTier = overrides.ltvRate ? 'Custom' : ltvResult.tier
  const interestRate = overrides.interestRate ?? DEFAULTS.INTEREST_RATE
  const tenureYears = overrides.tenureYears ?? DEFAULTS.TENURE_YEARS

  // Calculate government charges (on white component only)
  const gst = propertyType === 'builder' ? Math.round(agreementValue * gstRate) : 0
  const stampDuty = Math.round(agreementValue * stampDutyRate)
  const totalGovtCharges = gst + stampDuty + registrationFee

  // Calculate loan details
  const loanAmount = Math.round(agreementValue * ltvRate)
  const downpayment = agreementValue - loanAmount

  // Calculate out-of-pocket expenses
  const totalOutOfPocket = downpayment + totalGovtCharges + blackComponent

  // Calculate EMI and interest
  const emi = calculateEmi(loanAmount, interestRate, tenureYears)
  const totalLoanPayment = emi * tenureYears * 12
  const totalInterest = totalLoanPayment - loanAmount

  // Total cost of ownership
  const totalCostOfOwnership = totalOutOfPocket + totalLoanPayment

  // Per SqFt calculations (if area provided)
  let costPerSqFt: number | undefined
  let effectiveCostPerSqFt: number | undefined

  if (input.inputMode === 'calculated' && input.areaSqFt && input.areaSqFt > 0) {
    costPerSqFt = Math.round(totalDealValue / input.areaSqFt)
    effectiveCostPerSqFt = Math.round(totalCostOfOwnership / input.areaSqFt)
  }

  return {
    agreementValue,
    whiteComponent,
    blackComponent,
    gst,
    gstRate,
    stampDuty,
    stampDutyRate,
    registrationFee,
    totalGovtCharges,
    ltvRate,
    ltvTier,
    loanAmount,
    downpayment,
    totalOutOfPocket,
    emi,
    totalInterest,
    totalLoanPayment,
    totalCostOfOwnership,
    costPerSqFt,
    effectiveCostPerSqFt,
    autoSelected,
  }
}

/**
 * Format number as Indian currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format number in Indian lakhs/crores notation
 */
export function formatIndianNumber(amount: number): string {
  if (amount >= 10000000) {
    return `${(amount / 10000000).toFixed(2)} Cr`
  } else if (amount >= 100000) {
    return `${(amount / 100000).toFixed(2)} L`
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(2)} K`
  }
  return amount.toFixed(0)
}

/**
 * Format percentage
 */
export function formatPercentage(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`
}

/**
 * Parse Indian number format to actual number
 * e.g., "56.66L" -> 5666000, "1.2Cr" -> 12000000
 */
export function parseIndianNumber(value: string): number {
  const cleaned = value.trim().replace(/,/g, '')
  const match = cleaned.match(/^([\d.]+)\s*(L|Lakh|Lakhs|Cr|Crore|Crores|K)?$/i)

  if (!match) {
    return parseFloat(cleaned) || 0
  }

  const num = parseFloat(match[1])
  const suffix = match[2]?.toLowerCase()

  if (suffix === 'cr' || suffix === 'crore' || suffix === 'crores') {
    return num * 10000000
  } else if (suffix === 'l' || suffix === 'lakh' || suffix === 'lakhs') {
    return num * 100000
  } else if (suffix === 'k') {
    return num * 1000
  }

  return num
}
