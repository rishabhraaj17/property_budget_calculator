'use client'

import { useState } from 'react'
import { LoanOptimizerInput } from '@/lib/loanOptimizerTypes'
import { Input, Toggle, Card } from './ui'
import { formatIndianNumber } from '@/lib/calculations'

interface LoanOptimizerFormProps {
    input: LoanOptimizerInput
    onChange: (input: LoanOptimizerInput) => void
}

export function LoanOptimizerForm({ input, onChange }: LoanOptimizerFormProps) {
    const [interestRateDisplay, setInterestRateDisplay] = useState(
        (input.interestRate * 100).toFixed(2)
    )
    // Track tenure as a display string to allow clearing
    const [tenureDisplay, setTenureDisplay] = useState(
        input.remainingTenureMonths.toString()
    )
    // Track prepayment month as display string
    const [prepaymentDisplay, setPrepaymentDisplay] = useState(
        input.prepaymentMonth.toString()
    )

    const handleChange = (field: keyof LoanOptimizerInput, value: number | string | boolean) => {
        onChange({
            ...input,
            [field]: value,
        })
    }

    const handlePrincipalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/,/g, '')
        const numValue = parseFloat(value) || 0
        handleChange('currentPrincipal', numValue)
    }

    const handlePartPaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/,/g, '')
        const numValue = parseFloat(value) || 0
        handleChange('partPaymentAmount', numValue)
    }

    const handleInterestRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        // Allow empty, digits, and one decimal point
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setInterestRateDisplay(value)
            const numValue = parseFloat(value) || 0
            if (numValue >= 0 && numValue <= 30) {
                handleChange('interestRate', numValue / 100)
            }
        }
    }

    const handleTenureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        // Allow empty or numeric values
        if (value === '' || /^\d+$/.test(value)) {
            setTenureDisplay(value)
            const numValue = parseInt(value)
            if (!isNaN(numValue) && numValue >= 0 && numValue <= 360) {
                handleChange('remainingTenureMonths', numValue)
            }
        }
    }

    const handleTenureBlur = () => {
        // On blur, if empty or invalid, restore from input
        if (tenureDisplay === '' || isNaN(parseInt(tenureDisplay))) {
            setTenureDisplay(input.remainingTenureMonths.toString())
        }
    }

    const handlePrepaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        if (value === '' || /^\d+$/.test(value)) {
            setPrepaymentDisplay(value)
            const numValue = parseInt(value)
            if (!isNaN(numValue) && numValue >= 1 && numValue <= input.remainingTenureMonths) {
                handleChange('prepaymentMonth', numValue)
            }
        }
    }

    const handlePrepaymentBlur = () => {
        if (prepaymentDisplay === '' || isNaN(parseInt(prepaymentDisplay))) {
            setPrepaymentDisplay(input.prepaymentMonth.toString())
        } else {
            const numValue = Math.min(parseInt(prepaymentDisplay), input.remainingTenureMonths)
            setPrepaymentDisplay(numValue.toString())
            handleChange('prepaymentMonth', numValue)
        }
    }

    return (
        <Card className="lg:sticky lg:top-24">
            <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Loan Parameters
            </h3>

            <div className="space-y-5">
                {/* Current Principal */}
                <div>
                    <Input
                        label="Current Outstanding Principal"
                        prefix="₹"
                        type="text"
                        inputMode="numeric"
                        value={input.currentPrincipal.toLocaleString('en-IN')}
                        onChange={handlePrincipalChange}
                        placeholder="50,00,000"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                        {input.currentPrincipal > 0 && `≈ ${formatIndianNumber(input.currentPrincipal)}`}
                    </p>
                </div>

                {/* Interest Rate */}
                <div>
                    <Input
                        label="Interest Rate"
                        suffix="% p.a."
                        type="text"
                        inputMode="decimal"
                        value={interestRateDisplay}
                        onChange={handleInterestRateChange}
                        onBlur={() => setInterestRateDisplay((input.interestRate * 100).toFixed(2))}
                        placeholder="8.50"
                    />
                </div>

                {/* Remaining Tenure */}
                <div>
                    <Input
                        label="Remaining Tenure (months)"
                        type="text"
                        inputMode="numeric"
                        value={tenureDisplay}
                        onChange={handleTenureChange}
                        onBlur={handleTenureBlur}
                        placeholder="e.g., 240"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                        {input.remainingTenureMonths > 0 && (
                            <>≈ {Math.floor(input.remainingTenureMonths / 12)} years {input.remainingTenureMonths % 12} months</>
                        )}
                    </p>
                </div>

                {/* Exact EMI Override */}
                <div>
                    <Input
                        label="Current EMI (Optional)"
                        prefix="₹"
                        type="text"
                        inputMode="numeric"
                        value={input.existingEMI ? input.existingEMI.toLocaleString('en-IN') : ''}
                        onChange={(e) => {
                            const val = e.target.value.replace(/,/g, '')
                            handleChange('existingEMI', val === '' ? 0 : parseFloat(val))
                        }}
                        placeholder="Leave empty to calculate"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                        Enter if different from calculated EMI
                    </p>
                </div>

                <hr className="border-slate-200" />

                {/* Part-Payment Section */}
                <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                    Prepayment Details
                </h4>

                {/* Part-Payment Amount */}
                <div>
                    <Input
                        label="Part-Payment Amount"
                        prefix="₹"
                        type="text"
                        inputMode="numeric"
                        value={input.partPaymentAmount.toLocaleString('en-IN')}
                        onChange={handlePartPaymentChange}
                        placeholder="5,00,000"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                        {input.partPaymentAmount > 0 && `≈ ${formatIndianNumber(input.partPaymentAmount)}`}
                    </p>
                </div>

                {/* Month of Prepayment */}
                <div>
                    <Input
                        label={`Prepayment Month (1-${input.remainingTenureMonths})`}
                        type="text"
                        inputMode="numeric"
                        value={prepaymentDisplay}
                        onChange={handlePrepaymentChange}
                        onBlur={handlePrepaymentBlur}
                        placeholder="e.g., 12"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                        Which month from now will you make the prepayment?
                    </p>
                </div>

                <hr className="border-slate-200" />

                {/* Financial Health Check */}
                <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                    For Personalized Advice
                </h4>

                {/* Emergency Fund Toggle */}
                <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-slate-700">Do you have an emergency fund?</span>
                    <button
                        type="button"
                        onClick={() => handleChange('hasEmergencyFund', !input.hasEmergencyFund)}
                        className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0
              ${input.hasEmergencyFund ? 'bg-primary-600' : 'bg-slate-300'}
            `}
                    >
                        <span
                            className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${input.hasEmergencyFund ? 'translate-x-6' : 'translate-x-1'}
              `}
                        />
                    </button>
                </div>

                {/* Risk Appetite */}
                <Toggle
                    label="Investment Risk Appetite"
                    options={[
                        { value: 'low', label: 'Low' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'high', label: 'High' },
                    ]}
                    value={input.riskAppetite}
                    onChange={(value) => handleChange('riskAppetite', value as 'low' | 'medium' | 'high')}
                />

                {/* Disclaimer */}
                <p className="text-xs text-slate-400 mt-4">
                    * This tool provides indicative calculations. Actual EMI and interest may vary slightly based on your bank's computation method.
                </p>
            </div>
        </Card>
    )
}
