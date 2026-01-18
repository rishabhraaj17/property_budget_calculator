'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useProperties } from '@/hooks/useProperties'
import { useStateCharges } from '@/hooks/useStateCharges'
import { useAuth } from '@/contexts/AuthContext'
import { PropertyForm, PropertyCard, CostBreakdown, LoanCalculator, Button, Card } from '@/components'
import { Property, PropertyInput, StateCharges } from '@/lib/types'

type ViewMode = 'list' | 'add' | 'edit' | 'details'

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const {
    properties,
    isLoading,
    selectedIds,
    addProperty,
    updateProperty,
    deleteProperty,
    toggleSelection,
    clearSelection,
    previewCalculations,
    exportProperties,
    importProperties,
    refresh,
  } = useProperties({ useApi: isAuthenticated })

  const {
    charges: stateCharges,
    states: stateOptions,
    getChargesForState,
    isLoading: chargesLoading,
  } = useStateCharges()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [viewingProperty, setViewingProperty] = useState<Property | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  // Refresh properties when auth state changes
  useEffect(() => {
    refresh()
  }, [isAuthenticated])

  // Handle add property
  const handleAddProperty = useCallback(
    async (data: Omit<PropertyInput, 'id' | 'createdAt' | 'updatedAt'>, stateChargesData?: StateCharges | null) => {
      await addProperty(data, stateChargesData)
      setViewMode('list')
    },
    [addProperty]
  )

  // Handle edit property
  const handleEditProperty = useCallback(
    async (data: Omit<PropertyInput, 'id' | 'createdAt' | 'updatedAt'>, stateChargesData?: StateCharges | null) => {
      if (editingProperty) {
        await updateProperty(editingProperty.id, data, stateChargesData)
        setEditingProperty(null)
        setViewMode('list')
      }
    },
    [editingProperty, updateProperty]
  )

  // Handle delete property
  const handleDeleteProperty = useCallback(
    async (id: string) => {
      await deleteProperty(id)
      setShowDeleteConfirm(null)
      if (viewingProperty?.id === id) {
        setViewingProperty(null)
        setViewMode('list')
      }
    },
    [deleteProperty, viewingProperty]
  )

  // Handle export
  const handleExport = useCallback(() => {
    const json = exportProperties()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `properties-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [exportProperties])

  // Handle import
  const handleImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = async (event) => {
        const json = event.target?.result as string
        const result = await importProperties(json)
        if (result.success) {
          alert(`Successfully imported ${result.count} properties`)
        } else {
          alert(`Import failed: ${result.error}`)
        }
      }
      reader.readAsText(file)
      e.target.value = ''
    },
    [importProperties]
  )

  // Navigate to comparison
  const handleCompare = useCallback(() => {
    if (selectedIds.size >= 2) {
      // Store selected IDs in sessionStorage for the compare page
      sessionStorage.setItem('compareIds', JSON.stringify([...selectedIds]))
      router.push('/compare')
    }
  }, [selectedIds, router])

  // Handle state change in form
  const handleStateChange = useCallback(
    (stateCode: string, propertyType: 'builder' | 'resale') => {
      return getChargesForState(stateCode, propertyType)
    },
    [getChargesForState]
  )

  if (isLoading || chargesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  // Details View
  if (viewMode === 'details' && viewingProperty) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => {
                setViewingProperty(null)
                setViewMode('list')
              }}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 mb-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Properties
            </button>
            <h2 className="text-2xl font-bold text-slate-900">{viewingProperty.name}</h2>
            <p className="text-slate-500">
              {viewingProperty.propertyType === 'builder' ? 'Under Construction' : 'Ready to Move'}
              {viewingProperty.stateCode && ` | ${viewingProperty.stateCode}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setEditingProperty(viewingProperty)
                setViewMode('edit')
              }}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              onClick={() => setShowDeleteConfirm(viewingProperty.id)}
            >
              Delete
            </Button>
          </div>
        </div>

        <CostBreakdown
          calculations={viewingProperty.calculations}
          propertyType={viewingProperty.propertyType}
        />

        <LoanCalculator
          calculations={viewingProperty.calculations}
          interestRate={viewingProperty.overrides.interestRate}
          tenureYears={viewingProperty.overrides.tenureYears}
        />
      </div>
    )
  }

  // Add/Edit Form View
  if (viewMode === 'add' || viewMode === 'edit') {
    return (
      <div className="max-w-2xl mx-auto animate-slide-up">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">
          {viewMode === 'add' ? 'Add New Property' : 'Edit Property'}
        </h2>
        <Card>
          <PropertyForm
            initialData={editingProperty || undefined}
            onSubmit={viewMode === 'add' ? handleAddProperty : handleEditProperty}
            onCancel={() => {
              setEditingProperty(null)
              setViewMode('list')
            }}
            onPreview={previewCalculations}
            isEditing={viewMode === 'edit'}
            stateCharges={stateCharges}
            stateOptions={stateOptions}
            onStateChange={handleStateChange}
          />
        </Card>
      </div>
    )
  }

  // List View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Your Properties</h2>
          <p className="text-slate-500">
            {properties.length === 0
              ? 'Add your first property to get started'
              : `${properties.length} ${properties.length === 1 ? 'property' : 'properties'} saved`}
            {!isAuthenticated && properties.length > 0 && (
              <span className="text-xs text-amber-600 ml-2">(stored locally)</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {properties.length > 0 && (
            <>
              <Button variant="secondary" size="sm" onClick={handleExport}>
                Export
              </Button>
              <label className="btn-secondary px-4 py-2.5 text-sm cursor-pointer inline-flex items-center">
                Import
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </>
          )}
          <Button onClick={() => setViewMode('add')}>
            <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Property
          </Button>
        </div>
      </div>

      {/* Selection Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg border border-primary-200 animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="text-primary-700 font-medium">
              {selectedIds.size} {selectedIds.size === 1 ? 'property' : 'properties'} selected
            </span>
            <button
              onClick={clearSelection}
              className="text-sm text-primary-600 hover:text-primary-700 underline"
            >
              Clear selection
            </button>
          </div>
          <Button
            onClick={handleCompare}
            disabled={selectedIds.size < 2}
            size="sm"
          >
            Compare Selected
          </Button>
        </div>
      )}

      {/* Empty State */}
      {properties.length === 0 && (
        <Card className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No properties yet</h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            Add your first property to analyze costs, calculate EMIs, and compare investment options.
          </p>
          <Button onClick={() => setViewMode('add')}>
            Add Your First Property
          </Button>
        </Card>
      )}

      {/* Property Grid */}
      {properties.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              isSelected={selectedIds.has(property.id)}
              onSelect={() => toggleSelection(property.id)}
              onEdit={() => {
                setEditingProperty(property)
                setViewMode('edit')
              }}
              onDelete={() => setShowDeleteConfirm(property.id)}
              onViewDetails={() => {
                setViewingProperty(property)
                setViewMode('details')
              }}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <Card className="max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Property?</h3>
            <p className="text-slate-600 mb-6">
              This action cannot be undone. The property and all its calculations will be permanently removed.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDeleteProperty(showDeleteConfirm)}
                className="flex-1"
              >
                Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
