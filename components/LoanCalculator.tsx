'use client'

import { CalculationResult } from '@/lib/types'
import { formatCurrency, formatIndianNumber, formatPercentage } from '@/lib/calculations'
import { Card } from './ui'
import { DEFAULTS } from '@/lib/constants'

interface LoanCalculatorProps {
  calculations: CalculationResult
  interestRate?: number
  tenureYears?: number
}

export function LoanCalculator({
  calculations,
  interestRate = DEFAULTS.INTEREST_RATE,
  tenureYears = DEFAULTS.TENURE_YEARS,
}: LoanCalculatorProps) {
  const monthlyPayments = tenureYears * 12
  const principalPerMonth = calculations.loanAmount / monthlyPayments
  const interestPerMonth = calculations.totalInterest / monthlyPayments

  // Calculate year-by-year amortization summary
  const yearlyBreakdown = []
  let remainingPrincipal = calculations.loanAmount

  for (let year = 1; year <= Math.min(tenureYears, 5); year++) {
    const yearlyInterest = remainingPrincipal * interestRate
    const yearlyPrincipal = calculations.emi * 12 - yearlyInterest
    remainingPrincipal -= yearlyPrincipal

    yearlyBreakdown.push({
      year,
      principal: Math.max(0, yearlyPrincipal),
      interest: yearlyInterest,
      balance: Math.max(0, remainingPrincipal),
    })
  }

  return (
    <Card>
      <h4 className="font-semibold text-slate-900 mb-4">Loan Details</h4>

      {/* Main Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-slate-50 rounded-lg">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Principal</p>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {formatIndianNumber(calculations.loanAmount)}
          </p>
        </div>
        <div className="text-center p-4 bg-danger-50 rounded-lg">
          <p className="text-xs text-danger-600 uppercase tracking-wide">Total Interest</p>
          <p className="text-xl font-bold text-danger-700 mt-1">
            {formatIndianNumber(calculations.totalInterest)}
          </p>
        </div>
        <div className="text-center p-4 bg-primary-50 rounded-lg">
          <p className="text-xs text-primary-600 uppercase tracking-wide">Total Payment</p>
          <p className="text-xl font-bold text-primary-700 mt-1">
            {formatIndianNumber(calculations.totalLoanPayment)}
          </p>
        </div>
      </div>

      {/* EMI Breakdown */}
      <div className="mb-6">
        <h5 className="text-sm font-medium text-slate-700 mb-3">Monthly EMI Breakdown</h5>
        <div className="flex items-center gap-2 mb-2">
          <div className="h-4 bg-primary-500 rounded" style={{ width: `${(principalPerMonth / calculations.emi) * 100}%` }} />
          <div className="h-4 bg-danger-500 rounded flex-1" />
        </div>
        <div className="flex justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-primary-500 rounded" />
            <span className="text-slate-600">Principal: {formatCurrency(principalPerMonth)}/mo (avg)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-danger-500 rounded" />
            <span className="text-slate-600">Interest: {formatCurrency(interestPerMonth)}/mo (avg)</span>
          </div>
        </div>
      </div>

      {/* Key Info */}
      <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 rounded-lg">
        <div>
          <p className="text-xs text-slate-500">Interest Rate</p>
          <p className="font-semibold text-slate-900">{formatPercentage(interestRate)} p.a.</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Loan Tenure</p>
          <p className="font-semibold text-slate-900">{tenureYears} years ({monthlyPayments} EMIs)</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">LTV Ratio</p>
          <p className="font-semibold text-slate-900">{formatPercentage(calculations.ltvRate)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Downpayment</p>
          <p className="font-semibold text-slate-900">{formatCurrency(calculations.downpayment)}</p>
        </div>
      </div>

      {/* Yearly Breakdown (first 5 years) */}
      <div>
        <h5 className="text-sm font-medium text-slate-700 mb-3">Year-by-Year Breakdown (First 5 Years)</h5>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-2 text-left font-medium text-slate-600">Year</th>
                <th className="py-2 text-right font-medium text-slate-600">Principal</th>
                <th className="py-2 text-right font-medium text-slate-600">Interest</th>
                <th className="py-2 text-right font-medium text-slate-600">Balance</th>
              </tr>
            </thead>
            <tbody>
              {yearlyBreakdown.map((row) => (
                <tr key={row.year} className="border-b border-slate-100">
                  <td className="py-2 text-slate-900">Year {row.year}</td>
                  <td className="py-2 text-right text-primary-600">{formatIndianNumber(row.principal)}</td>
                  <td className="py-2 text-right text-danger-600">{formatIndianNumber(row.interest)}</td>
                  <td className="py-2 text-right text-slate-900">{formatIndianNumber(row.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interest to Principal Ratio */}
      <div className="mt-6 p-4 bg-warning-50 rounded-lg border border-warning-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-warning-800">Interest to Principal Ratio</p>
            <p className="text-xs text-warning-600 mt-0.5">
              For every ₹1 of principal, you pay ₹{(calculations.totalInterest / calculations.loanAmount).toFixed(2)} in interest
            </p>
          </div>
          <p className="text-2xl font-bold text-warning-700">
            {((calculations.totalInterest / calculations.loanAmount) * 100).toFixed(0)}%
          </p>
        </div>
      </div>
    </Card>
  )
}
