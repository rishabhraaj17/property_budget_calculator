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
    icon: 'trending-down' | 'wallet' | 'chart-up' | 'alert' | 'info' | 'check'
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

// ============================
// Multi-Property Prepayment Types
// ============================

export interface MultiPropertyLoan {
    id: string
    name: string
    currentPrincipal: number
    interestRate: number           // Annual rate as decimal
    remainingTenureMonths: number
    existingEMI?: number
}

export interface MultiPropertyInput {
    loans: MultiPropertyLoan[]
    totalPrepaymentAmount: number
    prepaymentMonth: number        // Month number when prepayment will be made (1-indexed)
    strategy: 'highest_rate' | 'smallest_balance' | 'manual'
    hasEmergencyFund: boolean
    riskAppetite: 'low' | 'medium' | 'high'
    manualAllocations?: Record<string, number>  // loanId -> percentage (0-100), must sum to 100
}

export interface MultiPropertyAllocation {
    loanId: string
    loanName: string
    interestRate: number
    currentPrincipal: number
    allocatedAmount: number
    interestSavedReduceTenure: number
    tenureReducedMonths: number
    interestSavedReduceEMI: number
    newEMI: number
    originalEMI: number
    originalTotalInterest: number
    newTotalInterestReduceTenure: number
}

export interface MultiPropertyResult {
    allocations: MultiPropertyAllocation[]
    totalInterestSaved: number
    totalTenureReduced: number    // Average tenure reduced across properties
    totalPrepaymentUsed: number
    remainingBudget: number
    strategy: 'highest_rate' | 'smallest_balance' | 'manual'
    strategyExplanation: string
    recommendations: RecommendationType[]
    perPropertyResults: Record<string, OptimizationResult>  // Keyed by loanId
    prepaymentMonth: number
}

