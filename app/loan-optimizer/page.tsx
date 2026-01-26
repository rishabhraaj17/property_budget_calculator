'use client'

import { useState, useMemo } from 'react'
import { LoanOptimizerInput } from '@/lib/loanOptimizerTypes'
import { calculateOptimization } from '@/lib/loanOptimizerCalculations'
import { LoanOptimizerForm } from '@/components/LoanOptimizerForm'
import { ScenarioComparison } from '@/components/ScenarioComparison'
import { AmortizationSchedule } from '@/components/AmortizationSchedule'
import { AmortizationChart } from '@/components/AmortizationChart'
import { RecommendationCard } from '@/components/RecommendationCard'
import { Toggle } from '@/components/ui'

export default function LoanOptimizerPage() {
    const [input, setInput] = useState<LoanOptimizerInput>({
        currentPrincipal: 5000000, // ₹50 Lakhs default
        interestRate: 0.085,       // 8.5%
        remainingTenureMonths: 240, // 20 years
        partPaymentAmount: 500000,  // ₹5 Lakhs
        prepaymentMonth: 12,
        hasEmergencyFund: true,
        riskAppetite: 'medium',
    })

    const [selectedScenario, setSelectedScenario] = useState<'original' | 'reduce_tenure' | 'reduce_emi'>('reduce_tenure')

    // Calculate optimization results
    const results = useMemo(() => {
        return calculateOptimization(input)
    }, [input])

    // Get schedule for selected scenario
    const selectedSchedule = useMemo(() => {
        switch (selectedScenario) {
            case 'original':
                return results.original.amortizationSchedule
            case 'reduce_tenure':
                return results.reduceTenure.amortizationSchedule
            case 'reduce_emi':
                return results.reduceEMI.amortizationSchedule
            default:
                return results.reduceTenure.amortizationSchedule
        }
    }, [results, selectedScenario])

    return (
        <div className="animate-fade-in">
            {/* Page Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Smart Home Loan Optimizer</h1>
                        <p className="text-slate-500">Analyze prepayment strategies and maximize your savings</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Sidebar - Input Form */}
                <div className="lg:col-span-4">
                    <LoanOptimizerForm input={input} onChange={setInput} />
                </div>

                {/* Main Content - Results */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Recommendation Card - Top Priority */}
                    <RecommendationCard recommendations={results.recommendations} />

                    {/* Scenario Comparison */}
                    <ScenarioComparison
                        original={results.original}
                        reduceTenure={results.reduceTenure}
                        reduceEMI={results.reduceEMI}
                        partPaymentAmount={input.partPaymentAmount}
                    />

                    {/* Scenario Selector for Amortization */}
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">Detailed Schedule</h3>
                        <Toggle
                            options={[
                                { value: 'reduce_tenure', label: 'Reduce Tenure' },
                                { value: 'reduce_emi', label: 'Reduce EMI' },
                                { value: 'original', label: 'Original' },
                            ]}
                            value={selectedScenario}
                            onChange={(val) => setSelectedScenario(val as typeof selectedScenario)}
                        />
                    </div>

                    {/* Amortization Schedule */}
                    <AmortizationSchedule
                        schedule={selectedSchedule}
                        scenarioType={selectedScenario}
                        prepaymentMonth={input.prepaymentMonth}
                    />

                    {/* Amortization Chart */}
                    <AmortizationChart
                        schedule={selectedSchedule}
                        prepaymentMonth={input.prepaymentMonth}
                    />
                </div>
            </div>
        </div>
    )
}
