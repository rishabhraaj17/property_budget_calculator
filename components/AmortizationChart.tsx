'use client'

import { useMemo } from 'react'
import { AmortizationRow } from '@/lib/loanOptimizerTypes'
import { formatIndianNumber, formatCurrency } from '@/lib/calculations'
import { Card, Tooltip } from './ui'

interface AmortizationChartProps {
    schedule: AmortizationRow[]
    prepaymentMonth: number
}

export function AmortizationChart({ schedule, prepaymentMonth }: AmortizationChartProps) {
    // Aggregate by year for chart
    const yearlyData = useMemo(() => {
        const years = new Map<number, { principal: number; interest: number; balance: number }>()

        for (const row of schedule) {
            if (!years.has(row.year)) {
                years.set(row.year, { principal: 0, interest: 0, balance: row.closingBalance })
            }
            const yearData = years.get(row.year)!
            yearData.principal += row.principalComponent
            yearData.interest += row.interestComponent
            yearData.balance = row.closingBalance
        }

        return Array.from(years.entries()).map(([year, data]) => ({
            year,
            ...data,
        }))
    }, [schedule])

    // Calculate totals for percentages
    const totals = useMemo(() => {
        return {
            principal: schedule.reduce((sum, r) => sum + r.principalComponent, 0),
            interest: schedule.reduce((sum, r) => sum + r.interestComponent, 0),
        }
    }, [schedule])

    // Chart dimensions
    const chartWidth = 600
    const chartHeight = 300
    const padding = { top: 20, right: 20, bottom: 40, left: 60 }
    const plotWidth = chartWidth - padding.left - padding.right
    const plotHeight = chartHeight - padding.top - padding.bottom

    // Calculate scales
    const maxValue = Math.max(...yearlyData.map(d => d.principal + d.interest))
    const maxBalance = yearlyData.length > 0 ? yearlyData[0].balance : 1
    const barWidth = plotWidth / (yearlyData.length * 1.5)
    const barGap = barWidth * 0.5

    const yScale = (value: number) => plotHeight - (value / maxValue) * plotHeight
    const balanceScale = (value: number) => plotHeight - (value / maxBalance) * plotHeight

    const prepaymentYear = Math.ceil(prepaymentMonth / 12)

    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">Amortization Breakdown</h3>
                    <p className="text-sm text-slate-500">
                        Principal vs Interest over loan tenure
                    </p>
                </div>
                <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-primary-500"></span>
                        <span className="text-slate-600">Principal</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-danger-400"></span>
                        <span className="text-slate-600">Interest</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full border-2 border-success-500 bg-white"></span>
                        <span className="text-slate-600">Balance</span>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-primary-50 rounded-lg">
                    <p className="text-xs text-primary-600 uppercase tracking-wide font-medium">Total Principal</p>
                    <div className="flex justify-center">
                        <Tooltip
                            content={`Exact Amount: ${formatCurrency(totals.principal)}`}
                            iconPosition="start"
                        >
                            <p className="text-lg font-bold text-primary-700">₹{formatIndianNumber(totals.principal)}</p>
                        </Tooltip>
                    </div>
                </div>
                <div className="text-center p-3 bg-danger-50 rounded-lg">
                    <p className="text-xs text-danger-600 uppercase tracking-wide font-medium">Total Interest</p>
                    <div className="flex justify-center">
                        <Tooltip
                            content={`Exact Amount: ${formatCurrency(totals.interest)}`}
                            iconPosition="start"
                        >
                            <p className="text-lg font-bold text-danger-700">₹{formatIndianNumber(totals.interest)}</p>
                        </Tooltip>
                    </div>
                </div>
                <div className="text-center p-3 bg-slate-100 rounded-lg">
                    <p className="text-xs text-slate-600 uppercase tracking-wide font-medium">Interest Ratio</p>
                    <p className="text-lg font-bold text-slate-700">
                        {((totals.interest / (totals.principal + totals.interest)) * 100).toFixed(1)}%
                    </p>
                </div>
            </div>

            {/* SVG Chart */}
            <div className="overflow-x-auto">
                <svg
                    width={chartWidth}
                    height={chartHeight}
                    className="mx-auto"
                    style={{ minWidth: chartWidth }}
                >
                    {/* Y-axis gridlines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
                        <g key={tick}>
                            <line
                                x1={padding.left}
                                y1={padding.top + plotHeight * (1 - tick)}
                                x2={padding.left + plotWidth}
                                y2={padding.top + plotHeight * (1 - tick)}
                                stroke="#e2e8f0"
                                strokeDasharray="4,4"
                            />
                            <text
                                x={padding.left - 8}
                                y={padding.top + plotHeight * (1 - tick) + 4}
                                textAnchor="end"
                                className="text-xs fill-slate-400"
                            >
                                {formatIndianNumber(maxValue * tick)}
                            </text>
                        </g>
                    ))}

                    {/* Stacked Bars */}
                    {yearlyData.map((d, i) => {
                        const x = padding.left + i * (barWidth + barGap) + barGap / 2
                        const principalHeight = (d.principal / maxValue) * plotHeight
                        const interestHeight = (d.interest / maxValue) * plotHeight
                        const isPrepaymentYear = d.year === prepaymentYear

                        return (
                            <g key={d.year}>
                                {/* Interest (bottom) */}
                                <rect
                                    x={x}
                                    y={padding.top + plotHeight - interestHeight}
                                    width={barWidth}
                                    height={interestHeight}
                                    className="fill-danger-400"
                                    rx={2}
                                />
                                {/* Principal (top) */}
                                <rect
                                    x={x}
                                    y={padding.top + plotHeight - interestHeight - principalHeight}
                                    width={barWidth}
                                    height={principalHeight}
                                    className="fill-primary-500"
                                    rx={2}
                                />
                                {/* Prepayment marker */}
                                {isPrepaymentYear && (
                                    <circle
                                        cx={x + barWidth / 2}
                                        cy={padding.top + plotHeight + 15}
                                        r={4}
                                        className="fill-success-500"
                                    />
                                )}
                                {/* X-axis label */}
                                <text
                                    x={x + barWidth / 2}
                                    y={padding.top + plotHeight + 25}
                                    textAnchor="middle"
                                    className={`text-xs ${isPrepaymentYear ? 'fill-success-700 font-semibold' : 'fill-slate-500'}`}
                                >
                                    Y{d.year}
                                </text>
                            </g>
                        )
                    })}

                    {/* Balance Line */}
                    <path
                        d={yearlyData.map((d, i) => {
                            const x = padding.left + i * (barWidth + barGap) + barWidth / 2 + barGap / 2
                            const y = padding.top + balanceScale(d.balance)
                            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
                        }).join(' ')}
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth={2}
                        strokeLinejoin="round"
                    />

                    {/* Balance Points */}
                    {yearlyData.map((d, i) => {
                        const x = padding.left + i * (barWidth + barGap) + barWidth / 2 + barGap / 2
                        const y = padding.top + balanceScale(d.balance)
                        return (
                            <circle
                                key={`point-${d.year}`}
                                cx={x}
                                cy={y}
                                r={4}
                                className="fill-white stroke-success-500"
                                strokeWidth={2}
                            />
                        )
                    })}
                </svg>
            </div>

            {/* Note */}
            <p className="text-xs text-slate-400 mt-4 text-center">
                Green dots on balance line show remaining principal. Prepayment year marked with green circle.
            </p>
        </Card>
    )
}
