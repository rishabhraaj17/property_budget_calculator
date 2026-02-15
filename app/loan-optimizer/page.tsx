'use client'

import { useState, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { LoanOptimizerInput, MultiPropertyInput, MultiPropertyResult } from '@/lib/loanOptimizerTypes'
import { calculateOptimization, calculateMultiPropertyOptimization } from '@/lib/loanOptimizerCalculations'
import { LoanOptimizerForm } from '@/components/LoanOptimizerForm'
import { ScenarioComparison } from '@/components/ScenarioComparison'
import { AmortizationSchedule } from '@/components/AmortizationSchedule'
import { AmortizationChart } from '@/components/AmortizationChart'
import { RecommendationCard } from '@/components/RecommendationCard'
import { MultiPropertyOptimizerForm } from '@/components/MultiPropertyOptimizerForm'
import { MultiPropertyResults } from '@/components/MultiPropertyResults'
import { Toggle } from '@/components/ui'

type OptimizerMode = 'single' | 'multi'

function LoanOptimizerContent() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const mode: OptimizerMode = searchParams.get('mode') === 'multi' ? 'multi' : 'single'

    const setMode = (newMode: OptimizerMode) => {
        const params = new URLSearchParams(searchParams.toString())
        if (newMode === 'multi') {
            params.set('mode', 'multi')
        } else {
            params.delete('mode')
        }
        const query = params.toString()
        router.replace(`/loan-optimizer${query ? `?${query}` : ''}`, { scroll: false })
        setMultiResult(null)
    }

    // --- Single property state ---
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

    // --- Multi property state ---
    const [multiResult, setMultiResult] = useState<MultiPropertyResult | null>(null)

    // Calculate single-property results
    const results = useMemo(() => {
        return calculateOptimization(input)
    }, [input])

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

    const handleMultiPropertyCalculate = (multiInput: MultiPropertyInput) => {
        const result = calculateMultiPropertyOptimization(multiInput)
        setMultiResult(result)
    }

    return (
        <div className="animate-fade-in">
            {/* Page Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Smart Home Loan Optimizer</h1>
                        <p className="text-sm sm:text-base text-slate-500">Analyze prepayment strategies and maximize your savings</p>
                    </div>
                </div>

                {/* Mode Toggle */}
                <div className="flex items-center gap-3">
                    <Toggle
                        options={[
                            { value: 'single', label: '🏠 Single Property' },
                            { value: 'multi', label: '🏘️ Multi Property' },
                        ]}
                        value={mode}
                        onChange={(val) => setMode(val as OptimizerMode)}
                    />
                </div>
            </div>

            {mode === 'single' ? (
                /* =================== SINGLE PROPERTY MODE =================== */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Sidebar - Input Form */}
                    <div className="lg:col-span-4">
                        <LoanOptimizerForm input={input} onChange={setInput} />
                    </div>

                    {/* Main Content - Results */}
                    <div className="lg:col-span-8 space-y-6">
                        <RecommendationCard recommendations={results.recommendations} />

                        <ScenarioComparison
                            original={results.original}
                            reduceTenure={results.reduceTenure}
                            reduceEMI={results.reduceEMI}
                            partPaymentAmount={input.partPaymentAmount}
                        />

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

                        <AmortizationSchedule
                            schedule={selectedSchedule}
                            scenarioType={selectedScenario}
                            prepaymentMonth={input.prepaymentMonth}
                        />

                        <AmortizationChart
                            schedule={selectedSchedule}
                            prepaymentMonth={input.prepaymentMonth}
                        />
                    </div>
                </div>
            ) : (
                /* =================== MULTI PROPERTY MODE =================== */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Sidebar - Multi Property Form */}
                    <div className="lg:col-span-5">
                        <MultiPropertyOptimizerForm onCalculate={handleMultiPropertyCalculate} />
                    </div>

                    {/* Main Content - Multi Results */}
                    <div className="lg:col-span-7 space-y-6">
                        {multiResult ? (
                            <MultiPropertyResults result={multiResult} />
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-100 to-violet-100 flex items-center justify-center mb-6">
                                    <svg className="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-slate-700 mb-2">Ready to Optimize</h3>
                                <p className="text-slate-500 max-w-sm">
                                    Add your property loans on the left, set your prepayment budget, and click optimize to see the best allocation strategy.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default function LoanOptimizerPage() {
    return (
        <Suspense fallback={
            <div className="animate-pulse space-y-6">
                <div className="h-10 bg-slate-200 rounded-lg w-64" />
                <div className="h-8 bg-slate-100 rounded-lg w-48" />
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-4 h-96 bg-slate-100 rounded-xl" />
                    <div className="lg:col-span-8 h-96 bg-slate-100 rounded-xl" />
                </div>
            </div>
        }>
            <LoanOptimizerContent />
        </Suspense>
    )
}
