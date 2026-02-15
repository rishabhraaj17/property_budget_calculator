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
    MultiPropertyInput,
    MultiPropertyAllocation,
    MultiPropertyResult,
    MultiPropertyLoan,
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
// ... (imports)

/**
 * Calculate the original scenario without any prepayment
 */
export function calculateOriginalScenario(
    input: LoanOptimizerInput,
    startDate: Date = new Date()
): ScenarioResult {
    // Use existing EMI if provided and valid (greater than monthly interest)
    // Otherwise calculate standard EMI
    let emi = 0
    const monthlyRate = input.interestRate / 12
    const minRequiredEMI = Math.floor(input.currentPrincipal * monthlyRate)

    if (input.existingEMI && input.existingEMI > minRequiredEMI) {
        emi = input.existingEMI
    } else {
        emi = calculateEMI(input.currentPrincipal, input.interestRate, input.remainingTenureMonths)
    }

    // Safety cap for schedule generation: If using custom EMI, tenure might differ
    // Ensure we run enough months to clear loan or hit reasonable limit (e.g. 30 years)
    const simulationMonths = input.existingEMI
        ? Math.max(input.remainingTenureMonths, 360)
        : input.remainingTenureMonths

    const schedule = generateAmortizationSchedule(
        input.currentPrincipal,
        input.interestRate,
        simulationMonths,
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

export function generateMultiPropertyRecommendations(
    input: MultiPropertyInput,
    totalInterestSaved: number,
    totalTenureReduced: number,
    remainingBudget: number
): RecommendationType[] {
    const recommendations: RecommendationType[] = []

    // Rule 1: Emergency Fund (Critical)
    if (!input.hasEmergencyFund) {
        recommendations.push({
            type: 'warning',
            priority: 1,
            title: 'Build Emergency Fund First',
            description: 'Before prepaying multiple loans, ensure you have 6-12 months of expenses saved. This safety net is crucial when managing multiple liabilities.',
            icon: 'alert',
            color: 'danger',
        })
    }

    // Rule 2: Investment Opportunity (vs Highest Rate Loan)
    // Find highest rate loan
    const highestRateLoan = [...input.loans].sort((a, b) => b.interestRate - a.interestRate)[0]
    if (highestRateLoan && highestRateLoan.interestRate < LOW_INTEREST_THRESHOLD && input.riskAppetite === 'high') {
        const potentialInvestmentReturn = input.totalPrepaymentAmount * INVESTMENT_BENCHMARK_RETURN * 5 // Approx 5 year horizon comparison
        recommendations.push({
            type: 'invest',
            priority: 2,
            title: 'Consider Market Investments',
            description: `Your most expensive loan is only ${(highestRateLoan.interestRate * 100).toFixed(2)}%. With a high risk appetite, investing this amount might yield better long-term returns (avg ~${(INVESTMENT_BENCHMARK_RETURN * 100).toFixed(0)}%) than prepaying cheap debt.`,
            icon: 'chart-up',
            color: 'primary',
        })
    }

    // Rule 3: Strategy Affirmation
    if (input.strategy === 'highest_rate') {
        recommendations.push({
            type: 'info',
            priority: 3,
            title: 'Maximizing Savings',
            description: `Great choice! The Avalanche method saves you the most money (₹${formatIndianNumber(totalInterestSaved)}) by attacking expensive debt first.`,
            icon: 'trending-down',
            color: 'success',
        })
    } else if (input.strategy === 'smallest_balance') {
        recommendations.push({
            type: 'info',
            priority: 3,
            title: 'Building Momentum',
            description: `The Snowball method helps you clear ${input.loans.some(l => l.currentPrincipal <= input.totalPrepaymentAmount) ? 'a loan' : 'balances'} quickly. This psychological win can be very motivating!`,
            icon: 'check',
            color: 'primary',
        })
    } else {
        recommendations.push({
            type: 'info',
            priority: 3,
            title: 'Custom Split Applied',
            description: `You've manually distributed your ₹${formatIndianNumber(input.totalPrepaymentAmount)} prepayment budget across ${input.loans.length} properties. Total interest saved: ₹${formatIndianNumber(totalInterestSaved)}.`,
            icon: 'check',
            color: 'primary',
        })
    }

    // Rule 4: Remaining Budget
    if (remainingBudget > 5000) {
        recommendations.push({
            type: 'invest',
            priority: 4,
            title: 'Surplus Budget',
            description: `You have ₹${formatIndianNumber(remainingBudget)} left after clearing target loans. Consider investing this surplus or starting an RD.`,
            icon: 'wallet',
            color: 'success',
        })
    }

    return recommendations.sort((a, b) => a.priority - b.priority)
}

// ============================
// Multi-Property Optimization
// ============================

/**
 * Calculate optimal prepayment allocation across multiple property loans.
 * Uses a greedy strategy: allocate as much as possible to highest priority loan first.
 */
export function calculateMultiPropertyOptimization(input: MultiPropertyInput): MultiPropertyResult {
    const { loans, totalPrepaymentAmount, strategy, prepaymentMonth } = input

    // Sort loans based on strategy (manual keeps original order)
    const sortedLoans = strategy === 'manual'
        ? [...loans]
        : [...loans].sort((a, b) => {
            if (strategy === 'highest_rate') {
                return b.interestRate - a.interestRate // Highest rate first
            } else {
                return a.currentPrincipal - b.currentPrincipal // Smallest balance first
            }
        })

    let remainingBudget = totalPrepaymentAmount
    const allocations: MultiPropertyAllocation[] = []
    const perPropertyResults: Record<string, OptimizationResult> = {}

    for (const loan of sortedLoans) {
        // Calculate how much to allocate to this loan
        let allocatedAmount: number
        if (strategy === 'manual' && input.manualAllocations) {
            const pct = input.manualAllocations[loan.id] || 0
            allocatedAmount = Math.min(
                Math.round(totalPrepaymentAmount * (pct / 100)),
                loan.currentPrincipal
            )
        } else {
            allocatedAmount = Math.min(remainingBudget, loan.currentPrincipal)
        }

        // Calculate original scenario for this loan
        const originalEMI = loan.existingEMI || calculateEMI(
            loan.currentPrincipal,
            loan.interestRate,
            loan.remainingTenureMonths
        )

        // Generate original schedule
        const originalSchedule = generateAmortizationSchedule(
            loan.currentPrincipal,
            loan.interestRate,
            loan.remainingTenureMonths + 120,
            originalEMI,
            0,
            0
        )
        const originalTotalInterest = originalSchedule.reduce((sum, row) => sum + row.interestComponent, 0)

        // --- Reduce Tenure scenario ---
        // Use user-specified prepaymentMonth
        const reduceTenureSchedule = generateAmortizationSchedule(
            loan.currentPrincipal,
            loan.interestRate,
            loan.remainingTenureMonths + 120,
            originalEMI,
            allocatedAmount,
            prepaymentMonth // Use the actual month input
        )
        const reduceTenureTotalInterest = reduceTenureSchedule.reduce((sum, row) => sum + row.interestComponent, 0)
        const interestSavedReduceTenure = originalTotalInterest - reduceTenureTotalInterest
        const tenureReducedMonths = originalSchedule.length - reduceTenureSchedule.length

        // --- Reduce EMI scenario ---
        // For Reduce EMI, we need to handle the timing correctly similar to single property
        // But for multi-property dashboard simplicity, we'll approximate the immediate impact
        // if prepayment happened at month X. 
        // NOTE: The simple calculation below assumes immediate principal reduction for new EMI calculation.
        // To support timed prepayment for EMI reduction properly requires the full phase1/phase2 logic
        // from calculateReduceEMIScenario. For now, we will use a simplified approximation:
        // "What if we prepay X amount today, how much does EMI drop?" - this is usually what users expect
        // in a multi-loan dashboard unless they are deep diving.
        // However, since we added prepaymentMonth, let's use the robust functions if possible?
        // Actually, reusing calculateReduceEMIScenario logic inline is better for consistency.

        // Let's implement robust calculation for Reduce EMI in multi-property too:
        // 1. Simulate to prepayment month
        // 2. Reduce principal
        // 3. Recalculate EMI
        // OR reuse existing logic?
        // We can create a temporary LoanOptimizerInput for this loan and call calculateReduceEMIScenario!
        // This is much cleaner.

        const singleLoanInput: LoanOptimizerInput = {
            currentPrincipal: loan.currentPrincipal,
            interestRate: loan.interestRate,
            remainingTenureMonths: loan.remainingTenureMonths,
            partPaymentAmount: allocatedAmount,
            prepaymentMonth: prepaymentMonth,
            existingEMI: loan.existingEMI,
            hasEmergencyFund: input.hasEmergencyFund,
            riskAppetite: input.riskAppetite,
        }

        // We need existing 'original' result for this loan to pass to calculateReduceEMIScenario
        // We essentially already calculated it above (originalSchedule), but let's wrap it in ScenarioResult structure
        const startDate = new Date()
        const loanOriginalScenario: ScenarioResult = {
            type: 'original',
            emi: originalEMI,
            tenureMonths: originalSchedule.length,
            totalInterest: originalTotalInterest,
            totalPayment: originalSchedule.reduce((s, r) => s + r.emi + r.partPayment, 0),
            completionDate: new Date(), // Dummy
            interestSaved: 0,
            tenureReduced: 0,
            amortizationSchedule: originalSchedule
        }

        const reduceEMIScenario = calculateReduceEMIScenario(singleLoanInput, loanOriginalScenario, startDate)

        const interestSavedReduceEMI = reduceEMIScenario.interestSaved
        const newEMI = reduceEMIScenario.emi

        // Build reduce-tenure ScenarioResult
        const reduceTenureScenarioResult: ScenarioResult = {
            type: 'reduce_tenure',
            emi: originalEMI,
            tenureMonths: reduceTenureSchedule.length,
            totalInterest: reduceTenureTotalInterest,
            totalPayment: reduceTenureSchedule.reduce((s, r) => s + r.emi + r.partPayment, 0),
            completionDate: new Date(),
            interestSaved: interestSavedReduceTenure,
            tenureReduced: tenureReducedMonths,
            amortizationSchedule: reduceTenureSchedule,
        }

        // Generate per-loan recommendations
        const perLoanRecommendations = generateRecommendations(
            singleLoanInput,
            loanOriginalScenario,
            reduceTenureScenarioResult,
            reduceEMIScenario
        )

        // Determine best option per loan
        let bestOption: 'tenure' | 'emi' | 'invest' | 'none' = 'none'
        if (perLoanRecommendations.some(r => r.type === 'warning' && r.priority <= 2)) {
            bestOption = 'none'
        } else if (perLoanRecommendations.some(r => r.type === 'invest' && r.priority <= 3)) {
            bestOption = 'invest'
        } else if (interestSavedReduceTenure >= interestSavedReduceEMI) {
            bestOption = 'tenure'
        } else {
            bestOption = 'emi'
        }

        perPropertyResults[loan.id] = {
            original: loanOriginalScenario,
            reduceTenure: reduceTenureScenarioResult,
            reduceEMI: reduceEMIScenario,
            recommendations: perLoanRecommendations,
            summary: {
                bestOption,
                maxInterestSaved: Math.max(interestSavedReduceTenure, interestSavedReduceEMI),
                maxTenureReduced: tenureReducedMonths,
            },
        }

        allocations.push({
            loanId: loan.id,
            loanName: loan.name,
            interestRate: loan.interestRate,
            currentPrincipal: loan.currentPrincipal,
            allocatedAmount,
            interestSavedReduceTenure,
            tenureReducedMonths,
            interestSavedReduceEMI,
            newEMI,
            originalEMI,
            originalTotalInterest,
            newTotalInterestReduceTenure: reduceTenureTotalInterest,
        })

        remainingBudget -= allocatedAmount
    }

    const totalInterestSaved = allocations.reduce((sum, a) => sum + a.interestSavedReduceTenure, 0)
    const totalTenureReduced = allocations.length > 0
        ? Math.round(allocations.reduce((sum, a) => sum + a.tenureReducedMonths, 0) / allocations.filter(a => a.allocatedAmount > 0).length)
        : 0

    const strategyExplanation = strategy === 'highest_rate'
        ? 'Prioritizes loans with the highest interest rate first, maximizing total interest savings.'
        : strategy === 'smallest_balance'
            ? 'Prioritizes loans with the smallest balance first (debt snowball), allowing you to close loans faster for psychological momentum.'
            : 'You chose a custom split — budget is allocated based on your manually set percentages for each property.'

    const recommendations = generateMultiPropertyRecommendations(
        input,
        totalInterestSaved,
        totalTenureReduced,
        remainingBudget
    )

    return {
        allocations,
        totalInterestSaved,
        totalTenureReduced,
        totalPrepaymentUsed: totalPrepaymentAmount - remainingBudget,
        remainingBudget,
        strategy,
        strategyExplanation,
        recommendations,
        perPropertyResults,
        prepaymentMonth,
    }
}

