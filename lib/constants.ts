import { TooltipDefinition } from './types'

// Default rates for calculations
export const DEFAULTS = {
  GST_RATE_AFFORDABLE: 0.01,      // 1% for affordable housing (<45L)
  GST_RATE_STANDARD: 0.05,        // 5% for standard housing (>=45L)
  AFFORDABLE_THRESHOLD: 4500000,   // ₹45 Lakhs
  STAMP_DUTY_RATE: 0.10,          // 10% (varies by state, using common value)
  REGISTRATION_FEE: 30000,        // ₹30,000
  INTEREST_RATE: 0.085,           // 8.5% per annum
  TENURE_YEARS: 20,               // 20 years
}

// LTV (Loan to Value) tiers based on RBI guidelines
export const LTV_TIERS = [
  { maxAmount: 3000000, ltvRate: 0.90, description: '90% (≤₹30 Lakhs)' },   // ≤₹30L → 90% LTV
  { maxAmount: 7500000, ltvRate: 0.80, description: '80% (₹30L - ₹75L)' },   // ₹30L - ₹75L → 80% LTV
  { maxAmount: Infinity, ltvRate: 0.75, description: '75% (>₹75 Lakhs)' },  // >₹75L → 75% LTV
]

// Property type options
export const PROPERTY_TYPES = [
  { value: 'builder', label: 'Builder / Under Construction' },
  { value: 'resale', label: 'Resale / Ready to Move' },
]

// Input mode options
export const INPUT_MODES = [
  { value: 'calculated', label: 'Calculate from Area' },
  { value: 'direct', label: 'Enter Total Value' },
]

// Format options for currency display
export const CURRENCY_FORMAT = {
  locale: 'en-IN',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
}

// Chart colors
export const CHART_COLORS = {
  downpayment: '#4F46E5',     // Primary/Indigo
  gst: '#F59E0B',             // Warning/Amber
  stampDuty: '#10B981',       // Success/Emerald
  registration: '#6366F1',     // Indigo lighter
  black: '#1E293B',           // Slate dark
  loan: '#818CF8',            // Indigo light
  interest: '#F43F5E',        // Danger/Rose
}

