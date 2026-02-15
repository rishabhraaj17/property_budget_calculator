'use client'

import { useState } from 'react'
import { Card } from './ui/Card'
import { Input } from './ui/Input'
import { Button } from './ui/Button'
import { Toggle } from './ui/Toggle'
import { MultiPropertyLoan, MultiPropertyInput } from '@/lib/loanOptimizerTypes'

interface MultiPropertyOptimizerFormProps {
    onCalculate: (input: MultiPropertyInput) => void
}

// Counter for generating unique IDs client-side only
let idCounter = 0
function generateId(): string {
    idCounter += 1
    return `loan-${idCounter}-${Date.now()}`
}

const createDefaultLoan = (name: string, id?: string): MultiPropertyLoan => ({
    id: id || generateId(),
    name,
    currentPrincipal: 0,
    interestRate: 0,
    remainingTenureMonths: 0,
})

export function MultiPropertyOptimizerForm({ onCalculate }: MultiPropertyOptimizerFormProps) {
    // Use deterministic IDs for initial loans to avoid hydration mismatch
    const [loans, setLoans] = useState<MultiPropertyLoan[]>(() => [
        createDefaultLoan('Property 1', 'initial-1'),
        createDefaultLoan('Property 2', 'initial-2'),
    ])
    const [totalPrepayment, setTotalPrepayment] = useState(0)
    const [totalPrepaymentDisplay, setTotalPrepaymentDisplay] = useState('0')
    const [prepaymentMonth, setPrepaymentMonth] = useState(1)
    const [prepaymentMonthDisplay, setPrepaymentMonthDisplay] = useState('1')
    const [strategy, setStrategy] = useState<'highest_rate' | 'smallest_balance' | 'manual'>('highest_rate')
    const [manualAllocations, setManualAllocations] = useState<Record<string, number>>(() => {
        const equal = Math.round(100 / 2)
        return { 'initial-1': equal, 'initial-2': 100 - equal }
    })
    const [hasEmergencyFund, setHasEmergencyFund] = useState(false)
    const [riskAppetite, setRiskAppetite] = useState<'low' | 'medium' | 'high'>('medium')

    // Display strings for each loan's numeric fields
    const [loanDisplays, setLoanDisplays] = useState<Record<string, Record<string, string>>>({})

    const getDisplay = (loanId: string, field: string, value: number): string => {
        // Return empty string for zero values to show placeholder instead
        if (loanDisplays[loanId]?.[field] !== undefined) {
            return loanDisplays[loanId][field]
        }
        return value === 0 ? '' : String(value)
    }

    const setDisplay = (loanId: string, field: string, displayVal: string) => {
        setLoanDisplays(prev => ({
            ...prev,
            [loanId]: { ...(prev[loanId] || {}), [field]: displayVal },
        }))
    }

    const updateLoan = (id: string, field: keyof MultiPropertyLoan, value: string | number) => {
        setLoans(prev =>
            prev.map(loan =>
                loan.id === id ? { ...loan, [field]: value } : loan
            )
        )
    }

    const redistributeAllocations = (loanIds: string[]) => {
        const equal = Math.floor(100 / loanIds.length)
        const remainder = 100 - equal * loanIds.length
        const allocs: Record<string, number> = {}
        loanIds.forEach((id, i) => {
            allocs[id] = equal + (i === 0 ? remainder : 0)
        })
        setManualAllocations(allocs)
    }

    const addLoan = () => {
        const newLoan = createDefaultLoan(`Property ${loans.length + 1}`)
        setLoans(prev => {
            const next = [...prev, newLoan]
            redistributeAllocations(next.map(l => l.id))
            return next
        })
    }

    const removeLoan = (id: string) => {
        if (loans.length <= 2) return
        setLoans(prev => {
            const next = prev.filter(loan => loan.id !== id)
            redistributeAllocations(next.map(l => l.id))
            return next
        })
        setLoanDisplays(prev => {
            const next = { ...prev }
            delete next[id]
            return next
        })
    }

    const handleSubmit = () => {
        // Validate
        const validLoans = loans.filter(
            l => l.currentPrincipal > 0 && l.interestRate > 0 && l.remainingTenureMonths > 0
        )
        if (validLoans.length < 2) return
        if (totalPrepayment <= 0) return

        onCalculate({
            loans: validLoans.map(l => ({
                ...l,
                interestRate: l.interestRate / 100, // Convert percentage to decimal
            })),
            totalPrepaymentAmount: totalPrepayment,
            prepaymentMonth,
            strategy,
            hasEmergencyFund,
            riskAppetite,
            ...(strategy === 'manual' ? { manualAllocations } : {}),
        })
    }

    const handleNumericChange = (
        loanId: string,
        field: 'currentPrincipal' | 'interestRate' | 'remainingTenureMonths' | 'existingEMI',
        rawValue: string,
        isFloat = false
    ) => {

        setDisplay(loanId, field, rawValue)
        if (rawValue === '' || rawValue === '.') {
            updateLoan(loanId, field as any, 0)
        } else {
            const parsed = isFloat ? parseFloat(rawValue) : parseInt(rawValue)
            if (!isNaN(parsed)) {
                updateLoan(loanId, field as any, parsed)
            }
        }
    }


    const handlePrepaymentMonthChange = (val: string) => {
        setPrepaymentMonthDisplay(val)
        const parsed = parseInt(val)
        if (!isNaN(parsed) && parsed > 0) {
            setPrepaymentMonth(parsed)
        }
    }

    const totalEMI = loans.reduce((sum, loan) => {
        if (loan.currentPrincipal > 0 && loan.interestRate > 0 && loan.remainingTenureMonths > 0) {
            const r = (loan.interestRate / 100) / 12
            const n = loan.remainingTenureMonths
            const p = loan.currentPrincipal
            const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
            return sum + Math.round(emi)
        }
        return sum
    }, 0)

    const totalOutstanding = loans.reduce((sum, l) => sum + l.currentPrincipal, 0)

    const isValid = loans.filter(
        l => l.currentPrincipal > 0 && l.interestRate > 0 && l.remainingTenureMonths > 0
    ).length >= 2 && totalPrepayment > 0

    return (
        <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-xl p-4 border border-primary-200/50">
                    <p className="text-xs font-medium text-primary-600 uppercase tracking-wider">Properties</p>
                    <p className="text-2xl font-bold text-primary-900 mt-1">{loans.length}</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4 border border-emerald-200/50">
                    <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Total Outstanding</p>
                    <p className="text-2xl font-bold text-emerald-900 mt-1">₹{(totalOutstanding / 100000).toFixed(1)}L</p>
                </div>
                <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-4 border border-amber-200/50">
                    <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Combined EMI</p>
                    <p className="text-2xl font-bold text-amber-900 mt-1">₹{totalEMI.toLocaleString('en-IN')}</p>
                </div>
            </div>

            {/* Loan Cards */}
            {loans.map((loan, index) => (
                <Card key={loan.id} className="relative overflow-hidden">
                    {/* Gradient accent bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-violet-500" />

                    <div className="pt-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3 w-full">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                    {index + 1}
                                </div>
                                <input
                                    type="text"
                                    value={loan.name}
                                    onChange={(e) => updateLoan(loan.id, 'name', e.target.value)}
                                    className="text-lg font-semibold text-slate-900 bg-transparent border-none outline-none focus:ring-0 p-0 w-full placeholder:text-slate-400"
                                    placeholder="Property Name"
                                />
                            </div>
                            {loans.length > 2 && (
                                <button
                                    onClick={() => removeLoan(loan.id)}
                                    className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg p-2 transition-colors"
                                    title="Remove property"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                            <Input
                                label="Outstanding Principal"
                                type="text"
                                inputMode="numeric"
                                prefix="₹"
                                value={getDisplay(loan.id, 'currentPrincipal', loan.currentPrincipal)}
                                onChange={(e) => handleNumericChange(loan.id, 'currentPrincipal', e.target.value)}
                                labelClassName="h-11 flex items-end pb-1"
                            />
                            <Input
                                label="Interest Rate"
                                type="text"
                                inputMode="decimal"
                                suffix="%"
                                placeholder="e.g., 8.5"
                                value={getDisplay(loan.id, 'interestRate', loan.interestRate)}
                                onChange={(e) => handleNumericChange(loan.id, 'interestRate', e.target.value, true)}
                                labelClassName="h-11 flex items-end pb-1"
                            />
                            <Input
                                label="Remaining Tenure (months)"
                                type="text"
                                inputMode="numeric"
                                placeholder="e.g., 240"
                                value={getDisplay(loan.id, 'remainingTenureMonths', loan.remainingTenureMonths)}
                                onChange={(e) => handleNumericChange(loan.id, 'remainingTenureMonths', e.target.value)}
                                labelClassName="h-11 flex items-end pb-1"
                            />
                            <Input
                                label="Existing EMI (Optional)"
                                type="text"
                                inputMode="numeric"
                                prefix="₹"
                                value={getDisplay(loan.id, 'existingEMI', loan.existingEMI || 0)}
                                onChange={(e) => handleNumericChange(loan.id, 'existingEMI', e.target.value)}
                                placeholder="Auto-calculated"
                                labelClassName="h-11 flex items-end pb-1"
                            />
                        </div>
                    </div>
                </Card>
            ))}

            {/* Add Property Button */}
            <button
                onClick={addLoan}
                className="w-full py-3 px-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:text-primary-600 hover:border-primary-400 hover:bg-primary-50/50 transition-all flex items-center justify-center gap-2 group"
            >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="font-medium">Add Another Property</span>
            </button>

            {/* Prepayment & Settings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Prepayment Budget */}
                <Card className="border-2 border-primary-200/50 bg-gradient-to-br from-white to-primary-50/30">
                    <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Prepayment Settings
                    </h3>

                    <div className="space-y-6">
                        <Input
                            label="Total Prepayment Budget"
                            type="text"
                            inputMode="numeric"
                            prefix="₹"
                            value={totalPrepaymentDisplay}
                            onChange={(e) => {
                                const raw = e.target.value
                                setTotalPrepaymentDisplay(raw)
                                if (raw === '') {
                                    setTotalPrepayment(0)
                                } else {
                                    const parsed = parseInt(raw)
                                    if (!isNaN(parsed)) setTotalPrepayment(parsed)
                                }
                            }}
                            labelClassName="h-11 flex items-end pb-1"
                        />

                        <Input
                            label="Prepayment Month (from now)"
                            type="text"
                            inputMode="numeric"
                            placeholder="e.g., 1"
                            value={prepaymentMonthDisplay}
                            onChange={(e) => handlePrepaymentMonthChange(e.target.value)}
                            labelClassName="h-11 flex items-end pb-1"
                        />

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-3">
                                Allocation Strategy
                            </label>
                            <Toggle
                                options={[
                                    { value: 'highest_rate', label: 'Highest Rate First' },
                                    { value: 'smallest_balance', label: 'Smallest Balance First' },
                                    { value: 'manual', label: 'Custom Split' },
                                ]}
                                value={strategy}
                                onChange={(v) => setStrategy(v as 'highest_rate' | 'smallest_balance' | 'manual')}
                            />
                            <p className="text-xs text-slate-500 mt-2">
                                {strategy === 'highest_rate'
                                    ? '💡 Avalanche method: Saves the most money by targeting high-interest loans first.'
                                    : strategy === 'smallest_balance'
                                        ? '💡 Snowball method: Builds momentum by clearing small loans first for psychological wins.'
                                        : '💡 Custom split: You decide what percentage of the budget goes to each property.'}
                            </p>
                        </div>

                        {/* Manual Allocation Sliders */}
                        {strategy === 'manual' && (
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-slate-700">
                                    Budget Split per Property
                                </label>
                                {loans.map((loan) => {
                                    const pct = manualAllocations[loan.id] || 0
                                    const amount = Math.round(totalPrepayment * (pct / 100))
                                    return (
                                        <div key={loan.id} className="space-y-1">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium text-slate-700 truncate mr-2">{loan.name}</span>
                                                <span className="text-slate-600 flex-shrink-0">
                                                    {pct}% &middot; ₹{amount.toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min={0}
                                                max={100}
                                                value={pct}
                                                onChange={(e) => {
                                                    const newPct = parseInt(e.target.value)
                                                    const otherIds = loans.filter(l => l.id !== loan.id).map(l => l.id)
                                                    const remaining = 100 - newPct
                                                    const oldOtherTotal = otherIds.reduce((s, id) => s + (manualAllocations[id] || 0), 0)
                                                    const newAllocs: Record<string, number> = { [loan.id]: newPct }

                                                    if (oldOtherTotal === 0) {
                                                        // Distribute remaining equally
                                                        const each = Math.floor(remaining / otherIds.length)
                                                        const rem = remaining - each * otherIds.length
                                                        otherIds.forEach((id, i) => {
                                                            newAllocs[id] = each + (i === 0 ? rem : 0)
                                                        })
                                                    } else {
                                                        // Scale other allocations proportionally
                                                        let distributed = 0
                                                        otherIds.forEach((id, i) => {
                                                            if (i === otherIds.length - 1) {
                                                                newAllocs[id] = remaining - distributed
                                                            } else {
                                                                const scaled = Math.round((manualAllocations[id] || 0) / oldOtherTotal * remaining)
                                                                newAllocs[id] = scaled
                                                                distributed += scaled
                                                            }
                                                        })
                                                    }

                                                    setManualAllocations(newAllocs)
                                                }}
                                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                                            />
                                        </div>
                                    )
                                })}
                                {/* Total indicator */}
                                {(() => {
                                    const total = Object.values(manualAllocations).reduce((s, v) => s + v, 0)
                                    return (
                                        <div className={`text-xs font-medium text-right ${total === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                            Total: {total}%{total !== 100 && ' (must equal 100%)'}
                                        </div>
                                    )
                                })()}
                            </div>
                        )}
                    </div>
                </Card>

                {/* Financial Health & Risk */}
                <Card className="border-2 border-slate-200 bg-white">
                    <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Financial Profile
                    </h3>

                    <div className="space-y-5">
                        {/* Emergency Fund Toggle */}
                        <div className="bg-slate-50 rounded-lg p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-900">Emergency Fund</p>
                                    <p className="text-xs text-slate-500 mt-0.5">6+ months expenses saved?</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setHasEmergencyFund(!hasEmergencyFund)}
                                    className={`
                                        relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0
                                        ${hasEmergencyFund ? 'bg-emerald-600' : 'bg-slate-300'}
                                    `}
                                    aria-label="Toggle emergency fund status"
                                >
                                    <span
                                        className={`
                                            inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm
                                            ${hasEmergencyFund ? 'translate-x-6' : 'translate-x-1'}
                                        `}
                                    />
                                </button>
                            </div>
                            <p className={`text-xs mt-2 ${hasEmergencyFund ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {hasEmergencyFund ? '✓ Safety net in place' : '⚠️ Build savings first'}
                            </p>
                        </div>

                        {/* Risk Appetite */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Risk Appetite
                            </label>
                            <div className="flex gap-2">
                                {(['low', 'medium', 'high'] as const).map((level) => (
                                    <button
                                        key={level}
                                        type="button"
                                        onClick={() => setRiskAppetite(level)}
                                        className={`
                                            flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-all capitalize
                                            ${riskAppetite === level
                                                ? 'bg-primary-600 text-white shadow-sm'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }
                                        `}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                Affects prepay vs invest recommendation.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Calculate Button */}
            <Button
                onClick={handleSubmit}
                disabled={!isValid}
                className={`w-full py-4 text-lg font-semibold rounded-xl transition-all ${isValid
                    ? 'bg-gradient-to-r from-primary-600 to-violet-600 hover:from-primary-700 hover:to-violet-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
            >
                🔍 Optimize Across {loans.length} Properties
            </Button>

            {!isValid && (
                <p className="text-xs text-center text-slate-400">
                    Fill in at least 2 properties with valid details and a prepayment amount to calculate.
                </p>
            )}
        </div>
    )
}
