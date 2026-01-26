'use client'

import { ScenarioResult } from '@/lib/loanOptimizerTypes'
import { formatIndianNumber, formatCurrency } from '@/lib/calculations'
import { Card, Tooltip } from './ui'

interface ScenarioComparisonProps {
    original: ScenarioResult
    reduceTenure: ScenarioResult
    reduceEMI: ScenarioResult
    partPaymentAmount: number
}

export function ScenarioComparison({
    original,
    reduceTenure,
    reduceEMI,
    partPaymentAmount,
}: ScenarioComparisonProps) {
    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-IN', {
            month: 'short',
            year: 'numeric',
        }).format(date)
    }

    const scenarios = [
        {
            title: 'Original',
            subtitle: 'Without Prepayment',
            data: original,
            highlight: false,
            badge: null,
            color: 'slate' as const,
        },
        {
            title: 'Reduce Tenure',
            subtitle: 'Keep EMI, Pay Less Time',
            data: reduceTenure,
            highlight: reduceTenure.interestSaved >= reduceEMI.interestSaved,
            badge: reduceTenure.interestSaved >= reduceEMI.interestSaved ? 'Best for Savings' : null,
            color: 'success' as const,
        },
        {
            title: 'Reduce EMI',
            subtitle: 'Keep Tenure, Pay Less Monthly',
            data: reduceEMI,
            highlight: false,
            badge: 'Best for Cash Flow',
            color: 'primary' as const,
        },
    ]

    return (
        <Card>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">Scenario Comparison</h3>
                    <p className="text-sm text-slate-500">
                        Impact of ₹{formatIndianNumber(partPaymentAmount)} prepayment
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {scenarios.map((scenario) => (
                    <div
                        key={scenario.title}
                        className={`
              relative rounded-xl p-5 border-2 transition-all
              ${scenario.highlight
                                ? 'border-success-500 bg-success-50/50 ring-2 ring-success-200'
                                : 'border-slate-200 bg-white'
                            }
            `}
                    >
                        {/* Badge */}
                        {scenario.badge && (
                            <span
                                className={`
                  absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap
                  ${scenario.highlight
                                        ? 'bg-success-600 text-white'
                                        : 'bg-primary-100 text-primary-700'
                                    }
                `}
                            >
                                {scenario.badge}
                            </span>
                        )}

                        {/* Header */}
                        <div className="text-center mb-4 pt-2">
                            <h4 className="font-semibold text-slate-900">{scenario.title}</h4>
                            <p className="text-xs text-slate-500">{scenario.subtitle}</p>
                        </div>

                        {/* EMI */}
                        <div className="text-center mb-4">
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Monthly EMI</p>
                            <p className="text-2xl font-bold text-slate-900">
                                {formatCurrency(scenario.data.emi)}
                            </p>
                            {scenario.data.type !== 'original' && scenario.data.type === 'reduce_emi' && (
                                <span className="text-xs text-success-600 font-medium">
                                    ↓ {formatCurrency(original.emi - scenario.data.emi)}/mo saved
                                </span>
                            )}
                        </div>

                        {/* Tenure */}
                        <div className="text-center mb-4 py-3 bg-slate-50 rounded-lg">
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Tenure</p>
                            <p className="text-lg font-semibold text-slate-900">
                                {Math.floor(scenario.data.tenureMonths / 12)}y {scenario.data.tenureMonths % 12}m
                            </p>
                            {scenario.data.tenureReduced > 0 && (
                                <span className="text-xs text-success-600 font-medium">
                                    ↓ {scenario.data.tenureReduced} months less
                                </span>
                            )}
                        </div>

                        {/* Total Interest */}
                        <div className="text-center mb-4">
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Total Interest</p>
                            <div className="flex justify-center">
                                <Tooltip
                                    content={`Exact Amount: ${formatCurrency(scenario.data.totalInterest)}`}
                                    iconPosition="start"
                                >
                                    <p className="text-lg font-semibold text-danger-600">
                                        ₹{formatIndianNumber(scenario.data.totalInterest)}
                                    </p>
                                </Tooltip>
                            </div>
                        </div>

                        {/* Interest Saved */}
                        {scenario.data.interestSaved > 0 && (
                            <div className="text-center p-3 bg-success-100 rounded-lg">
                                <p className="text-xs text-success-700 uppercase tracking-wide font-medium">
                                    Interest Saved
                                </p>
                                <div className="flex justify-center">
                                    <Tooltip
                                        content={`Exact Savings: ${formatCurrency(scenario.data.interestSaved)}`}
                                        iconPosition="start"
                                    >
                                        <p className="text-xl font-bold text-success-700">
                                            ₹{formatIndianNumber(scenario.data.interestSaved)}
                                        </p>
                                    </Tooltip>
                                </div>
                            </div>
                        )}

                        {/* Completion Date */}
                        <div className="text-center mt-4 pt-4 border-t border-slate-200">
                            <p className="text-xs text-slate-500">Loan Free By</p>
                            <p className="text-sm font-semibold text-slate-900">
                                {formatDate(scenario.data.completionDate)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Summary */}
            <div className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-primary-900">
                                Maximum Interest Savings:
                            </p>
                            <Tooltip
                                content={`Exact Amount: ${formatCurrency(Math.max(reduceTenure.interestSaved, reduceEMI.interestSaved))}`}
                                iconPosition="start"
                            >
                                <span className="text-sm font-bold text-primary-900">
                                    ₹{formatIndianNumber(Math.max(reduceTenure.interestSaved, reduceEMI.interestSaved))}
                                </span>
                            </Tooltip>
                        </div>
                        <p className="text-xs text-primary-700">
                            By choosing tenure reduction, you can be debt-free {reduceTenure.tenureReduced} months earlier
                        </p>
                    </div>
                </div>
            </div>
        </Card>
    )
}
