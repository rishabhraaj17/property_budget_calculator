'use client'

import { useState, useMemo } from 'react'
import { Card } from './ui/Card'
import { Toggle } from './ui/Toggle'
import { MultiPropertyResult } from '@/lib/loanOptimizerTypes'
import { formatIndianNumber } from '@/lib/calculations'
import { ScenarioComparison } from './ScenarioComparison'
import { AmortizationSchedule } from './AmortizationSchedule'
import { AmortizationChart } from './AmortizationChart'
import { RecommendationCard } from './RecommendationCard'

interface MultiPropertyResultsProps {
    result: MultiPropertyResult
}

type ViewMode = 'combined' | 'per_property'

export function MultiPropertyResults({ result }: MultiPropertyResultsProps) {
    const { allocations, totalInterestSaved, totalTenureReduced, totalPrepaymentUsed, remainingBudget, strategy, strategyExplanation, recommendations, perPropertyResults, prepaymentMonth } = result

    const [viewMode, setViewMode] = useState<ViewMode>('combined')
    const [expandedProperties, setExpandedProperties] = useState<Set<string>>(new Set())
    const [propertyScenarios, setPropertyScenarios] = useState<Record<string, 'original' | 'reduce_tenure' | 'reduce_emi'>>({})

    const toggleProperty = (loanId: string) => {
        setExpandedProperties(prev => {
            const next = new Set(prev)
            if (next.has(loanId)) {
                next.delete(loanId)
            } else {
                next.add(loanId)
            }
            return next
        })
    }

    const getPropertyScenario = (loanId: string) => propertyScenarios[loanId] || 'reduce_tenure'

    const setPropertyScenario = (loanId: string, scenario: 'original' | 'reduce_tenure' | 'reduce_emi') => {
        setPropertyScenarios(prev => ({ ...prev, [loanId]: scenario }))
    }

    const allocatedProperties = allocations.filter(a => a.allocatedAmount > 0)

    return (
        <div className="space-y-6">
            {/* Strategy Banner */}
            <div className="bg-gradient-to-r from-primary-600 to-violet-600 rounded-xl p-5 text-white">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            {strategy === 'highest_rate' ? '📈' : strategy === 'smallest_balance' ? '🎯' : '✂️'}{' '}
                            {strategy === 'highest_rate' ? 'Avalanche Strategy' : strategy === 'smallest_balance' ? 'Snowball Strategy' : 'Custom Split'}
                        </h3>
                        <p className="text-sm text-white/80 mt-1">{strategyExplanation}</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="text-center px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
                            <p className="text-2xl font-bold">₹{formatIndianNumber(totalInterestSaved)}</p>
                            <p className="text-xs text-white/70 uppercase tracking-wider">Interest Saved</p>
                        </div>
                        <div className="text-center px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
                            <p className="text-2xl font-bold">{totalTenureReduced}</p>
                            <p className="text-xs text-white/70 uppercase tracking-wider">Months Saved (avg)</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* View Mode Toggle */}
            <Toggle
                options={[
                    { value: 'combined', label: 'Combined View' },
                    { value: 'per_property', label: 'Per Property View' },
                ]}
                value={viewMode}
                onChange={(val) => setViewMode(val as ViewMode)}
            />

            {viewMode === 'combined' ? (
                /* =================== COMBINED VIEW =================== */
                <>
                    {/* Budget Overview */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4 border border-emerald-200/50">
                            <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Budget Used</p>
                            <p className="text-xl font-bold text-emerald-900 mt-1">₹{formatIndianNumber(totalPrepaymentUsed)}</p>
                        </div>
                        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-4 border border-amber-200/50">
                            <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Remaining Budget</p>
                            <p className="text-xl font-bold text-amber-900 mt-1">₹{formatIndianNumber(remainingBudget)}</p>
                        </div>
                        <div className="bg-gradient-to-br from-violet-50 to-violet-100/50 rounded-xl p-4 border border-violet-200/50">
                            <p className="text-xs font-medium text-violet-600 uppercase tracking-wider">Properties Optimized</p>
                            <p className="text-xl font-bold text-violet-900 mt-1">{allocatedProperties.length}</p>
                        </div>
                    </div>

                    {/* Allocation Breakdown */}
                    <h3 className="text-lg font-semibold text-slate-900">Property-wise Allocation</h3>

                    {allocations.map((allocation, index) => {
                        const allocationPercentage = totalPrepaymentUsed > 0
                            ? (allocation.allocatedAmount / totalPrepaymentUsed * 100)
                            : 0

                        return (
                            <Card key={allocation.loanId} className="relative overflow-hidden">
                                {/* Allocation proportion bar */}
                                <div
                                    className="absolute top-0 left-0 h-1 bg-gradient-to-r from-primary-500 to-violet-500 transition-all duration-500"
                                    style={{ width: `${allocationPercentage}%` }}
                                />

                                <div className="pt-3">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${index === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                                                : index === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-500'
                                                    : 'bg-gradient-to-br from-amber-600 to-amber-700'
                                                }`}>
                                                {index + 1}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-900">{allocation.loanName}</h4>
                                                <p className="text-xs text-slate-500">
                                                    {(allocation.interestRate * 100).toFixed(2)}% • ₹{formatIndianNumber(allocation.currentPrincipal)} outstanding
                                                </p>
                                            </div>
                                        </div>
                                        {allocation.allocatedAmount > 0 && (
                                            <div className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm font-semibold">
                                                ₹{formatIndianNumber(allocation.allocatedAmount)} allocated
                                            </div>
                                        )}
                                    </div>

                                    {allocation.allocatedAmount > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Reduce Tenure */}
                                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/30 rounded-lg p-4 border border-emerald-200/50">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-6 h-6 rounded bg-emerald-500 flex items-center justify-center">
                                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                        </svg>
                                                    </div>
                                                    <h5 className="font-semibold text-emerald-800 text-sm">Reduce Tenure</h5>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-emerald-600">Interest Saved</span>
                                                        <span className="font-bold text-emerald-900">₹{formatIndianNumber(allocation.interestSavedReduceTenure)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-emerald-600">Tenure Reduced</span>
                                                        <span className="font-bold text-emerald-900">{allocation.tenureReducedMonths} months</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-emerald-600">EMI</span>
                                                        <span className="font-bold text-emerald-900">₹{formatIndianNumber(allocation.originalEMI)} (same)</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Reduce EMI */}
                                            <div className="bg-gradient-to-br from-blue-50 to-blue-100/30 rounded-lg p-4 border border-blue-200/50">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center">
                                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                        </svg>
                                                    </div>
                                                    <h5 className="font-semibold text-blue-800 text-sm">Reduce EMI</h5>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-blue-600">Interest Saved</span>
                                                        <span className="font-bold text-blue-900">₹{formatIndianNumber(allocation.interestSavedReduceEMI)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-blue-600">New EMI</span>
                                                        <span className="font-bold text-blue-900">₹{formatIndianNumber(allocation.newEMI)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-blue-600">EMI Reduction</span>
                                                        <span className="font-bold text-blue-900">₹{formatIndianNumber(allocation.originalEMI - allocation.newEMI)}/mo</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-slate-50 rounded-lg p-4 text-center text-slate-500 text-sm">
                                            No budget allocated — higher-priority loans consumed the budget.
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )
                    })}

                    {/* Recommendations */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-900">Analysis & Recommendations</h3>
                        {recommendations.map((rec, index) => (
                            <Card key={index} className={`border-l-4 ${rec.color === 'warning' ? 'border-l-amber-500 bg-amber-50' :
                                rec.color === 'danger' ? 'border-l-red-500 bg-red-50' :
                                    rec.color === 'success' ? 'border-l-emerald-500 bg-emerald-50' :
                                        rec.color === 'primary' ? 'border-l-primary-500 bg-primary-50' :
                                            'border-l-slate-500 bg-slate-50'
                                }`}>
                                <div className="flex gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${rec.color === 'warning' ? 'bg-amber-100 text-amber-600' :
                                        rec.color === 'danger' ? 'bg-red-100 text-red-600' :
                                            rec.color === 'success' ? 'bg-emerald-100 text-emerald-600' :
                                                rec.color === 'primary' ? 'bg-primary-100 text-primary-600' :
                                                    'bg-slate-100 text-slate-600'
                                        }`}>
                                        {rec.icon === 'alert' && (
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        )}
                                        {rec.icon === 'trending-down' && (
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                            </svg>
                                        )}
                                        {rec.icon === 'wallet' && (
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                            </svg>
                                        )}
                                        {rec.icon === 'chart-up' && (
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                            </svg>
                                        )}
                                        {rec.icon === 'info' && (
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        )}
                                        {rec.icon === 'check' && (
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className={`font-semibold ${rec.color === 'warning' ? 'text-amber-900' :
                                            rec.color === 'danger' ? 'text-red-900' :
                                                rec.color === 'success' ? 'text-emerald-900' :
                                                    rec.color === 'primary' ? 'text-primary-900' :
                                                        'text-slate-900'
                                            }`}>{rec.title}</h4>
                                        <p className={`text-sm mt-1 ${rec.color === 'warning' ? 'text-amber-800' :
                                            rec.color === 'danger' ? 'text-red-800' :
                                                rec.color === 'success' ? 'text-emerald-800' :
                                                    rec.color === 'primary' ? 'text-primary-800' :
                                                        'text-slate-700'
                                            }`}>
                                            {rec.description}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </>
            ) : (
                /* =================== PER PROPERTY VIEW =================== */
                <div className="space-y-4">
                    {allocations.map((allocation, index) => {
                        const propertyResult = perPropertyResults[allocation.loanId]
                        if (!propertyResult) return null

                        const isAllocated = allocation.allocatedAmount > 0
                        const isExpanded = expandedProperties.has(allocation.loanId)
                        const scenario = getPropertyScenario(allocation.loanId)
                        const selectedSchedule = scenario === 'original'
                            ? propertyResult.original.amortizationSchedule
                            : scenario === 'reduce_emi'
                                ? propertyResult.reduceEMI.amortizationSchedule
                                : propertyResult.reduceTenure.amortizationSchedule

                        // Build allocation explanation
                        const allocationPct = totalPrepaymentUsed > 0
                            ? Math.round(allocation.allocatedAmount / totalPrepaymentUsed * 100)
                            : 0
                        const allocationExplanation = isAllocated
                            ? strategy === 'manual'
                                ? `You allocated ${allocationPct}% of the budget to this property — ₹${formatIndianNumber(allocation.allocatedAmount)} prepaid.`
                                : strategy === 'highest_rate'
                                    ? `Selected for prepayment — ${(allocation.interestRate * 100).toFixed(2)}% is ${index === 0 ? 'the highest' : 'a high'} interest rate among your loans. ₹${formatIndianNumber(allocation.allocatedAmount)} allocated to maximize interest savings.`
                                    : `Selected for prepayment — ₹${formatIndianNumber(allocation.currentPrincipal)} outstanding is ${index === 0 ? 'the smallest' : 'a small'} balance among your loans. ₹${formatIndianNumber(allocation.allocatedAmount)} allocated to clear debt faster.`
                            : strategy === 'manual'
                                ? `You allocated 0% of the budget to this property.`
                                : strategy === 'highest_rate'
                                    ? `Not selected — lower interest rate (${(allocation.interestRate * 100).toFixed(2)}%) compared to other loans. The entire budget was consumed by higher-rate loans.`
                                    : `Not selected — larger balance (₹${formatIndianNumber(allocation.currentPrincipal)}) compared to other loans. The entire budget was consumed by smaller-balance loans.`

                        // Filter out warning-type recommendations for per-property view
                        const filteredRecommendations = propertyResult.recommendations.filter(r => r.type !== 'warning')

                        return (
                            <div key={allocation.loanId} className="space-y-4">
                                {/* Collapsible Header */}
                                <button
                                    onClick={() => toggleProperty(allocation.loanId)}
                                    className="w-full text-left"
                                >
                                    <Card className={`relative overflow-hidden hover:shadow-md transition-shadow ${!isAllocated ? 'opacity-75' : ''}`}>
                                        <div className={`absolute top-0 left-0 right-0 h-1 ${isAllocated ? 'bg-gradient-to-r from-primary-500 to-violet-500' : 'bg-slate-300'}`} />
                                        <div className="pt-3 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                                                    !isAllocated ? 'bg-slate-400'
                                                    : index === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                                                    : index === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-500'
                                                    : 'bg-gradient-to-br from-amber-600 to-amber-700'
                                                }`}>
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                                                        {allocation.loanName}
                                                        {isAllocated ? (
                                                            <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Allocated</span>
                                                        ) : (
                                                            <span className="text-xs font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">No allocation</span>
                                                        )}
                                                    </h4>
                                                    <p className="text-xs text-slate-500">
                                                        {(allocation.interestRate * 100).toFixed(2)}% • ₹{formatIndianNumber(allocation.currentPrincipal)} outstanding
                                                        {isAllocated && ` • ₹${formatIndianNumber(allocation.allocatedAmount)} prepaid`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {isAllocated && (
                                                    <div className="text-right hidden sm:block">
                                                        <p className="text-sm font-bold text-emerald-700">₹{formatIndianNumber(allocation.interestSavedReduceTenure)} saved</p>
                                                        <p className="text-xs text-slate-500">{allocation.tenureReducedMonths} months reduced</p>
                                                    </div>
                                                )}
                                                <svg className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </Card>
                                </button>

                                {/* Expanded Content */}
                                {isExpanded && (
                                    <div className={`space-y-6 pl-2 border-l-2 ${isAllocated ? 'border-primary-200' : 'border-slate-200'} ml-4`}>
                                        <div className="pl-4 space-y-6">
                                            {/* Allocation Explanation */}
                                            <div className={`rounded-lg p-4 text-sm ${isAllocated ? 'bg-emerald-50 border border-emerald-200/50 text-emerald-800' : 'bg-slate-50 border border-slate-200/50 text-slate-600'}`}>
                                                <div className="flex items-start gap-2">
                                                    {isAllocated ? (
                                                        <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    )}
                                                    <p>{allocationExplanation}</p>
                                                </div>
                                            </div>

                                            {filteredRecommendations.length > 0 && (
                                                <RecommendationCard recommendations={filteredRecommendations} />
                                            )}

                                            {isAllocated && (
                                                <ScenarioComparison
                                                    original={propertyResult.original}
                                                    reduceTenure={propertyResult.reduceTenure}
                                                    reduceEMI={propertyResult.reduceEMI}
                                                    partPaymentAmount={allocation.allocatedAmount}
                                                />
                                            )}

                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <h3 className="text-lg font-semibold text-slate-900">Detailed Schedule</h3>
                                                {isAllocated && (
                                                    <Toggle
                                                        options={[
                                                            { value: 'reduce_tenure', label: 'Reduce Tenure' },
                                                            { value: 'reduce_emi', label: 'Reduce EMI' },
                                                            { value: 'original', label: 'Original' },
                                                        ]}
                                                        value={scenario}
                                                        onChange={(val) => setPropertyScenario(allocation.loanId, val as 'original' | 'reduce_tenure' | 'reduce_emi')}
                                                    />
                                                )}
                                            </div>

                                            <AmortizationSchedule
                                                schedule={isAllocated ? selectedSchedule : propertyResult.original.amortizationSchedule}
                                                scenarioType={isAllocated ? scenario : 'original'}
                                                prepaymentMonth={prepaymentMonth}
                                            />

                                            <AmortizationChart
                                                schedule={isAllocated ? selectedSchedule : propertyResult.original.amortizationSchedule}
                                                prepaymentMonth={prepaymentMonth}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
