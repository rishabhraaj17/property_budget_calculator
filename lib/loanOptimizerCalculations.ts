/**
 * Loan Optimizer Calculations
 * Uses monthly reducing balance method standard in Indian banking system
 */

import {
    LoanOptimizerInput,
    AmortizationRow,
    ScenarioResult,
    RecommendationType,
    OptimizationResult,
    INVESTMENT_BENCHMARK_RETURN,
    LOW_INTEREST_THRESHOLD,
    FINAL_TENURE_PERCENTAGE,
} from './loanOptimizerTypes'
import { formatCurrency, formatIndianNumber } from './calculations'

/**
 * Calculate EMI using standard reducing balance formula
 * EMI = P × r × (1 + r)^n / ((1 + r)^n - 1)
 */
export function calculateEMI(
    principal: number,
    annualRate: number,
    tenureMonths: number
): number {
    if (principal <= 0 || annualRate <= 0 || tenureMonths <= 0) {
        return 0
    }

    const monthlyRate = annualRate / 12
    const emi =
        (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
        (Math.pow(1 + monthlyRate, tenureMonths) - 1)

    return Math.round(emi)
}

/**
 * Calculate remaining tenure after a part-payment with same EMI
 * Uses logarithmic formula to find new n
 */
export function calculateNewTenure(
    principal: number,
    annualRate: number,
    emi: number
): number {
    if (principal <= 0 || annualRate <= 0 || emi <= 0) {
        return 0
    }

    const monthlyRate = annualRate / 12

    // Check if EMI is sufficient to cover at least the interest
    if (emi <= principal * monthlyRate) {
        return Infinity // EMI too low
    }

    // n = log(EMI / (EMI - P*r)) / log(1 + r)
    const n = Math.log(emi / (emi - principal * monthlyRate)) / Math.log(1 + monthlyRate)

    return Math.ceil(n)
}

/**
 * Generate month-by-month amortization schedule
 */
export function generateAmortizationSchedule(
    principal: number,
    annualRate: number,
    tenureMonths: number,
    emi: number,
    partPaymentAmount: number = 0,
    prepaymentMonth: number = 0,
    startDate: Date = new Date()
): AmortizationRow[] {
    const schedule: AmortizationRow[] = []
    const monthlyRate = annualRate / 12
    let balance = principal
    let currentDate = new Date(startDate)

    for (let month = 1; balance > 0 && month <= tenureMonths + 120; month++) {
        const openingBalance = balance
        const interestComponent = Math.round(balance * monthlyRate)
        let principalComponent = Math.min(emi - interestComponent, balance)
        let partPayment = 0

        // Apply part-payment if this is the prepayment month
        if (month === prepaymentMonth && partPaymentAmount > 0) {
            partPayment = Math.min(partPaymentAmount, balance - principalComponent)
        }

        const closingBalance = Math.max(0, openingBalance - principalComponent - partPayment)

        schedule.push({
            month,
            year: Math.ceil(month / 12),
            openingBalance: Math.round(openingBalance),
            interestComponent,
            principalComponent: Math.round(principalComponent),
            partPayment: Math.round(partPayment),
            closingBalance: Math.round(closingBalance),
            emi: Math.round(Math.min(emi, openingBalance + interestComponent)),
        })

        balance = closingBalance
        currentDate.setMonth(currentDate.getMonth() + 1)

        if (balance <= 0) break
    }

    return schedule
}

/**
 * Calculate the original scenario without any prepayment
 */
export function calculateOriginalScenario(
    input: LoanOptimizerInput,
    startDate: Date = new Date()
): ScenarioResult {
    const emi = calculateEMI(input.currentPrincipal, input.interestRate, input.remainingTenureMonths)
    const schedule = generateAmortizationSchedule(
        input.currentPrincipal,
        input.interestRate,
        input.remainingTenureMonths,
        emi,
        0,
        0,
        startDate
    )

    const totalInterest = schedule.reduce((sum, row) => sum + row.interestComponent, 0)
    const totalPayment = schedule.reduce((sum, row) => sum + row.emi + row.partPayment, 0)

    const completionDate = new Date(startDate)
    completionDate.setMonth(completionDate.getMonth() + schedule.length)

    return {
        type: 'original',
        emi,
        tenureMonths: schedule.length,
        totalInterest,
        totalPayment,
        completionDate,
        interestSaved: 0,
        tenureReduced: 0,
        amortizationSchedule: schedule,
    }
}

/**
 * Calculate Reduce Tenure scenario
 * After part-payment, keep EMI same but reduce tenure
 */
export function calculateReduceTenureScenario(
    input: LoanOptimizerInput,
    originalScenario: ScenarioResult,
    startDate: Date = new Date()
): ScenarioResult {
    const originalEMI = originalScenario.emi

    // Generate schedule with part-payment
    const schedule = generateAmortizationSchedule(
        input.currentPrincipal,
        input.interestRate,
        input.remainingTenureMonths + 120, // Allow extra months for calculation
        originalEMI,
        input.partPaymentAmount,
        input.prepaymentMonth,
        startDate
    )

    const totalInterest = schedule.reduce((sum, row) => sum + row.interestComponent, 0)
    const totalPayment = schedule.reduce((sum, row) => sum + row.emi + row.partPayment, 0)

    const completionDate = new Date(startDate)
    completionDate.setMonth(completionDate.getMonth() + schedule.length)

    return {
        type: 'reduce_tenure',
        emi: originalEMI,
        tenureMonths: schedule.length,
        totalInterest,
        totalPayment,
        completionDate,
        interestSaved: originalScenario.totalInterest - totalInterest,
        tenureReduced: originalScenario.tenureMonths - schedule.length,
        amortizationSchedule: schedule,
    }
}

/**
 * Calculate Reduce EMI scenario
 * After part-payment, keep tenure same but reduce EMI
 */
export function calculateReduceEMIScenario(
    input: LoanOptimizerInput,
    originalScenario: ScenarioResult,
    startDate: Date = new Date()
): ScenarioResult {
    // Calculate remaining principal after prepayment month
    let remainingPrincipal = input.currentPrincipal
    const monthlyRate = input.interestRate / 12
    const originalEMI = originalScenario.emi

    // Simulate until prepayment month
    for (let month = 1; month < input.prepaymentMonth; month++) {
        const interest = remainingPrincipal * monthlyRate
        const principal = originalEMI - interest
        remainingPrincipal -= principal
    }

    // Apply part-payment
    remainingPrincipal -= input.partPaymentAmount
    remainingPrincipal = Math.max(0, remainingPrincipal)

    // Calculate remaining tenure after prepayment
    const remainingTenure = input.remainingTenureMonths - input.prepaymentMonth + 1

    // Calculate new EMI for remaining tenure
    const newEMI = calculateEMI(remainingPrincipal, input.interestRate, remainingTenure)

    // Generate two-phase schedule
    // Phase 1: Before prepayment (original EMI)
    const phase1 = generateAmortizationSchedule(
        input.currentPrincipal,
        input.interestRate,
        input.prepaymentMonth - 1,
        originalEMI,
        0,
        0,
        startDate
    )

    // Phase 2: After prepayment (new EMI)
    const phase2Start = new Date(startDate)
    phase2Start.setMonth(phase2Start.getMonth() + input.prepaymentMonth - 1)

    // Get balance at prepayment point
    const balanceAtPrepayment = phase1.length > 0
        ? phase1[phase1.length - 1].closingBalance - input.partPaymentAmount
        : input.currentPrincipal - input.partPaymentAmount

    const phase2 = generateAmortizationSchedule(
        Math.max(0, balanceAtPrepayment),
        input.interestRate,
        remainingTenure,
        newEMI,
        0,
        0,
        phase2Start
    )

    // Combine schedules and renumber months
    const schedule: AmortizationRow[] = [
        ...phase1,
        // Add prepayment row
        ...(input.prepaymentMonth <= input.remainingTenureMonths ? [{
            month: input.prepaymentMonth,
            year: Math.ceil(input.prepaymentMonth / 12),
            openingBalance: phase1.length > 0 ? phase1[phase1.length - 1].closingBalance : input.currentPrincipal,
            interestComponent: Math.round((phase1.length > 0 ? phase1[phase1.length - 1].closingBalance : input.currentPrincipal) * monthlyRate),
            principalComponent: Math.round(originalEMI - (phase1.length > 0 ? phase1[phase1.length - 1].closingBalance : input.currentPrincipal) * monthlyRate),
            partPayment: input.partPaymentAmount,
            closingBalance: Math.max(0, balanceAtPrepayment),
            emi: originalEMI,
        }] : []),
        ...phase2.map((row, index) => ({
            ...row,
            month: input.prepaymentMonth + index + 1,
            year: Math.ceil((input.prepaymentMonth + index + 1) / 12),
        })),
    ]

    const totalInterest = schedule.reduce((sum, row) => sum + row.interestComponent, 0)
    const totalPayment = schedule.reduce((sum, row) => sum + row.emi + row.partPayment, 0)

    const completionDate = new Date(startDate)
    completionDate.setMonth(completionDate.getMonth() + schedule.length)

    return {
        type: 'reduce_emi',
        emi: newEMI,
        tenureMonths: schedule.length,
        totalInterest,
        totalPayment,
        completionDate,
        interestSaved: originalScenario.totalInterest - totalInterest,
        tenureReduced: originalScenario.tenureMonths - schedule.length,
        amortizationSchedule: schedule,
    }
}

/**
 * Generate smart recommendations based on user input and scenarios
 */
export function generateRecommendations(
    input: LoanOptimizerInput,
    original: ScenarioResult,
    reduceTenure: ScenarioResult,
    reduceEMI: ScenarioResult
): RecommendationType[] {
    const recommendations: RecommendationType[] = []

    // Calculate what percentage of loan tenure is remaining
    const originalTotalTenure = input.remainingTenureMonths + (original.tenureMonths - input.remainingTenureMonths)
    const percentageRemaining = input.remainingTenureMonths / originalTotalTenure

    // Rule 1: Check if in final 20% of loan (minimal interest benefit)
    if (percentageRemaining <= FINAL_TENURE_PERCENTAGE) {
        recommendations.push({
            type: 'warning',
            priority: 1,
            title: 'Limited Prepayment Benefit',
            description: `You're in the final ${Math.round(percentageRemaining * 100)}% of your loan tenure. At this stage, most of your EMI goes toward principal, so prepayment saves less interest. Consider investing the ₹${formatIndianNumber(input.partPaymentAmount)} instead.`,
            icon: 'alert',
            color: 'warning',
        })
    }

    // Rule 2: Check emergency fund status
    if (!input.hasEmergencyFund) {
        recommendations.push({
            type: 'warning',
            priority: 2,
            title: 'Build Emergency Fund First',
            description: 'Financial experts recommend having 6-12 months of expenses saved before making loan prepayments. Consider building your emergency fund before prepaying your loan.',
            icon: 'alert',
            color: 'danger',
        })
    }

    // Rule 3: Prepay vs Invest analysis
    if (input.interestRate < LOW_INTEREST_THRESHOLD && input.riskAppetite === 'high') {
        const potentialInvestmentReturn = input.partPaymentAmount * INVESTMENT_BENCHMARK_RETURN * (input.remainingTenureMonths / 12)
        recommendations.push({
            type: 'invest',
            priority: 3,
            title: 'Consider Investing Instead',
            description: `Your loan rate (${(input.interestRate * 100).toFixed(1)}%) is below 9%. With a high-risk appetite, investing in equity (avg ~12% returns) could yield ₹${formatIndianNumber(potentialInvestmentReturn)} over your loan tenure, potentially more than interest saved (₹${formatIndianNumber(reduceTenure.interestSaved)}).`,
            icon: 'chart-up',
            color: 'primary',
        })
    } else if (input.interestRate >= LOW_INTEREST_THRESHOLD) {
        recommendations.push({
            type: 'info',
            priority: 3,
            title: 'Prepayment is Beneficial',
            description: `At ${(input.interestRate * 100).toFixed(1)}% interest rate, prepaying your loan is generally more beneficial than investing, as guaranteed loan interest savings often outweigh uncertain investment returns.`,
            icon: 'info',
            color: 'success',
        })
    }

    // Rule 4: Tenure vs EMI reduction recommendation
    if (reduceTenure.interestSaved > reduceEMI.interestSaved) {
        const additionalSavings = reduceTenure.interestSaved - reduceEMI.interestSaved
        recommendations.push({
            type: 'tenure',
            priority: 4,
            title: 'Recommended: Reduce Tenure',
            description: `Opting for tenure reduction saves ₹${formatIndianNumber(additionalSavings)} more in interest compared to EMI reduction. You'll also be debt-free ${reduceTenure.tenureReduced} months earlier.`,
            icon: 'trending-down',
            color: 'success',
        })
    }

    // Rule 5: EMI reduction for cash flow
    if (reduceEMI.interestSaved > 0) {
        const emiDifference = original.emi - reduceEMI.emi
        recommendations.push({
            type: 'emi',
            priority: 5,
            title: 'For Better Cash Flow: Reduce EMI',
            description: `If monthly cash flow is a priority, reducing EMI saves ₹${formatIndianNumber(emiDifference)} per month. You'll still save ₹${formatIndianNumber(reduceEMI.interestSaved)} in total interest.`,
            icon: 'wallet',
            color: 'primary',
        })
    }

    // Sort by priority
    return recommendations.sort((a, b) => a.priority - b.priority)
}

/**
 * Main function to calculate all optimization results
 */
export function calculateOptimization(input: LoanOptimizerInput): OptimizationResult {
    const startDate = new Date()

    const original = calculateOriginalScenario(input, startDate)
    const reduceTenure = calculateReduceTenureScenario(input, original, startDate)
    const reduceEMI = calculateReduceEMIScenario(input, original, startDate)
    const recommendations = generateRecommendations(input, original, reduceTenure, reduceEMI)

    // Determine best option
    let bestOption: 'tenure' | 'emi' | 'invest' | 'none' = 'none'

    if (recommendations.some(r => r.type === 'warning' && r.priority <= 2)) {
        bestOption = 'none'
    } else if (recommendations.some(r => r.type === 'invest' && r.priority <= 3)) {
        bestOption = 'invest'
    } else if (reduceTenure.interestSaved >= reduceEMI.interestSaved) {
        bestOption = 'tenure'
    } else {
        bestOption = 'emi'
    }

    return {
        original,
        reduceTenure,
        reduceEMI,
        recommendations,
        summary: {
            bestOption,
            maxInterestSaved: Math.max(reduceTenure.interestSaved, reduceEMI.interestSaved),
            maxTenureReduced: reduceTenure.tenureReduced,
        },
    }
}

/**
 * Helper to aggregate amortization schedule by year
 */
export function aggregateByYear(schedule: AmortizationRow[]): AmortizationRow[] {
    const yearlyData = new Map<number, AmortizationRow>()

    for (const row of schedule) {
        if (!yearlyData.has(row.year)) {
            yearlyData.set(row.year, {
                month: row.year * 12,
                year: row.year,
                openingBalance: row.openingBalance,
                interestComponent: 0,
                principalComponent: 0,
                partPayment: 0,
                closingBalance: row.closingBalance,
                emi: 0,
            })
        }

        const yearRow = yearlyData.get(row.year)!
        yearRow.interestComponent += row.interestComponent
        yearRow.principalComponent += row.principalComponent
        yearRow.partPayment += row.partPayment
        yearRow.emi += row.emi
        yearRow.closingBalance = row.closingBalance
    }

    return Array.from(yearlyData.values())
}

// Re-export formatting functions for convenience
export { formatCurrency, formatIndianNumber }
