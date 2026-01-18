'use client'

import { useState, useEffect, useCallback } from 'react'
import { StateCharges, StateOption, PropertyType } from '@/lib/types'

interface UseStateChargesReturn {
  charges: StateCharges[]
  states: StateOption[]
  isLoading: boolean
  error: string | null
  getChargesForState: (stateCode: string, propertyType: PropertyType) => StateCharges | null
  saveCustomCharges: (charges: Partial<StateCharges>) => Promise<boolean>
  refetch: () => Promise<void>
}

export function useStateCharges(): UseStateChargesReturn {
  const [charges, setCharges] = useState<StateCharges[]>([])
  const [states, setStates] = useState<StateOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCharges = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const res = await fetch('/api/state-charges')
      if (!res.ok) {
        throw new Error('Failed to fetch state charges')
      }

      const data = await res.json()
      setCharges(data.charges || [])
      setStates(data.states || [])
    } catch (err) {
      console.error('Error fetching state charges:', err)
      setError(err instanceof Error ? err.message : 'Failed to load state charges')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCharges()
  }, [fetchCharges])

  const getChargesForState = useCallback(
    (stateCode: string, propertyType: PropertyType): StateCharges | null => {
      if (!stateCode) return null

      // First try to find exact match for property type
      let match = charges.find(
        (c) => c.stateCode === stateCode && (c.propertyType === propertyType || c.propertyType === 'all')
      )

      // If no match, try to find any entry for the state
      if (!match) {
        match = charges.find((c) => c.stateCode === stateCode)
      }

      return match || null
    },
    [charges]
  )

  const saveCustomCharges = useCallback(async (chargesData: Partial<StateCharges>): Promise<boolean> => {
    try {
      const res = await fetch('/api/state-charges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chargesData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save charges')
      }

      // Refetch to get updated data
      await fetchCharges()
      return true
    } catch (err) {
      console.error('Error saving custom charges:', err)
      setError(err instanceof Error ? err.message : 'Failed to save charges')
      return false
    }
  }, [fetchCharges])

  return {
    charges,
    states,
    isLoading,
    error,
    getChargesForState,
    saveCustomCharges,
    refetch: fetchCharges,
  }
}
