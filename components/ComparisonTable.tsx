'use client'

import { Property } from '@/lib/types'
import { formatCurrency, formatIndianNumber, formatPercentage } from '@/lib/calculations'
import { Card } from './ui'

interface ComparisonTableProps {
  properties: Property[]
}

interface MetricRow {
  label: string
  key: string
  getValue: (p: Property) => number | string
  format: (value: number | string) => string
  highlight?: 'lowest' | 'highest'
  category?: string
}

const metrics: MetricRow[] = [
  // Basic Info
  {
    label: 'Property Type',
    key: 'propertyType',
    getValue: (p) => p.propertyType,
    format: (v) => (v === 'builder' ? 'Under Construction' : 'Ready to Move'),
    category: 'Basic Info',
  },
  {
    label: 'Total Deal Value',
    key: 'totalDealValue',
    getValue: (p) => p.totalDealValue,
    format: (v) => formatCurrency(v as number),
    category: 'Basic Info',
  },
  {
    label: 'Black Component',
    key: 'blackComponent',
    getValue: (p) => p.blackComponent,
    format: (v) => formatCurrency(v as number),
    highlight: 'lowest',
    category: 'Basic Info',
  },
  {
    label: 'Agreement Value (White)',
    key: 'agreementValue',
    getValue: (p) => p.calculations.agreementValue,
    format: (v) => formatCurrency(v as number),
    category: 'Basic Info',
  },

  // Government Charges
  {
    label: 'GST',
    key: 'gst',
    getValue: (p) => p.calculations.gst,
    format: (v) => formatCurrency(v as number),
    highlight: 'lowest',
    category: 'Government Charges',
  },
  {
    label: 'Stamp Duty',
    key: 'stampDuty',
    getValue: (p) => p.calculations.stampDuty,
    format: (v) => formatCurrency(v as number),
    highlight: 'lowest',
    category: 'Government Charges',
  },
  {
    label: 'Registration Fee',
    key: 'registrationFee',
    getValue: (p) => p.calculations.registrationFee,
    format: (v) => formatCurrency(v as number),
    category: 'Government Charges',
  },
  {
    label: 'Total Govt Charges',
    key: 'totalGovtCharges',
    getValue: (p) => p.calculations.totalGovtCharges,
    format: (v) => formatCurrency(v as number),
    highlight: 'lowest',
    category: 'Government Charges',
  },

  // Loan Details
  {
    label: 'LTV Rate',
    key: 'ltvRate',
    getValue: (p) => p.calculations.ltvRate,
    format: (v) => formatPercentage(v as number),
    highlight: 'highest',
    category: 'Loan Details',
  },
  {
    label: 'Loan Amount',
    key: 'loanAmount',
    getValue: (p) => p.calculations.loanAmount,
    format: (v) => formatCurrency(v as number),
    highlight: 'highest',
    category: 'Loan Details',
  },
  {
    label: 'Downpayment',
    key: 'downpayment',
    getValue: (p) => p.calculations.downpayment,
    format: (v) => formatCurrency(v as number),
    highlight: 'lowest',
    category: 'Loan Details',
  },
  {
    label: 'Monthly EMI',
    key: 'emi',
    getValue: (p) => p.calculations.emi,
    format: (v) => formatCurrency(v as number),
    highlight: 'lowest',
    category: 'Loan Details',
  },
  {
    label: 'Total Interest',
    key: 'totalInterest',
    getValue: (p) => p.calculations.totalInterest,
    format: (v) => formatCurrency(v as number),
    highlight: 'lowest',
    category: 'Loan Details',
  },

  // Summary
  {
    label: 'Out of Pocket',
    key: 'totalOutOfPocket',
    getValue: (p) => p.calculations.totalOutOfPocket,
    format: (v) => formatCurrency(v as number),
    highlight: 'lowest',
    category: 'Summary',
  },
  {
    label: 'Total Cost of Ownership',
    key: 'totalCostOfOwnership',
    getValue: (p) => p.calculations.totalCostOfOwnership,
    format: (v) => formatCurrency(v as number),
    highlight: 'lowest',
    category: 'Summary',
  },
]

