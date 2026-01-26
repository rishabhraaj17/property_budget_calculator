'use client'

import { useState } from 'react'
import { AmortizationRow } from '@/lib/loanOptimizerTypes'
import { aggregateByYear, formatCurrency } from '@/lib/loanOptimizerCalculations'
import { formatIndianNumber } from '@/lib/calculations'
import { Card, Toggle } from './ui'

interface AmortizationScheduleProps {
    schedule: AmortizationRow[]
    scenarioType: 'original' | 'reduce_tenure' | 'reduce_emi'
    prepaymentMonth: number
}

export function AmortizationSchedule({
    schedule,
    scenarioType,
    prepaymentMonth,
}: AmortizationScheduleProps) {
    const [viewMode, setViewMode] = useState<'months' | 'years'>('years')

    const displayData = viewMode === 'years' ? aggregateByYear(schedule) : schedule

    const scenarioLabels = {
        original: 'Original Loan',
        reduce_tenure: 'Reduced Tenure',
        reduce_emi: 'Reduced EMI',
    }

    return (
        <Card>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">Amortization Schedule</h3>
                    <p className="text-sm text-slate-500">
                        {scenarioLabels[scenarioType]} • {schedule.length} months
                    </p>
                </div>
                <Toggle
                    options={[
                        { value: 'years', label: 'Years' },
                        { value: 'months', label: 'Months' },
                    ]}
                    value={viewMode}
                    onChange={(val) => setViewMode(val as 'months' | 'years')}
                />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b-2 border-slate-200">
                            <th className="py-3 px-4 text-left font-semibold text-slate-700 whitespace-nowrap">
                                {viewMode === 'years' ? 'Year' : 'Month'}
                            </th>
                            <th className="py-3 px-4 text-right font-semibold text-slate-700 whitespace-nowrap">
                                Opening Bal.
                            </th>
                            <th className="py-3 px-4 text-right font-semibold text-primary-700 whitespace-nowrap">
                                Principal
                            </th>
                            <th className="py-3 px-4 text-right font-semibold text-danger-700 whitespace-nowrap">
                                Interest
                            </th>
                            <th className="py-3 px-4 text-right font-semibold text-success-700 whitespace-nowrap">
                                Part-Payment
                            </th>
                            <th className="py-3 px-4 text-right font-semibold text-slate-700 whitespace-nowrap">
                                Closing Bal.
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayData.map((row, index) => {
                            const isPrepaymentRow = viewMode === 'months'
                                ? row.month === prepaymentMonth
                                : row.year === Math.ceil(prepaymentMonth / 12) && row.partPayment > 0

                            return (
                                <tr
                                    key={viewMode === 'years' ? row.year : row.month}
                                    className={`
                    border-b border-slate-100 transition-colors
                    ${isPrepaymentRow ? 'bg-success-50' : index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                  `}
                                >
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-medium ${isPrepaymentRow ? 'text-success-700' : 'text-slate-900'}`}>
                                                {viewMode === 'years' ? `Year ${row.year}` : `Month ${row.month}`}
                                            </span>
                                            {isPrepaymentRow && (
                                                <span className="px-2 py-0.5 text-xs font-medium bg-success-200 text-success-800 rounded-full whitespace-nowrap">
                                                    Prepayment
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                                        ₹{formatIndianNumber(row.openingBalance)}
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono text-primary-600">
                                        ₹{formatIndianNumber(row.principalComponent)}
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono text-danger-600">
                                        ₹{formatIndianNumber(row.interestComponent)}
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono text-success-600">
                                        {row.partPayment > 0 ? `₹${formatIndianNumber(row.partPayment)}` : '-'}
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-900">
                                        ₹{formatIndianNumber(row.closingBalance)}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-slate-300 bg-slate-100">
                            <td className="py-3 px-4 font-semibold text-slate-900">Total</td>
                            <td className="py-3 px-4 text-right font-mono text-slate-700">-</td>
                            <td className="py-3 px-4 text-right font-mono font-semibold text-primary-700">
                                ₹{formatIndianNumber(schedule.reduce((sum, r) => sum + r.principalComponent, 0))}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-semibold text-danger-700">
                                ₹{formatIndianNumber(schedule.reduce((sum, r) => sum + r.interestComponent, 0))}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-semibold text-success-700">
                                ₹{formatIndianNumber(schedule.reduce((sum, r) => sum + r.partPayment, 0))}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                                ₹0
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-primary-500"></span>
                    <span>Principal Component</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-danger-500"></span>
                    <span>Interest Component</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-success-500"></span>
                    <span>Part-Payment</span>
                </div>
            </div>
        </Card>
    )
}
