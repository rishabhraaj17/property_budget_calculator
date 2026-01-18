'use client'

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { CalculationResult } from '@/lib/types'
import { formatCurrency, formatIndianNumber, formatPercentage } from '@/lib/calculations'
import { CHART_COLORS } from '@/lib/constants'
import { Card } from './ui'

interface CostBreakdownProps {
  calculations: CalculationResult
  propertyType: 'builder' | 'resale'
}

export function CostBreakdown({ calculations, propertyType }: CostBreakdownProps) {
  // Prepare data for pie chart (Out of Pocket breakdown)
  const outOfPocketData = [
    { name: 'Downpayment', value: calculations.downpayment, color: CHART_COLORS.downpayment },
    ...(propertyType === 'builder' && calculations.gst > 0
      ? [{ name: 'GST', value: calculations.gst, color: CHART_COLORS.gst }]
      : []),
    { name: 'Stamp Duty', value: calculations.stampDuty, color: CHART_COLORS.stampDuty },
    { name: 'Registration', value: calculations.registrationFee, color: CHART_COLORS.registration },
    ...(calculations.blackComponent > 0
      ? [{ name: 'Black Component', value: calculations.blackComponent, color: CHART_COLORS.black }]
      : []),
  ].filter((item) => item.value > 0)

  // Prepare data for bar chart (Loan vs Out of Pocket)
  const comparisonData = [
    { name: 'Out of Pocket', amount: calculations.totalOutOfPocket },
    { name: 'Loan Principal', amount: calculations.loanAmount },
    { name: 'Total Interest', amount: calculations.totalInterest },
  ]

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { value: number; name: string }[] }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-3 py-2 shadow-lg rounded-lg border border-slate-200">
          <p className="text-sm font-medium">{payload[0].name}</p>
          <p className="text-sm text-slate-600">{formatCurrency(payload[0].value)}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="sm" className="text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Agreement Value</p>
          <p className="text-lg font-bold text-slate-900 mt-1">
            {formatIndianNumber(calculations.agreementValue)}
          </p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Out of Pocket</p>
          <p className="text-lg font-bold text-primary-600 mt-1">
            {formatIndianNumber(calculations.totalOutOfPocket)}
          </p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Loan Amount</p>
          <p className="text-lg font-bold text-slate-900 mt-1">
            {formatIndianNumber(calculations.loanAmount)}
          </p>
          <p className="text-xs text-slate-400">{formatPercentage(calculations.ltvRate)} LTV</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Monthly EMI</p>
          <p className="text-lg font-bold text-danger-600 mt-1">
            {formatIndianNumber(calculations.emi)}
          </p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Out of Pocket Breakdown */}
        <Card>
          <h4 className="font-semibold text-slate-900 mb-4">Out of Pocket Breakdown</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={outOfPocketData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {outOfPocketData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) => <span className="text-sm text-slate-600">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Bar Chart - Cost Comparison */}
        <Card>
          <h4 className="font-semibold text-slate-900 mb-4">Cost Comparison</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} layout="vertical">
                <XAxis
                  type="number"
                  tickFormatter={(value) => formatIndianNumber(value)}
                  fontSize={12}
                />
                <YAxis type="category" dataKey="name" width={100} fontSize={12} />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Amount']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="amount" fill={CHART_COLORS.downpayment} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Detailed Breakdown Table */}
      <Card>
        <h4 className="font-semibold text-slate-900 mb-4">Detailed Breakdown</h4>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">White Component (Agreement)</span>
            <span className="font-medium">{formatCurrency(calculations.whiteComponent)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">Black Component (Cash)</span>
            <span className="font-medium">{formatCurrency(calculations.blackComponent)}</span>
          </div>

          <div className="pt-2 pb-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Government Charges</p>
          </div>
          {propertyType === 'builder' && (
            <div className="flex justify-between py-2 border-b border-slate-100 pl-4">
              <span className="text-slate-600">GST</span>
              <span className="font-medium">{formatCurrency(calculations.gst)}</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-b border-slate-100 pl-4">
            <span className="text-slate-600">Stamp Duty</span>
            <span className="font-medium">{formatCurrency(calculations.stampDuty)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100 pl-4">
            <span className="text-slate-600">Registration Fee</span>
            <span className="font-medium">{formatCurrency(calculations.registrationFee)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100 bg-slate-50 px-4 -mx-4">
            <span className="font-medium text-slate-700">Total Government Charges</span>
            <span className="font-semibold text-warning-600">{formatCurrency(calculations.totalGovtCharges)}</span>
          </div>

          <div className="pt-2 pb-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Loan Details</p>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100 pl-4">
            <span className="text-slate-600">LTV Rate</span>
            <span className="font-medium">{formatPercentage(calculations.ltvRate)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100 pl-4">
            <span className="text-slate-600">Loan Amount</span>
            <span className="font-medium">{formatCurrency(calculations.loanAmount)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100 pl-4">
            <span className="text-slate-600">Downpayment</span>
            <span className="font-medium">{formatCurrency(calculations.downpayment)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100 pl-4">
            <span className="text-slate-600">Total Interest</span>
            <span className="font-medium text-danger-600">{formatCurrency(calculations.totalInterest)}</span>
          </div>

          <div className="flex justify-between py-3 bg-primary-50 px-4 -mx-4 mt-4 rounded-lg">
            <span className="font-semibold text-primary-800">Total Out of Pocket</span>
            <span className="font-bold text-primary-900 text-lg">{formatCurrency(calculations.totalOutOfPocket)}</span>
          </div>

          <div className="flex justify-between py-3 bg-slate-100 px-4 -mx-4 rounded-lg">
            <span className="font-semibold text-slate-700">Total Cost of Ownership</span>
            <span className="font-bold text-slate-900 text-lg">{formatCurrency(calculations.totalCostOfOwnership)}</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
