'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button, Input, Select, Toggle, Card, Tooltip, AutoBadge } from './ui'
import { PropertyInput, PropertyType, InputMode, CalculationResult, StateCharges } from '@/lib/types'
import { PROPERTY_TYPES, INPUT_MODES, DEFAULTS, TOOLTIPS, INDIAN_STATES } from '@/lib/constants'
import { formatCurrency, formatPercentage } from '@/lib/calculations'

interface PropertyFormProps {
  initialData?: Partial<PropertyInput>
  onSubmit: (data: Omit<PropertyInput, 'id' | 'createdAt' | 'updatedAt'>, stateCharges?: StateCharges | null) => void
  onCancel: () => void
  onPreview?: (data: Omit<PropertyInput, 'id' | 'createdAt' | 'updatedAt'>, stateCharges?: StateCharges | null) => CalculationResult
  isEditing?: boolean
  stateCharges?: StateCharges[]
  stateOptions?: { stateCode: string; stateName: string }[]
  onStateChange?: (stateCode: string, propertyType: PropertyType) => StateCharges | null
}

export function PropertyForm({
  initialData,
  onSubmit,
  onCancel,
  onPreview,
  isEditing = false,
  stateCharges = [],
  stateOptions = INDIAN_STATES.map(s => ({ stateCode: s.code, stateName: s.name })),
  onStateChange,
}: PropertyFormProps) {
  // Form state
  const [name, setName] = useState(initialData?.name || '')
  const [propertyType, setPropertyType] = useState<PropertyType>(
    initialData?.propertyType || 'builder'
  )
  const [inputMode, setInputMode] = useState<InputMode>(
    initialData?.inputMode || 'direct'
  )
  const [stateCode, setStateCode] = useState(initialData?.stateCode || '')
  const [selectedStateCharges, setSelectedStateCharges] = useState<StateCharges | null>(null)

  // Calculated mode fields
  const [pricePerSqFt, setPricePerSqFt] = useState(
    initialData?.pricePerSqFt?.toString() || ''
  )
  const [areaSqFt, setAreaSqFt] = useState(
    initialData?.areaSqFt?.toString() || ''
  )
  const [parkingCost, setParkingCost] = useState(
    initialData?.parkingCost?.toString() || '0'
  )

  // Direct mode / final value
  const [totalDealValue, setTotalDealValue] = useState(
    initialData?.totalDealValue?.toString() || ''
  )
  const [blackComponent, setBlackComponent] = useState(
    initialData?.blackComponent?.toString() || '0'
  )

  // Advanced overrides
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [gstRate, setGstRate] = useState(
    initialData?.overrides?.gstRate !== undefined
      ? (initialData.overrides.gstRate * 100).toString()
      : ''
  )
  const [stampDutyRate, setStampDutyRate] = useState(
    initialData?.overrides?.stampDutyRate !== undefined
      ? (initialData.overrides.stampDutyRate * 100).toString()
      : ''
  )
  const [registrationFee, setRegistrationFee] = useState(
    initialData?.overrides?.registrationFee?.toString() || ''
  )
  const [ltvRate, setLtvRate] = useState(
    initialData?.overrides?.ltvRate !== undefined
      ? (initialData.overrides.ltvRate * 100).toString()
      : ''
  )
  const [interestRate, setInterestRate] = useState(
    initialData?.overrides?.interestRate !== undefined
      ? (initialData.overrides.interestRate * 100).toString()
      : ''
  )
  const [tenureYears, setTenureYears] = useState(
    initialData?.overrides?.tenureYears?.toString() || ''
  )

  // Preview state
  const [preview, setPreview] = useState<CalculationResult | null>(null)

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Update state charges when state or property type changes
  useEffect(() => {
    if (stateCode && onStateChange) {
      const charges = onStateChange(stateCode, propertyType)
      setSelectedStateCharges(charges)
    } else if (stateCode && stateCharges.length > 0) {
      const charges = stateCharges.find(
        c => c.stateCode === stateCode && (c.propertyType === propertyType || c.propertyType === 'all')
      ) || null
      setSelectedStateCharges(charges)
    } else {
      setSelectedStateCharges(null)
    }
  }, [stateCode, propertyType, stateCharges, onStateChange])

  // Calculate total from price/sqft when in calculated mode
  useEffect(() => {
    if (inputMode === 'calculated') {
      const price = parseFloat(pricePerSqFt) || 0
      const area = parseFloat(areaSqFt) || 0
      const parking = parseFloat(parkingCost) || 0
      const total = price * area + parking
      if (total > 0) {
        setTotalDealValue(total.toString())
      }
    }
  }, [inputMode, pricePerSqFt, areaSqFt, parkingCost])

  // Build form data for submission/preview
  const buildFormData = useCallback((): Omit<PropertyInput, 'id' | 'createdAt' | 'updatedAt'> => {
    const overrides: PropertyInput['overrides'] = {}

    if (gstRate) overrides.gstRate = parseFloat(gstRate) / 100
    if (stampDutyRate) overrides.stampDutyRate = parseFloat(stampDutyRate) / 100
    if (registrationFee) overrides.registrationFee = parseFloat(registrationFee)
    if (ltvRate) overrides.ltvRate = parseFloat(ltvRate) / 100
    if (interestRate) overrides.interestRate = parseFloat(interestRate) / 100
    if (tenureYears) overrides.tenureYears = parseInt(tenureYears)

    return {
      name: name.trim(),
      propertyType,
      inputMode,
      pricePerSqFt: inputMode === 'calculated' ? parseFloat(pricePerSqFt) || undefined : undefined,
      areaSqFt: inputMode === 'calculated' ? parseFloat(areaSqFt) || undefined : undefined,
      parkingCost: inputMode === 'calculated' ? parseFloat(parkingCost) || 0 : undefined,
      totalDealValue: parseFloat(totalDealValue) || 0,
      blackComponent: parseFloat(blackComponent) || 0,
      overrides,
      stateCode: stateCode || undefined,
    }
  }, [
    name, propertyType, inputMode, pricePerSqFt, areaSqFt, parkingCost,
    totalDealValue, blackComponent, gstRate, stampDutyRate, registrationFee,
    ltvRate, interestRate, tenureYears, stateCode,
  ])

  // Update preview when form changes
  useEffect(() => {
    if (onPreview && totalDealValue) {
      const data = buildFormData()
      if (data.totalDealValue > 0) {
        const result = onPreview(data, selectedStateCharges)
        setPreview(result)
      } else {
        setPreview(null)
      }
    }
  }, [buildFormData, onPreview, totalDealValue, selectedStateCharges])

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = 'Property name is required'
    }

    if (inputMode === 'calculated') {
      if (!pricePerSqFt || parseFloat(pricePerSqFt) <= 0) {
        newErrors.pricePerSqFt = 'Price per SqFt is required'
      }
      if (!areaSqFt || parseFloat(areaSqFt) <= 0) {
        newErrors.areaSqFt = 'Area is required'
      }
    } else {
      if (!totalDealValue || parseFloat(totalDealValue) <= 0) {
        newErrors.totalDealValue = 'Total deal value is required'
      }
    }

    const total = parseFloat(totalDealValue) || 0
    const black = parseFloat(blackComponent) || 0
    if (black > total) {
      newErrors.blackComponent = 'Black component cannot exceed total value'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSubmit(buildFormData(), selectedStateCharges)
    }
  }

  // Get effective rates for display
  const getEffectiveRates = () => {
    if (!selectedStateCharges) return null
    return {
      stampDuty: selectedStateCharges.stampDutyRate,
      gst: propertyType === 'builder'
        ? (selectedStateCharges.gstRateStandard || DEFAULTS.GST_RATE_STANDARD)
        : 0,
      registration: selectedStateCharges.registrationFee ||
        (selectedStateCharges.otherCharges
          ? `${(selectedStateCharges.otherCharges * 100).toFixed(1)}% of value`
          : formatCurrency(DEFAULTS.REGISTRATION_FEE)),
    }
  }

  const effectiveRates = getEffectiveRates()

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Property Name */}
      <Input
        label="Property Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g., Green Valley Apartment 3BHK"
        error={errors.name}
      />

      {/* Property Type with Tooltip */}
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <label className="block text-sm font-medium text-slate-700">Property Type</label>
          <Tooltip content={TOOLTIPS.gst} position="right">
            <span />
          </Tooltip>
        </div>
        <Select
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value as PropertyType)}
          options={PROPERTY_TYPES}
        />
        <p className="text-xs text-slate-500">
          {propertyType === 'builder'
            ? 'GST applies to under-construction properties'
            : 'No GST on ready-to-move/resale properties'}
        </p>
      </div>

      {/* State Selection */}
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <label className="block text-sm font-medium text-slate-700">Property Location (State)</label>
          <Tooltip content={TOOLTIPS.stampDuty} position="right">
            <span />
          </Tooltip>
        </div>
        <Select
          value={stateCode}
          onChange={(e) => setStateCode(e.target.value)}
          options={[
            { value: '', label: 'Select state for auto-filled charges (optional)' },
            ...stateOptions.map(s => ({ value: s.stateCode, label: s.stateName })),
          ]}
        />
        {selectedStateCharges && (
          <div className="mt-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <p className="text-xs font-medium text-emerald-800 mb-2">
              Auto-filled rates for {selectedStateCharges.stateName}:
            </p>
            <div className="flex flex-wrap gap-2">
              <AutoBadge
                label="Stamp Duty"
                value={formatPercentage(selectedStateCharges.stampDutyRate)}
              />
              {propertyType === 'builder' && selectedStateCharges.gstRateStandard && (
                <AutoBadge
                  label="GST"
                  value={formatPercentage(selectedStateCharges.gstRateStandard)}
                />
              )}
              {selectedStateCharges.otherCharges && (
                <AutoBadge
                  label="Registration"
                  value={formatPercentage(selectedStateCharges.otherCharges)}
                />
              )}
            </div>
            {selectedStateCharges.notes && (
              <p className="text-xs text-emerald-700 mt-2 italic">{selectedStateCharges.notes}</p>
            )}
          </div>
        )}
      </div>

      {/* Input Mode Toggle */}
      <Toggle
        label="How would you like to enter the price?"
        options={INPUT_MODES}
        value={inputMode}
        onChange={(v) => setInputMode(v as InputMode)}
      />

      {/* Calculated Mode Fields */}
      {inputMode === 'calculated' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
          <div>
            <div className="flex items-center gap-1 mb-1">
              <label className="text-sm font-medium text-slate-700">Price per SqFt</label>
              <Tooltip content={TOOLTIPS.costPerSqFt} position="top">
                <span />
              </Tooltip>
            </div>
            <Input
              type="number"
              value={pricePerSqFt}
              onChange={(e) => setPricePerSqFt(e.target.value)}
              prefix="₹"
              placeholder="12000"
              error={errors.pricePerSqFt}
            />
          </div>
          <Input
            label="Area (SqFt)"
            type="number"
            value={areaSqFt}
            onChange={(e) => setAreaSqFt(e.target.value)}
            suffix="sqft"
            placeholder="1200"
            error={errors.areaSqFt}
          />
          <Input
            label="Parking Cost"
            type="number"
            value={parkingCost}
            onChange={(e) => setParkingCost(e.target.value)}
            prefix="₹"
            placeholder="500000"
          />
        </div>
      )}

      {/* Total Deal Value */}
      <Input
        label={inputMode === 'calculated' ? 'Calculated Total Value' : 'Total Deal Value'}
        type="number"
        value={totalDealValue}
        onChange={(e) => setTotalDealValue(e.target.value)}
        prefix="₹"
        placeholder="6666000"
        disabled={inputMode === 'calculated'}
        error={errors.totalDealValue}
      />

      {/* Black Component with Tooltip */}
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <label className="block text-sm font-medium text-slate-700">Black Component (Cash)</label>
          <Tooltip content={TOOLTIPS.blackComponent} position="right">
            <span />
          </Tooltip>
        </div>
        <Input
          type="number"
          value={blackComponent}
          onChange={(e) => setBlackComponent(e.target.value)}
          prefix="₹"
          placeholder="1000000"
          error={errors.blackComponent}
        />
      </div>

      {/* White Component Preview with Tooltip */}
      {totalDealValue && (
        <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-primary-700">Agreement Value (White)</span>
              <Tooltip content={TOOLTIPS.agreementValue} position="right">
                <span />
              </Tooltip>
            </div>
            <span className="text-lg font-semibold text-primary-900">
              {formatCurrency((parseFloat(totalDealValue) || 0) - (parseFloat(blackComponent) || 0))}
            </span>
          </div>
        </div>
      )}

      {/* Advanced Overrides */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
        >
          <span className="text-sm font-medium text-slate-700">Advanced Overrides</span>
          <svg
            className={`w-5 h-5 text-slate-500 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showAdvanced && (
          <div className="p-4 space-y-4 border-t border-slate-200">
            <p className="text-xs text-slate-500 mb-4">
              Leave blank to use {stateCode ? 'state-specific' : 'default'} values. These override the automatic calculations.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {propertyType === 'builder' && (
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <label className="text-sm font-medium text-slate-700">
                      GST Rate
                      {effectiveRates && ` (auto: ${formatPercentage(effectiveRates.gst)})`}
                    </label>
                    <Tooltip content={TOOLTIPS.gst} position="top">
                      <span />
                    </Tooltip>
                  </div>
                  <Input
                    type="number"
                    value={gstRate}
                    onChange={(e) => setGstRate(e.target.value)}
                    suffix="%"
                    placeholder={effectiveRates ? (effectiveRates.gst * 100).toString() : '5'}
                    step="0.1"
                  />
                </div>
              )}

              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label className="text-sm font-medium text-slate-700">
                    Stamp Duty Rate
                    {effectiveRates && ` (auto: ${formatPercentage(effectiveRates.stampDuty)})`}
                  </label>
                  <Tooltip content={TOOLTIPS.stampDuty} position="top">
                    <span />
                  </Tooltip>
                </div>
                <Input
                  type="number"
                  value={stampDutyRate}
                  onChange={(e) => setStampDutyRate(e.target.value)}
                  suffix="%"
                  placeholder={effectiveRates ? (effectiveRates.stampDuty * 100).toString() : '10'}
                  step="0.1"
                />
              </div>

              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label className="text-sm font-medium text-slate-700">Registration Fee</label>
                  <Tooltip content={TOOLTIPS.registrationFee} position="top">
                    <span />
                  </Tooltip>
                </div>
                <Input
                  type="number"
                  value={registrationFee}
                  onChange={(e) => setRegistrationFee(e.target.value)}
                  prefix="₹"
                  placeholder={typeof effectiveRates?.registration === 'string'
                    ? effectiveRates.registration
                    : '30000'}
                />
              </div>

              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label className="text-sm font-medium text-slate-700">LTV Rate Override</label>
                  <Tooltip content={TOOLTIPS.ltv} position="top">
                    <span />
                  </Tooltip>
                </div>
                <Input
                  type="number"
                  value={ltvRate}
                  onChange={(e) => setLtvRate(e.target.value)}
                  suffix="%"
                  placeholder="Auto based on value"
                  step="1"
                />
              </div>

              <Input
                label={`Interest Rate (default: ${formatPercentage(DEFAULTS.INTEREST_RATE)})`}
                type="number"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                suffix="%"
                placeholder="8.5"
                step="0.1"
              />

              <Input
                label={`Tenure (default: ${DEFAULTS.TENURE_YEARS} years)`}
                type="number"
                value={tenureYears}
                onChange={(e) => setTenureYears(e.target.value)}
                suffix="years"
                placeholder="20"
              />
            </div>
          </div>
        )}
      </div>

      {/* Live Preview with Auto-Selected Indicators */}
      {preview && (
        <Card className="bg-slate-50">
          <h4 className="font-semibold text-slate-900 mb-3">Live Preview</h4>

          {/* Auto-selected values display */}
          {preview.autoSelected && (
            <div className="mb-4 flex flex-wrap gap-2">
              {preview.autoSelected.ltvRate && (
                <AutoBadge label="LTV" value={preview.ltvTier} />
              )}
              {preview.autoSelected.gstRate && propertyType === 'builder' && (
                <AutoBadge label="GST" value={formatPercentage(preview.gstRate)} />
              )}
              {preview.autoSelected.stampDutyRate && (
                <AutoBadge label="Stamp Duty" value={formatPercentage(preview.stampDutyRate)} />
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Govt Charges</p>
              <p className="font-semibold text-slate-900">{formatCurrency(preview.totalGovtCharges)}</p>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <p className="text-slate-500">Loan Amount</p>
                <Tooltip content={TOOLTIPS.ltv} position="top">
                  <span />
                </Tooltip>
              </div>
              <p className="font-semibold text-slate-900">{formatCurrency(preview.loanAmount)}</p>
              <p className="text-xs text-slate-400">({formatPercentage(preview.ltvRate)} LTV)</p>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <p className="text-slate-500">Out of Pocket</p>
                <Tooltip content={TOOLTIPS.totalOutOfPocket} position="top">
                  <span />
                </Tooltip>
              </div>
              <p className="font-semibold text-primary-600">{formatCurrency(preview.totalOutOfPocket)}</p>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <p className="text-slate-500">Monthly EMI</p>
                <Tooltip content={TOOLTIPS.emi} position="top">
                  <span />
                </Tooltip>
              </div>
              <p className="font-semibold text-slate-900">{formatCurrency(preview.emi)}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" variant="primary" className="flex-1">
          {isEditing ? 'Update Property' : 'Add Property'}
        </Button>
      </div>
    </form>
  )
}
