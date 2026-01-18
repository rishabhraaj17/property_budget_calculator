'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useProperties } from '@/hooks/useProperties'
import { ComparisonTable, Button, Card } from '@/components'
import { Property } from '@/lib/types'

export default function ComparePage() {
  const { properties, isLoading } = useProperties()
  const [selectedProperties, setSelectedProperties] = useState<Property[]>([])
  const [availableProperties, setAvailableProperties] = useState<Property[]>([])

  // Load selected properties from sessionStorage
  useEffect(() => {
    if (isLoading) return

    const stored = sessionStorage.getItem('compareIds')
    if (stored) {
      try {
        const ids: string[] = JSON.parse(stored)
        const selected = properties.filter((p) => ids.includes(p.id))
        setSelectedProperties(selected)
      } catch {
        // Invalid data, ignore
      }
    }

    setAvailableProperties(properties)
  }, [properties, isLoading])

  // Add property to comparison
  const addToComparison = (property: Property) => {
    if (selectedProperties.length >= 4) {
      alert('You can compare up to 4 properties at a time')
      return
    }
    if (!selectedProperties.find((p) => p.id === property.id)) {
      const newSelected = [...selectedProperties, property]
      setSelectedProperties(newSelected)
      sessionStorage.setItem('compareIds', JSON.stringify(newSelected.map((p) => p.id)))
    }
  }

  // Remove property from comparison
  const removeFromComparison = (propertyId: string) => {
    const newSelected = selectedProperties.filter((p) => p.id !== propertyId)
    setSelectedProperties(newSelected)
    sessionStorage.setItem('compareIds', JSON.stringify(newSelected.map((p) => p.id)))
  }

  // Clear all selections
  const clearComparison = () => {
    setSelectedProperties([])
    sessionStorage.removeItem('compareIds')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/"
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 mb-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Properties
          </Link>
          <h2 className="text-2xl font-bold text-slate-900">Compare Properties</h2>
          <p className="text-slate-500">
            {selectedProperties.length === 0
              ? 'Select properties to compare'
              : `Comparing ${selectedProperties.length} ${selectedProperties.length === 1 ? 'property' : 'properties'}`}
          </p>
        </div>
        {selectedProperties.length > 0 && (
          <Button variant="secondary" size="sm" onClick={clearComparison}>
            Clear All
          </Button>
        )}
      </div>

      {/* No properties state */}
      {availableProperties.length === 0 && (
        <Card className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No properties to compare</h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            Add some properties first, then come back here to compare them side by side.
          </p>
          <Link href="/">
            <Button>Go to Properties</Button>
          </Link>
        </Card>
      )}

      {/* Property Selection */}
      {availableProperties.length > 0 && (
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Select Properties to Compare</h3>
          <div className="flex flex-wrap gap-2">
            {availableProperties.map((property) => {
              const isSelected = selectedProperties.some((p) => p.id === property.id)
              return (
                <button
                  key={property.id}
                  onClick={() =>
                    isSelected ? removeFromComparison(property.id) : addToComparison(property)
                  }
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${isSelected
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }
                  `}
                >
                  {property.name}
                  {isSelected && (
                    <svg className="w-4 h-4 inline ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Select 2-4 properties to compare. Click a selected property to remove it.
          </p>
        </Card>
      )}

      {/* Comparison Table */}
      {selectedProperties.length >= 2 && (
        <div className="animate-fade-in">
          <ComparisonTable properties={selectedProperties} />
        </div>
      )}

      {/* Not enough properties selected */}
      {availableProperties.length > 0 && selectedProperties.length < 2 && (
        <Card className="text-center py-8 bg-slate-50">
          <p className="text-slate-600">
            {selectedProperties.length === 0
              ? 'Select at least 2 properties above to start comparing'
              : 'Select one more property to start comparing'}
          </p>
        </Card>
      )}
    </div>
  )
}