// Educational tooltips for financial terms
export const TOOLTIPS: Record<string, TooltipDefinition> = {
  ltv: {
    term: 'LTV (Loan-to-Value)',
    shortDescription: 'Percentage of property value that banks will finance',
    longDescription: `LTV ratio determines how much loan you can get relative to the property's value. As per RBI guidelines:

• Property value ≤ ₹30 Lakhs: Up to 90% LTV
• Property value ₹30L - ₹75L: Up to 80% LTV
• Property value > ₹75 Lakhs: Up to 75% LTV

Higher LTV means lower down payment but higher EMI. Lower LTV means more money upfront but lower monthly burden.`,
    example: 'For a ₹50L property, 80% LTV means bank finances ₹40L, you pay ₹10L as down payment.',
    source: 'RBI Master Circular on Housing Finance',
  },
  gst: {
    term: 'GST (Goods & Services Tax)',
    shortDescription: 'Tax on under-construction properties',
    longDescription: `GST applies only to under-construction (builder) properties, not to ready-to-move or resale properties.

• Affordable Housing (≤ ₹45L): 1% GST (without ITC)
• Non-Affordable Housing (> ₹45L): 5% GST (without ITC)

GST is calculated on the agreement value (white component), not the total deal value including black money.`,
    example: 'For a ₹60L builder property, GST = 5% × ₹60L = ₹3L',
    source: 'GST Council Notification',
  },
  stampDuty: {
    term: 'Stamp Duty',
    shortDescription: 'State tax on property registration documents',
    longDescription: `Stamp duty is a state-level tax paid when registering property documents. Rates vary significantly by state:

• Maharashtra: 5-6%
• Karnataka: 5% + 1% cess
• Tamil Nadu: 7%
• Delhi: 4-6%
• Gujarat: 4.9%

Women buyers often get 1-2% concession in many states. The duty is calculated on the agreement value.`,
    example: 'In Maharashtra, for ₹50L property: 5% stamp duty = ₹2.5L',
    source: 'State Revenue Department',
  },
  registrationFee: {
    term: 'Registration Fee',
    shortDescription: 'Fee for registering property with sub-registrar',
    longDescription: `Registration fee is paid to the government for officially recording the property transfer. It varies by state:

• Some states charge a flat fee (e.g., ₹30,000 cap in Maharashtra)
• Others charge a percentage (e.g., 1% in Karnataka, 4% in Tamil Nadu)

This is separate from stamp duty and is non-refundable.`,
    example: 'In Maharashtra, registration fee is capped at ₹30,000 regardless of property value.',
  },
  agreementValue: {
    term: 'Agreement Value (White Component)',
    shortDescription: 'Officially declared property value in sale agreement',
    longDescription: `The agreement value is the amount officially declared in the sale deed and registered with authorities. This is also called the "white component."

• All government taxes are calculated on this value
• Bank loans are provided based on this value
• This becomes the official purchase price for future capital gains tax calculation

The difference between total deal value and agreement value is the undeclared "black" component.`,
    example: 'Total deal ₹70L, Agreement value ₹60L means ₹60L is white, ₹10L is black.',
  },
  blackComponent: {
    term: 'Black Component (Cash)',
    shortDescription: 'Undeclared cash portion of the deal',
    longDescription: `The black component is the undeclared cash portion of a property transaction that is not reflected in official documents.

Important considerations:
• No bank loan available on this amount
• Must be paid entirely from own funds
• No tax benefit on this portion
• Carries legal and tax risks

This tool includes it for realistic cost planning, not as an endorsement of such practices.`,
    example: 'If total deal is ₹70L and agreement shows ₹55L, the ₹15L cash payment is the black component.',
  },
  emi: {
    term: 'EMI (Equated Monthly Installment)',
    shortDescription: 'Fixed monthly payment towards home loan',
    longDescription: `EMI is your fixed monthly payment that includes both principal and interest. The formula is:

EMI = P × r × (1+r)^n / ((1+r)^n - 1)

Where:
• P = Principal loan amount
• r = Monthly interest rate (annual rate / 12)
• n = Total number of months

Early EMIs have more interest, later ones have more principal (amortization).`,
    example: 'For ₹40L loan at 8.5% for 20 years: EMI ≈ ₹34,720/month',
  },
  downpayment: {
    term: 'Down Payment',
    shortDescription: 'Upfront amount you pay from your own funds',
    longDescription: `Down payment is the portion of the white/agreement value not covered by the home loan. It equals:

Down Payment = Agreement Value - Loan Amount

For example, with 80% LTV:
• Agreement Value: ₹50L
• Loan (80%): ₹40L
• Down Payment: ₹10L

A higher down payment means smaller loan and lower EMI but more immediate cash outflow.`,
    example: 'For ₹50L property with 80% LTV: Down payment = ₹50L - ₹40L = ₹10L',
  },
  totalOutOfPocket: {
    term: 'Total Out-of-Pocket',
    shortDescription: 'Total immediate cash requirement',
    longDescription: `Total out-of-pocket is all the money you need to arrange upfront before/during property purchase:

Total Out-of-Pocket = Down Payment + All Government Charges + Black Component

This does NOT include the loan amount or future EMIs. This is your immediate cash requirement for the purchase.`,
    example: 'Down payment ₹10L + Stamp duty ₹2.5L + Registration ₹30K + GST ₹2.5L + Black ₹5L = ₹20.3L out-of-pocket',
  },
  costPerSqFt: {
    term: 'Cost per Sq.Ft.',
    shortDescription: 'Base property cost divided by carpet area',
    longDescription: `Cost per square foot helps compare properties of different sizes:

Base Cost/SqFt = Total Deal Value / Carpet Area

Effective Cost/SqFt includes all charges:
Effective = (Total Deal Value + All Charges) / Carpet Area

Always compare effective cost/sqft for accurate comparison between properties.`,
    example: '₹60L property with 1000 sqft: ₹6,000/sqft base, ~₹6,800/sqft effective (with charges)',
  },
}

// State codes and names for dropdown
export const INDIAN_STATES = [
  { code: 'AP', name: 'Andhra Pradesh' },
  { code: 'AR', name: 'Arunachal Pradesh' },
  { code: 'AS', name: 'Assam' },
  { code: 'BR', name: 'Bihar' },
  { code: 'CT', name: 'Chhattisgarh' },
  { code: 'GA', name: 'Goa' },
  { code: 'GJ', name: 'Gujarat' },
  { code: 'HR', name: 'Haryana' },
  { code: 'HP', name: 'Himachal Pradesh' },
  { code: 'JK', name: 'Jammu & Kashmir' },
  { code: 'JH', name: 'Jharkhand' },
  { code: 'KA', name: 'Karnataka' },
  { code: 'KL', name: 'Kerala' },
  { code: 'MP', name: 'Madhya Pradesh' },
  { code: 'MH', name: 'Maharashtra' },
  { code: 'MN', name: 'Manipur' },
  { code: 'ML', name: 'Meghalaya' },
  { code: 'MZ', name: 'Mizoram' },
  { code: 'NL', name: 'Nagaland' },
  { code: 'OD', name: 'Odisha' },
  { code: 'PB', name: 'Punjab' },
  { code: 'RJ', name: 'Rajasthan' },
  { code: 'SK', name: 'Sikkim' },
  { code: 'TN', name: 'Tamil Nadu' },
  { code: 'TS', name: 'Telangana' },
  { code: 'TR', name: 'Tripura' },
  { code: 'UP', name: 'Uttar Pradesh' },
  { code: 'UK', name: 'Uttarakhand' },
  { code: 'WB', name: 'West Bengal' },
  { code: 'DL', name: 'Delhi' },
]
