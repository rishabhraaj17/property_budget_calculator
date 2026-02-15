'use client'

import { useMemo, useState, useRef, useEffect } from 'react'
import { AmortizationRow } from '@/lib/loanOptimizerTypes'
import { formatIndianNumber, formatCurrency } from '@/lib/calculations'
import { Card, Tooltip } from './ui'

interface AmortizationChartProps {
    schedule: AmortizationRow[]
    prepaymentMonth: number
}

export function AmortizationChart({ schedule, prepaymentMonth }: AmortizationChartProps) {
    const [hoveredYear, setHoveredYear] = useState<number | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [containerWidth, setContainerWidth] = useState(600)

    // Measure container width
    useEffect(() => {
        const el = containerRef.current
        if (!el) return

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContainerWidth(entry.contentRect.width)
            }
        })
        observer.observe(el)
        setContainerWidth(el.clientWidth)

        return () => observer.disconnect()
    }, [])

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

    // Responsive chart dimensions
    const chartWidth = containerWidth
    const chartHeight = Math.max(250, Math.min(300, containerWidth * 0.5))
    const padding = {
        top: 20,
        right: 10,
        bottom: 40,
        left: containerWidth < 500 ? 45 : 60,
    }
    const plotWidth = chartWidth - padding.left - padding.right
    const plotHeight = chartHeight - padding.top - padding.bottom

    // Calculate scales
    const maxValue = Math.max(...yearlyData.map(d => d.principal + d.interest))
    const maxBalance = yearlyData.length > 0 ? yearlyData[0].balance : 1
    const barWidth = Math.max(4, plotWidth / (yearlyData.length * 1.5))
    const barGap = barWidth * 0.5

    const yScale = (value: number) => plotHeight - (value / maxValue) * plotHeight
    const balanceScale = (value: number) => plotHeight - (value / maxBalance) * plotHeight

    const prepaymentYear = Math.ceil(prepaymentMonth / 12)

    // Find data for hovered year
    const hoveredData = hoveredYear ? yearlyData.find(d => d.year === hoveredYear) : null

    // Decide whether to show all X-labels or just sparse ones
    const showAllLabels = yearlyData.length <= 10 || containerWidth > 700

    return (
        <Card className="relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                <div>
                    <h3 className="text-base sm:text-lg font-semibold text-slate-900">Amortization Breakdown</h3>
                    <p className="text-xs sm:text-sm text-slate-500">
                        Principal vs Interest over loan tenure
                    </p>
                </div>
                <div className="flex gap-3 sm:gap-4 text-xs flex-wrap">
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
                <div className="text-center p-3 bg-primary-50 rounded-lg">
                    <p className="text-xs text-primary-600 uppercase tracking-wide font-medium">Total Principal</p>
                    <div className="flex justify-center">
                        <Tooltip
                            content={`Exact Amount: ${formatCurrency(totals.principal)}`}
                            iconPosition="start"
                        >
                            <p className="text-base sm:text-lg font-bold text-primary-700">₹{formatIndianNumber(totals.principal)}</p>
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
                            <p className="text-base sm:text-lg font-bold text-danger-700">₹{formatIndianNumber(totals.interest)}</p>
                        </Tooltip>
                    </div>
                </div>
                <div className="text-center p-3 bg-slate-100 rounded-lg">
                    <p className="text-xs text-slate-600 uppercase tracking-wide font-medium">Interest Ratio</p>
                    <p className="text-base sm:text-lg font-bold text-slate-700">
                        {((totals.interest / (totals.principal + totals.interest)) * 100).toFixed(1)}%
                    </p>
                </div>
            </div>

            {/* Chart Tooltip Overlay */}
            {hoveredData && (
                <div
                    className="absolute z-10 bg-slate-900 text-white text-xs rounded-lg shadow-xl p-3 pointer-events-none transform -translate-x-1/2 -translate-y-full transition-opacity duration-200"
                    style={{
                        left: Math.min(
                            Math.max(80, padding.left + yearlyData.findIndex(d => d.year === hoveredYear) * (barWidth + barGap) + barGap / 2 + barWidth / 2),
                            containerWidth - 80
                        ),
                        top: padding.top + plotHeight / 2
                    }}
                >
                    <p className="font-bold border-b border-slate-700 pb-1 mb-1">Year {hoveredData.year}</p>
                    <div className="space-y-1">
                        <div className="flex justify-between gap-4">
                            <span className="text-primary-300">Principal:</span>
                            <span className="font-mono">{formatCurrency(hoveredData.principal)}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-danger-300">Interest:</span>
                            <span className="font-mono">{formatCurrency(hoveredData.interest)}</span>
                        </div>
                        <div className="flex justify-between gap-4 border-t border-slate-700 pt-1 mt-1">
                            <span className="text-success-400">Balance:</span>
                            <span className="font-mono">{formatCurrency(hoveredData.balance)}</span>
                        </div>
                    </div>
                    {/* Tiny arrow pointing down */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-900"></div>
                </div>
            )}

            {/* SVG Chart */}
            <div ref={containerRef} className="overflow-x-auto relative w-full">
                <svg
                    width={chartWidth}
                    height={chartHeight}
                    className="mx-auto"
                    style={{ minWidth: Math.min(chartWidth, 300) }}
                    onMouseLeave={() => setHoveredYear(null)}
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
                                className="fill-slate-400"
                                style={{ fontSize: containerWidth < 500 ? '9px' : '12px' }}
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
                        const isHovered = d.year === hoveredYear

                        return (
                            <g
                                key={d.year}
                                onMouseEnter={() => setHoveredYear(d.year)}
                                onTouchStart={() => setHoveredYear(d.year)}
                                className="cursor-crosshair transition-all duration-200"
                                style={{ opacity: hoveredYear && !isHovered ? 0.4 : 1 }}
                            >
                                {/* Hit area (invisible rect for better hover) */}
                                <rect
                                    x={x - barGap / 2}
                                    y={padding.top}
                                    width={barWidth + barGap}
                                    height={plotHeight}
                                    fill="transparent"
                                />

                                {/* Interest (bottom) */}
                                <rect
                                    x={x}
                                    y={padding.top + plotHeight - interestHeight}
                                    width={barWidth}
                                    height={interestHeight}
                                    className={`transition-colors duration-200 ${isHovered ? 'fill-danger-500' : 'fill-danger-400'}`}
                                    rx={Math.min(2, barWidth / 4)}
                                />
                                {/* Principal (top) */}
                                <rect
                                    x={x}
                                    y={padding.top + plotHeight - interestHeight - principalHeight}
                                    width={barWidth}
                                    height={principalHeight}
                                    className={`transition-colors duration-200 ${isHovered ? 'fill-primary-600' : 'fill-primary-500'}`}
                                    rx={Math.min(2, barWidth / 4)}
                                />
                                {/* Prepayment marker */}
                                {isPrepaymentYear && (
                                    <circle
                                        cx={x + barWidth / 2}
                                        cy={padding.top + plotHeight + 15}
                                        r={3}
                                        className="fill-success-500"
                                    />
                                )}
                                {/* X-axis label */}
                                <text
                                    x={x + barWidth / 2}
                                    y={padding.top + plotHeight + 25}
                                    textAnchor="middle"
                                    className={`transition-colors duration-200 ${isHovered
                                        ? 'fill-slate-900 font-bold'
                                        : isPrepaymentYear
                                            ? 'fill-success-700 font-semibold'
                                            : 'fill-slate-500'
                                        }`}
                                    style={{ fontSize: containerWidth < 500 ? '8px' : '12px' }}
                                >
                                    {showAllLabels || d.year % 5 === 0 || i === 0 || i === yearlyData.length - 1 || isHovered
                                        ? `Y${d.year}`
                                        : ''}
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
                        className="pointer-events-none"
                    />

                    {/* Balance Points */}
                    {yearlyData.map((d, i) => {
                        const x = padding.left + i * (barWidth + barGap) + barWidth / 2 + barGap / 2
                        const y = padding.top + balanceScale(d.balance)
                        const isHovered = d.year === hoveredYear

                        return (
                            <circle
                                key={`point-${d.year}`}
                                cx={x}
                                cy={y}
                                r={isHovered ? 5 : containerWidth < 500 ? 2 : 4}
                                className={`transition-all duration-200 ${isHovered ? 'fill-success-600 stroke-white' : 'fill-white stroke-success-500'}`}
                                strokeWidth={2}
                            />
                        )
                    })}
                </svg>
            </div>

            {/* Note */}
            <p className="text-xs text-slate-400 mt-4 text-center">
                {containerWidth < 500 ? 'Tap bars for details.' : 'Hover over bars to see detailed breakdown.'} Green line shows remaining balance.
            </p>
        </Card>
    )
}
