import { Property, PropertyInput, StateCharges } from './types'
import { calculatePropertyCosts } from './calculations'

const STORAGE_KEY = 'property_calculator_properties'

/**
 * Get all saved properties from localStorage
 */
export function getStoredProperties(): Property[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return []
    }

    const properties: PropertyInput[] = JSON.parse(stored)
    // Recalculate all properties to ensure calculations are up-to-date
    return properties.map((input) => ({
      ...input,
      calculations: calculatePropertyCosts(input),
    }))
  } catch (error) {
    console.error('Error reading from localStorage:', error)
    return []
  }
}

/**
 * Save all properties to localStorage
 */
export function saveProperties(properties: Property[]): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    // Store only the input data, not calculations
    const inputData: PropertyInput[] = properties.map(({ calculations, ...input }) => input)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inputData))
  } catch (error) {
    console.error('Error saving to localStorage:', error)
  }
}

/**
 * Add a new property
 */
export function addProperty(
  input: Omit<PropertyInput, 'id' | 'createdAt' | 'updatedAt'>,
  stateCharges?: StateCharges | null
): Property {
  const now = Date.now()
  const newProperty: PropertyInput = {
    ...input,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }

  const calculations = calculatePropertyCosts(newProperty, stateCharges)
  const property: Property = { ...newProperty, calculations }

  const existing = getStoredProperties()
  saveProperties([...existing, property])

  return property
}

/**
 * Update an existing property
 */
export function updateProperty(
  id: string,
  updates: Partial<PropertyInput>,
  stateCharges?: StateCharges | null
): Property | null {
  const properties = getStoredProperties()
  const index = properties.findIndex((p) => p.id === id)

  if (index === -1) {
    return null
  }

  const updated: PropertyInput = {
    ...properties[index],
    ...updates,
    updatedAt: Date.now(),
  }

  const calculations = calculatePropertyCosts(updated, stateCharges)
  const property: Property = { ...updated, calculations }

  properties[index] = property
  saveProperties(properties)

  return property
}

/**
 * Delete a property
 */
export function deleteProperty(id: string): boolean {
  const properties = getStoredProperties()
  const filtered = properties.filter((p) => p.id !== id)

  if (filtered.length === properties.length) {
    return false
  }

  saveProperties(filtered)
  return true
}

/**
 * Get a single property by ID
 */
export function getProperty(id: string): Property | null {
  const properties = getStoredProperties()
  return properties.find((p) => p.id === id) || null
}

/**
 * Export properties as JSON string
 */
export function exportPropertiesJson(): string {
  const properties = getStoredProperties()
  return JSON.stringify(properties, null, 2)
}

/**
 * Import properties from JSON string
 */
export function importPropertiesJson(json: string): { success: boolean; count: number; error?: string } {
  try {
    const imported = JSON.parse(json)

    if (!Array.isArray(imported)) {
      return { success: false, count: 0, error: 'Invalid format: expected an array' }
    }

    // Validate and process each property
    const validProperties: Property[] = []
    for (const item of imported) {
      if (!item.name || !item.propertyType || !item.totalDealValue) {
        continue
      }

      const input: PropertyInput = {
        id: item.id || generateId(),
        name: item.name,
        propertyType: item.propertyType,
        inputMode: item.inputMode || 'direct',
        pricePerSqFt: item.pricePerSqFt,
        areaSqFt: item.areaSqFt,
        parkingCost: item.parkingCost,
        totalDealValue: item.totalDealValue,
        blackComponent: item.blackComponent || 0,
        overrides: item.overrides || {},
        stateCode: item.stateCode,
        createdAt: item.createdAt || Date.now(),
        updatedAt: Date.now(),
      }

      validProperties.push({
        ...input,
        calculations: calculatePropertyCosts(input),
      })
    }

    if (validProperties.length === 0) {
      return { success: false, count: 0, error: 'No valid properties found in the file' }
    }

    // Merge with existing or replace
    const existing = getStoredProperties()
    const existingIds = new Set(existing.map((p) => p.id))
    const newProperties = validProperties.filter((p) => !existingIds.has(p.id))
    const mergedProperties = [...existing, ...newProperties]

    saveProperties(mergedProperties)

    return { success: true, count: newProperties.length }
  } catch (error) {
    return { success: false, count: 0, error: 'Failed to parse JSON file' }
  }
}

/**
 * Clear all stored properties
 */
export function clearAllProperties(): void {
  if (typeof window === 'undefined') {
    return
  }
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `prop_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}
