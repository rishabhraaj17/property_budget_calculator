export type PropertyType = 'builder' | 'resale'
export type InputMode = 'calculated' | 'direct'

export interface PropertyOverrides {
  gstRate?: number
  stampDutyRate?: number
  registrationFee?: number
  ltvRate?: number
  interestRate?: number
  tenureYears?: number
}

export interface PropertyInput {
  id: string
  name: string
  propertyType: PropertyType
  inputMode: InputMode
  // For calculated mode
  pricePerSqFt?: number
  areaSqFt?: number
  parkingCost?: number
  // For direct mode or final value
  totalDealValue: number
  blackComponent: number
  overrides: PropertyOverrides
  // State for pre-filled charges
  stateCode?: string
  createdAt: number
  updatedAt: number
}

export interface CalculationResult {
  // Basic values
  agreementValue: number          // White = Total - Black
  whiteComponent: number          // Same as agreementValue
  blackComponent: number          // User input

  // Government charges
  gst: number                     // Only for builder, on white
  gstRate: number                 // Effective GST rate used
  stampDuty: number               // On white
  stampDutyRate: number           // Effective stamp duty rate used
  registrationFee: number
  totalGovtCharges: number

  // Loan details
  ltvRate: number                 // Based on tiers or override
  ltvTier: string                 // Description of which tier was applied
  loanAmount: number              // LTV% of white
  downpayment: number             // White - Loan

  // Out of pocket
  totalOutOfPocket: number        // Downpayment + GovtCharges + Black

  // EMI details
  emi: number                     // Monthly EMI
  totalInterest: number           // Total interest over tenure
  totalLoanPayment: number        // Principal + Interest

  // Summary
  totalCostOfOwnership: number    // OutOfPocket + TotalLoanPayment

  // Per SqFt (if area provided)
  costPerSqFt?: number
  effectiveCostPerSqFt?: number   // Including all charges

  // Auto-selection indicators
  autoSelected: {
    gstRate: boolean
    stampDutyRate: boolean
    registrationFee: boolean
    ltvRate: boolean
  }
}

export interface Property extends PropertyInput {
  calculations: CalculationResult
}

export interface ComparisonProperty {
  property: Property
  selected: boolean
}

// State charges types
export interface StateCharges {
  id: string
  stateCode: string
  stateName: string
  propertyType: 'builder' | 'resale' | 'all'
  stampDutyRate: number
  registrationFee: number
  gstRateAffordable?: number | null
  gstRateStandard?: number | null
  affordableLimit?: number | null
  metroSurcharge?: number | null
  otherCharges?: number | null
  notes?: string | null
  sourceUrl?: string | null
  lastVerified?: string | null
  isSystem: boolean
  userId?: string | null
}

export interface StateOption {
  stateCode: string
  stateName: string
}

// User types
export interface User {
  id: string
  email: string
  name?: string | null
}

// Auth context types
export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

// Tooltip definition
export interface TooltipDefinition {
  term: string
  shortDescription: string
  longDescription: string
  example?: string
  source?: string
}
