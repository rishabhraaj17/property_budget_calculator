'use client'

import { Property } from '@/lib/types'
import { formatCurrency, formatIndianNumber, formatPercentage } from '@/lib/calculations'
import { Card, Button } from './ui'

interface PropertyCardProps {
  property: Property
  isSelected?: boolean
  onSelect?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onViewDetails?: () => void
}

export function PropertyCard({
  property,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  onViewDetails,
}: PropertyCardProps) {
  const { calculations } = property

  return (
    <Card
      hover
      padding="none"
      className={`overflow-hidden transition-all ${
        isSelected ? 'ring-2 ring-primary-500 border-primary-500' : ''
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {onSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={onSelect}
                className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
            )}
            <h3 className="font-semibold text-slate-900 truncate">{property.name}</h3>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                property.propertyType === 'builder'
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-success-100 text-success-700'
              }`}
            >
              {property.propertyType === 'builder' ? 'Under Construction' : 'Ready to Move'}
            </span>
            {property.blackComponent > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-white font-medium">
                Has Black
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500">Total Value</p>
            <p className="font-semibold text-slate-900">{formatIndianNumber(property.totalDealValue)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Agreement (White)</p>
            <p className="font-semibold text-slate-900">{formatIndianNumber(calculations.agreementValue)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500">Out of Pocket</p>
            <p className="font-semibold text-primary-600">{formatIndianNumber(calculations.totalOutOfPocket)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Loan Amount</p>
            <p className="font-semibold text-slate-900">{formatIndianNumber(calculations.loanAmount)}</p>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-500">Monthly EMI</p>
              <p className="font-bold text-lg text-danger-600">{formatCurrency(calculations.emi)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">LTV</p>
              <p className="font-medium text-slate-700">{formatPercentage(calculations.ltvRate)}</p>
            </div>
          </div>
        </div>

        {/* Per SqFt (if available) */}
        {calculations.costPerSqFt && property.areaSqFt && (
          <div className="pt-2 border-t border-slate-100">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">{property.areaSqFt} sqft @ {formatCurrency(calculations.costPerSqFt)}/sqft</span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex gap-2">
        {onViewDetails && (
          <Button variant="secondary" size="sm" onClick={onViewDetails} className="flex-1">
            View Details
          </Button>
        )}
        {onEdit && (
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </Button>
        )}
        {onDelete && (
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <svg className="w-4 h-4 text-danger-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </Button>
        )}
      </div>
    </Card>
  )
}