export function ComparisonTable({ properties }: ComparisonTableProps) {
  if (properties.length === 0) {
    return (
      <Card className="text-center py-12">
        <p className="text-slate-500">No properties selected for comparison.</p>
        <p className="text-sm text-slate-400 mt-1">
          Go back and select at least 2 properties to compare.
        </p>
      </Card>
    )
  }

  if (properties.length === 1) {
    return (
      <Card className="text-center py-12">
        <p className="text-slate-500">Select at least 2 properties to compare.</p>
      </Card>
    )
  }

  // Find best values for highlighting
  const getBestValue = (metric: MetricRow): number | null => {
    if (!metric.highlight) return null

    const values = properties.map((p) => {
      const val = metric.getValue(p)
      return typeof val === 'number' ? val : null
    }).filter((v): v is number => v !== null)

    if (values.length === 0) return null

    return metric.highlight === 'lowest' ? Math.min(...values) : Math.max(...values)
  }

  // Group metrics by category
  const categories = [...new Set(metrics.map((m) => m.category))]

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 sticky left-0 bg-slate-50 min-w-[140px] z-10">
                Metric
              </th>
              {properties.map((property) => (
                <th
                  key={property.id}
                  className="px-4 py-3 text-left text-sm font-semibold text-slate-900 min-w-[160px]"
                >
                  <div className="truncate max-w-[160px]" title={property.name}>
                    {property.name}
                  </div>
                  <div className="text-xs font-normal text-slate-500 mt-0.5">
                    {formatIndianNumber(property.totalDealValue)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <>
                {/* Category Header */}
                <tr key={`cat-${category}`} className="bg-slate-100">
                  <td
                    colSpan={properties.length + 1}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wide"
                  >
                    {category}
                  </td>
                </tr>

                {/* Metrics in this category */}
                {metrics
                  .filter((m) => m.category === category)
                  .map((metric) => {
                    const bestValue = getBestValue(metric)

                    return (
                      <tr key={metric.key} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm text-slate-600 sticky left-0 bg-white z-10">
                          {metric.label}
                        </td>
                        {properties.map((property) => {
                          const value = metric.getValue(property)
                          const numValue = typeof value === 'number' ? value : null
                          const isBest = bestValue !== null && numValue === bestValue

                          return (
                            <td
                              key={`${property.id}-${metric.key}`}
                              className={`px-4 py-3 text-sm font-medium ${isBest
                                  ? metric.highlight === 'lowest'
                                    ? 'text-success-600 bg-success-50'
                                    : 'text-primary-600 bg-primary-50'
                                  : 'text-slate-900'
                                }`}
                            >
                              <div className="flex items-center gap-2">
                                {metric.format(value)}
                                {isBest && (
                                  <span className="text-xs">
                                    {metric.highlight === 'lowest' ? '✓ Best' : '✓ Best'}
                                  </span>
                                )}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recommendation */}
      <div className="p-4 bg-primary-50 border-t border-primary-100">
        <h4 className="font-semibold text-primary-900 mb-2">Quick Comparison</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-primary-700 font-medium">Lowest Out of Pocket</p>
            <p className="text-primary-900">
              {properties.reduce((min, p) =>
                p.calculations.totalOutOfPocket < min.calculations.totalOutOfPocket ? p : min
              ).name}
            </p>
          </div>
          <div>
            <p className="text-primary-700 font-medium">Lowest EMI</p>
            <p className="text-primary-900">
              {properties.reduce((min, p) =>
                p.calculations.emi < min.calculations.emi ? p : min
              ).name}
            </p>
          </div>
          <div>
            <p className="text-primary-700 font-medium">Lowest Total Cost</p>
            <p className="text-primary-900">
              {properties.reduce((min, p) =>
                p.calculations.totalCostOfOwnership < min.calculations.totalCostOfOwnership ? p : min
              ).name}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
