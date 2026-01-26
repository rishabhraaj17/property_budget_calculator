/**
 * Types for the Smart Home Loan Optimizer
 */

export interface LoanOptimizerInput {
    currentPrincipal: number      // Outstanding principal amount
    interestRate: number          // Annual interest rate (as decimal, e.g., 0.085 for 8.5%)
    remainingTenureMonths: number // Remaining tenure in months
    partPaymentAmount: number     // One-time part-payment amount
    prepaymentMonth: number       // Month number when prepayment will be made (1-indexed)
    existingEMI?: number          // Optional: User override for current actual EMI
    hasEmergencyFund: boolean     // Whether user has emergency fund
    riskAppetite: 'low' | 'medium' | 'high' // User's risk appetite for investments
}

export interface AmortizationRow {
    month: number
    year: number
    openingBalance: number
    interestComponent: number
    principalComponent: number
    partPayment: number
    closingBalance: number
    emi: number
}

export interface ScenarioResult {
    type: 'original' | 'reduce_tenure' | 'reduce_emi'
    emi: number
    tenureMonths: number
    totalInterest: number
    totalPayment: number
    completionDate: Date
    interestSaved: number         // Compared to original
    tenureReduced: number         // Months reduced compared to original
    amortizationSchedule: AmortizationRow[]
}

export interface RecommendationType {
    type: 'tenure' | 'emi' | 'invest' | 'warning' | 'info'
    priority: number              // 1 = highest priority
    title: string
    description: string
    icon: 'trending-down' | 'wallet' | 'chart-up' | 'alert' | 'info'
    color: 'success' | 'primary' | 'warning' | 'danger' | 'slate'
}

export interface OptimizationResult {
    original: ScenarioResult
    reduceTenure: ScenarioResult
    reduceEMI: ScenarioResult
    recommendations: RecommendationType[]
    summary: {
        bestOption: 'tenure' | 'emi' | 'invest' | 'none'
        maxInterestSaved: number
        maxTenureReduced: number
    }
}

// Constants for recommendation logic
export const INVESTMENT_BENCHMARK_RETURN = 0.12  // 12% for Nifty 50
export const LOW_INTEREST_THRESHOLD = 0.09       // 9% threshold for prepay vs invest decision
export const FINAL_TENURE_PERCENTAGE = 0.20      // Final 20% of tenure where interest is minimal
