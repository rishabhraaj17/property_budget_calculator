'use client'

import { useState, useEffect, useCallback } from 'react'
import { Property, PropertyInput, StateCharges } from '@/lib/types'
import {
  getStoredProperties,
  addProperty as addPropertyToStorage,
  updateProperty as updatePropertyInStorage,
  deleteProperty as deletePropertyFromStorage,
  exportPropertiesJson,
  importPropertiesJson,
  clearAllProperties,
} from '@/lib/storage'
import { calculatePropertyCosts } from '@/lib/calculations'

interface UsePropertiesOptions {
  useApi?: boolean // When true, uses API instead of localStorage
}

export function useProperties(options: UsePropertiesOptions = {}) {
  const { useApi = false } = options
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  // Load properties on mount
  useEffect(() => {
    loadProperties()
  }, [useApi])

  const loadProperties = async () => {
    try {
      setIsLoading(true)
      setError(null)

      if (useApi) {
        const res = await fetch('/api/properties')
        if (!res.ok) throw new Error('Failed to fetch properties')
        const data = await res.json()

        // Transform API response to match Property type
        const props: Property[] = (data.properties || []).map((p: Record<string, unknown>) => ({
          id: p.id as string,
          name: p.name as string,
          propertyType: p.propertyType as string,
          inputMode: p.inputMode as string,
          pricePerSqFt: p.pricePerSqFt as number | undefined,
          areaSqFt: p.areaSqFt as number | undefined,
          parkingCost: p.parkingCost as number | undefined,
          totalDealValue: p.totalDealValue as number,
          blackComponent: p.blackComponent as number,
          overrides: (p.overrides || {}) as PropertyInput['overrides'],
          stateCode: p.stateCode as string | undefined,
          calculations: (p.calculations || {}) as Property['calculations'],
          createdAt: new Date(p.createdAt as string).getTime(),
          updatedAt: new Date(p.updatedAt as string).getTime(),
        }))

        setProperties(props)
      } else {
        const stored = getStoredProperties()
        setProperties(stored)
      }
    } catch (err) {
      console.error('Error loading properties:', err)
      setError(err instanceof Error ? err.message : 'Failed to load properties')
      // Fallback to localStorage
      const stored = getStoredProperties()
      setProperties(stored)
    } finally {
      setIsLoading(false)
    }
  }

  // Add a new property
  const addProperty = useCallback(
    async (
      input: Omit<PropertyInput, 'id' | 'createdAt' | 'updatedAt'>,
      stateCharges?: StateCharges | null
    ) => {
      try {
        const mockInput: PropertyInput = {
          ...input,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        const calculations = calculatePropertyCosts(mockInput, stateCharges)

        if (useApi) {
          const res = await fetch('/api/properties', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...input,
              calculations,
            }),
          })

          if (!res.ok) throw new Error('Failed to add property')
          const data = await res.json()

          const property: Property = {
            id: data.property.id,
            name: data.property.name,
            propertyType: data.property.propertyType,
            inputMode: data.property.inputMode,
            pricePerSqFt: data.property.pricePerSqFt,
            areaSqFt: data.property.areaSqFt,
            parkingCost: data.property.parkingCost,
            totalDealValue: data.property.totalDealValue,
            blackComponent: data.property.blackComponent,
            overrides: data.property.overrides || {},
            stateCode: data.property.stateCode,
            calculations: data.property.calculations || calculations,
            createdAt: new Date(data.property.createdAt).getTime(),
            updatedAt: new Date(data.property.updatedAt).getTime(),
          }

          setProperties((prev) => [...prev, property])
          return property
        } else {
          const property = addPropertyToStorage(input, stateCharges)
          setProperties((prev) => [...prev, property])
          return property
        }
      } catch (err) {
        console.error('Error adding property:', err)
        setError(err instanceof Error ? err.message : 'Failed to add property')
        // Fallback to localStorage
        const property = addPropertyToStorage(input, stateCharges)
        setProperties((prev) => [...prev, property])
        return property
      }
    },
    [useApi]
  )

  // Update an existing property
  const updateProperty = useCallback(
    async (
      id: string,
      updates: Partial<PropertyInput>,
      stateCharges?: StateCharges | null
    ) => {
      try {
        const existing = properties.find((p) => p.id === id)
        if (!existing) return null

        const updatedInput: PropertyInput = {
          ...existing,
          ...updates,
          updatedAt: Date.now(),
        }
        const calculations = calculatePropertyCosts(updatedInput, stateCharges)

        if (useApi) {
          const res = await fetch(`/api/properties/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...updates,
              calculations,
            }),
          })

          if (!res.ok) throw new Error('Failed to update property')
          const data = await res.json()

          const updated: Property = {
            id: data.property.id,
            name: data.property.name,
            propertyType: data.property.propertyType,
            inputMode: data.property.inputMode,
            pricePerSqFt: data.property.pricePerSqFt,
            areaSqFt: data.property.areaSqFt,
            parkingCost: data.property.parkingCost,
            totalDealValue: data.property.totalDealValue,
            blackComponent: data.property.blackComponent,
            overrides: data.property.overrides || {},
            stateCode: data.property.stateCode,
            calculations: data.property.calculations || calculations,
            createdAt: new Date(data.property.createdAt).getTime(),
            updatedAt: new Date(data.property.updatedAt).getTime(),
          }

          setProperties((prev) => prev.map((p) => (p.id === id ? updated : p)))
          return updated
        } else {
          const updated = updatePropertyInStorage(id, updates, stateCharges)
          if (updated) {
            setProperties((prev) => prev.map((p) => (p.id === id ? updated : p)))
          }
          return updated
        }
      } catch (err) {
        console.error('Error updating property:', err)
        setError(err instanceof Error ? err.message : 'Failed to update property')
        // Fallback to localStorage
        const updated = updatePropertyInStorage(id, updates, stateCharges)
        if (updated) {
          setProperties((prev) => prev.map((p) => (p.id === id ? updated : p)))
        }
        return updated
      }
    },
    [useApi, properties]
  )

  // Delete a property
  const deleteProperty = useCallback(
    async (id: string) => {
      try {
        if (useApi) {
          const res = await fetch(`/api/properties/${id}`, {
            method: 'DELETE',
          })

          if (!res.ok) throw new Error('Failed to delete property')
        } else {
          deletePropertyFromStorage(id)
        }

        setProperties((prev) => prev.filter((p) => p.id !== id))
        setSelectedIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
        return true
      } catch (err) {
        console.error('Error deleting property:', err)
        setError(err instanceof Error ? err.message : 'Failed to delete property')
        // Still try to delete from localStorage
        deletePropertyFromStorage(id)
        setProperties((prev) => prev.filter((p) => p.id !== id))
        setSelectedIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
        return false
      }
    },
    [useApi]
  )

  // Get a single property by ID
  const getProperty = useCallback(
    (id: string) => {
      return properties.find((p) => p.id === id) || null
    },
    [properties]
  )

  // Toggle property selection for comparison
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  // Get selected properties
  const getSelectedProperties = useCallback(() => {
    return properties.filter((p) => selectedIds.has(p.id))
  }, [properties, selectedIds])

  // Export properties to JSON
  const exportProperties = useCallback(() => {
    // Always export current state, whether from API or localStorage
    return JSON.stringify(properties, null, 2)
  }, [properties])

  // Import properties from JSON
  const importProperties = useCallback(
    async (json: string) => {
      try {
        const imported = JSON.parse(json)
        if (!Array.isArray(imported)) {
          return { success: false, error: 'Invalid format', count: 0 }
        }

        if (useApi) {
          // Import each property via API
          let count = 0
          for (const prop of imported) {
            try {
              await fetch('/api/properties', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(prop),
              })
              count++
            } catch {
              // Continue with other properties
            }
          }
          await loadProperties()
          return { success: true, count }
        } else {
          const result = importPropertiesJson(json)
          if (result.success) {
            const stored = getStoredProperties()
            setProperties(stored)
          }
          return result
        }
      } catch (err) {
        return { success: false, error: 'Invalid JSON', count: 0 }
      }
    },
    [useApi]
  )

  // Clear all properties
  const clearAll = useCallback(async () => {
    if (useApi) {
      // Delete all via API
      for (const prop of properties) {
        try {
          await fetch(`/api/properties/${prop.id}`, { method: 'DELETE' })
        } catch {
          // Continue
        }
      }
    }
    clearAllProperties()
    setProperties([])
    setSelectedIds(new Set())
  }, [useApi, properties])

  // Preview calculations without saving
  const previewCalculations = useCallback(
    (
      input: Omit<PropertyInput, 'id' | 'createdAt' | 'updatedAt'>,
      stateCharges?: StateCharges | null
    ) => {
      const mockInput: PropertyInput = {
        ...input,
        id: 'preview',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      return calculatePropertyCosts(mockInput, stateCharges)
    },
    []
  )

  // Refresh properties from source
  const refresh = useCallback(() => {
    loadProperties()
  }, [useApi])

  return {
    properties,
    isLoading,
    error,
    selectedIds,
    addProperty,
    updateProperty,
    deleteProperty,
    getProperty,
    toggleSelection,
    clearSelection,
    getSelectedProperties,
    exportProperties,
    importProperties,
    clearAll,
    previewCalculations,
    refresh,
  }
}
