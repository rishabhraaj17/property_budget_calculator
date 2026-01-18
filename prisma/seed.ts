import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// State-wise government charges data for India
// Data sourced from official state government portals (as of 2024)
// Note: These are general rates; actual rates may vary based on property location, gender, etc.
const stateChargesData = [
  // Maharashtra
  {
    stateCode: 'MH',
    stateName: 'Maharashtra',
    propertyType: 'builder',
    stampDutyRate: 0.05, // 5% in Municipal Corporation areas (6% for men, 5% for women in rural)
    registrationFee: 30000, // ₹30,000 cap
    gstRateAffordable: 0.01,
    gstRateStandard: 0.05,
    affordableLimit: 4500000,
    metroSurcharge: 0.01, // 1% metro cess in Mumbai
    notes: 'In MMR (Mumbai), additional 1% metro cess applies. Women get 1% concession in some areas.',
    isSystem: true,
  },
  {
    stateCode: 'MH',
    stateName: 'Maharashtra',
    propertyType: 'resale',
    stampDutyRate: 0.05,
    registrationFee: 30000,
    gstRateAffordable: null,
    gstRateStandard: null,
    affordableLimit: null,
    metroSurcharge: 0.01,
    notes: 'No GST on resale properties. Metro cess applies in MMR.',
    isSystem: true,
  },

  // Karnataka
  {
    stateCode: 'KA',
    stateName: 'Karnataka',
    propertyType: 'builder',
    stampDutyRate: 0.05, // 5% base + additional surcharges
    registrationFee: 0, // 1% of property value, capped
    gstRateAffordable: 0.01,
    gstRateStandard: 0.05,
    affordableLimit: 4500000,
    otherCharges: 0.01, // 1% registration as percentage
    notes: 'Registration is 1% of property value. Additional surcharges may apply in BBMP limits.',
    isSystem: true,
  },
  {
    stateCode: 'KA',
    stateName: 'Karnataka',
    propertyType: 'resale',
    stampDutyRate: 0.05,
    registrationFee: 0,
    gstRateAffordable: null,
    gstRateStandard: null,
    affordableLimit: null,
    otherCharges: 0.01,
    notes: 'No GST on resale. Registration is 1% of property value.',
    isSystem: true,
  },

  // Delhi
  {
    stateCode: 'DL',
    stateName: 'Delhi',
    propertyType: 'builder',
    stampDutyRate: 0.06, // 6% for men, 4% for women
    registrationFee: 0, // 1% of property value
    gstRateAffordable: 0.01,
    gstRateStandard: 0.05,
    affordableLimit: 4500000,
    otherCharges: 0.01,
    notes: 'Women buyers get 2% concession on stamp duty (4% vs 6%). Registration is 1%.',
    isSystem: true,
  },
  {
    stateCode: 'DL',
    stateName: 'Delhi',
    propertyType: 'resale',
    stampDutyRate: 0.06,
    registrationFee: 0,
    gstRateAffordable: null,
    gstRateStandard: null,
    affordableLimit: null,
    otherCharges: 0.01,
    notes: 'Women get 2% stamp duty concession. Registration is 1%.',
    isSystem: true,
  },

  // Tamil Nadu
  {
    stateCode: 'TN',
    stateName: 'Tamil Nadu',
    propertyType: 'builder',
    stampDutyRate: 0.07, // 7% stamp duty
    registrationFee: 0, // 4% registration
    gstRateAffordable: 0.01,
    gstRateStandard: 0.05,
    affordableLimit: 4500000,
    otherCharges: 0.04, // 4% registration as percentage
    notes: 'Total charges ~11% (7% stamp + 4% registration). One of the highest in India.',
    isSystem: true,
  },
  {
    stateCode: 'TN',
    stateName: 'Tamil Nadu',
    propertyType: 'resale',
    stampDutyRate: 0.07,
    registrationFee: 0,
    gstRateAffordable: null,
    gstRateStandard: null,
    affordableLimit: null,
    otherCharges: 0.04,
    notes: 'No GST on resale. Total charges ~11%.',
    isSystem: true,
  },

  // Gujarat
  {
    stateCode: 'GJ',
    stateName: 'Gujarat',
    propertyType: 'builder',
    stampDutyRate: 0.049, // 4.9%
    registrationFee: 0,
    gstRateAffordable: 0.01,
    gstRateStandard: 0.05,
    affordableLimit: 4500000,
    otherCharges: 0.01, // 1% registration
    notes: 'Stamp duty 4.9% + Registration 1%. Women get additional benefits in some schemes.',
    isSystem: true,
  },
  {
    stateCode: 'GJ',
    stateName: 'Gujarat',
    propertyType: 'resale',
    stampDutyRate: 0.049,
    registrationFee: 0,
    gstRateAffordable: null,
    gstRateStandard: null,
    affordableLimit: null,
    otherCharges: 0.01,
    notes: 'No GST on resale. Total ~5.9%.',
    isSystem: true,
  },

  // Telangana
  {
    stateCode: 'TS',
    stateName: 'Telangana',
    propertyType: 'builder',
    stampDutyRate: 0.05, // 5% in GHMC, 4% outside
    registrationFee: 0,
    gstRateAffordable: 0.01,
    gstRateStandard: 0.05,
    affordableLimit: 4500000,
    otherCharges: 0.005, // 0.5% registration
    notes: '5% in GHMC limits, 4% outside. Registration 0.5%. Total ~5.5% in Hyderabad.',
    isSystem: true,
  },
  {
    stateCode: 'TS',
    stateName: 'Telangana',
    propertyType: 'resale',
    stampDutyRate: 0.05,
    registrationFee: 0,
    gstRateAffordable: null,
    gstRateStandard: null,
    affordableLimit: null,
    otherCharges: 0.005,
    notes: 'No GST on resale. One of the lower total charges.',
    isSystem: true,
  },

  // Uttar Pradesh
  {
    stateCode: 'UP',
    stateName: 'Uttar Pradesh',
    propertyType: 'builder',
    stampDutyRate: 0.07, // 7% for men, 6% for women
    registrationFee: 0,
    gstRateAffordable: 0.01,
    gstRateStandard: 0.05,
    affordableLimit: 4500000,
    otherCharges: 0.01, // 1% registration
    notes: '7% for men, 6% for women. Registration 1%. Noida/Greater Noida may have variations.',
    isSystem: true,
  },
  {
    stateCode: 'UP',
    stateName: 'Uttar Pradesh',
    propertyType: 'resale',
    stampDutyRate: 0.07,
    registrationFee: 0,
    gstRateAffordable: null,
    gstRateStandard: null,
    affordableLimit: null,
    otherCharges: 0.01,
    notes: 'Women get 1% stamp duty concession.',
    isSystem: true,
  },

  // Rajasthan
  {
    stateCode: 'RJ',
    stateName: 'Rajasthan',
    propertyType: 'builder',
    stampDutyRate: 0.05, // 5% for men, 4% for women
    registrationFee: 0,
    gstRateAffordable: 0.01,
    gstRateStandard: 0.05,
    affordableLimit: 4500000,
    otherCharges: 0.01, // 1% registration
    notes: '5% for men, 4% for women. Registration 1%. SC/ST get additional concessions.',
    isSystem: true,
  },
  {
    stateCode: 'RJ',
    stateName: 'Rajasthan',
    propertyType: 'resale',
    stampDutyRate: 0.05,
    registrationFee: 0,
    gstRateAffordable: null,
    gstRateStandard: null,
    affordableLimit: null,
    otherCharges: 0.01,
    notes: 'Women get 1% stamp duty concession.',
    isSystem: true,
  },

  // West Bengal
  {
    stateCode: 'WB',
    stateName: 'West Bengal',
    propertyType: 'builder',
    stampDutyRate: 0.06, // 6% in Kolkata MC, 5% elsewhere
    registrationFee: 0,
    gstRateAffordable: 0.01,
    gstRateStandard: 0.05,
    affordableLimit: 4500000,
    otherCharges: 0.01, // 1% registration
    notes: '6% in KMC area (up to 8% in premium areas), 5% elsewhere. Registration 1%.',
    isSystem: true,
  },
  {
    stateCode: 'WB',
    stateName: 'West Bengal',
    propertyType: 'resale',
    stampDutyRate: 0.06,
    registrationFee: 0,
    gstRateAffordable: null,
    gstRateStandard: null,
    affordableLimit: null,
    otherCharges: 0.01,
    notes: 'No GST on resale.',
    isSystem: true,
  },

  // Kerala
  {
    stateCode: 'KL',
    stateName: 'Kerala',
    propertyType: 'builder',
    stampDutyRate: 0.08, // 8%
    registrationFee: 0,
    gstRateAffordable: 0.01,
    gstRateStandard: 0.05,
    affordableLimit: 4500000,
    otherCharges: 0.02, // 2% registration
    notes: '8% stamp duty + 2% registration = 10% total. One of the higher rates.',
    isSystem: true,
  },
  {
    stateCode: 'KL',
    stateName: 'Kerala',
    propertyType: 'resale',
    stampDutyRate: 0.08,
    registrationFee: 0,
    gstRateAffordable: null,
    gstRateStandard: null,
    affordableLimit: null,
    otherCharges: 0.02,
    notes: 'No GST on resale. Total 10%.',
    isSystem: true,
  },

  // Haryana
  {
    stateCode: 'HR',
    stateName: 'Haryana',
    propertyType: 'builder',
    stampDutyRate: 0.07, // 7% for men, 5% for women
    registrationFee: 0,
    gstRateAffordable: 0.01,
    gstRateStandard: 0.05,
    affordableLimit: 4500000,
    otherCharges: 0.01, // ~1% registration
    notes: '7% for men, 5% for women. Gurgaon/Faridabad may have additional municipal charges.',
    isSystem: true,
  },
  {
    stateCode: 'HR',
    stateName: 'Haryana',
    propertyType: 'resale',
    stampDutyRate: 0.07,
    registrationFee: 0,
    gstRateAffordable: null,
    gstRateStandard: null,
    affordableLimit: null,
    otherCharges: 0.01,
    notes: 'Women get 2% stamp duty concession.',
    isSystem: true,
  },

  // Punjab
  {
    stateCode: 'PB',
    stateName: 'Punjab',
    propertyType: 'builder',
    stampDutyRate: 0.07, // 7% for men, 5% for women
    registrationFee: 0,
    gstRateAffordable: 0.01,
    gstRateStandard: 0.05,
    affordableLimit: 4500000,
    otherCharges: 0.01, // 1% registration
    notes: '7% for men, 5% for women. Urban/rural rates may differ.',
    isSystem: true,
  },
  {
    stateCode: 'PB',
    stateName: 'Punjab',
    propertyType: 'resale',
    stampDutyRate: 0.07,
    registrationFee: 0,
    gstRateAffordable: null,
    gstRateStandard: null,
    affordableLimit: null,
    otherCharges: 0.01,
    notes: 'Women get 2% stamp duty concession.',
    isSystem: true,
  },

  // Madhya Pradesh
  {
    stateCode: 'MP',
    stateName: 'Madhya Pradesh',
    propertyType: 'builder',
    stampDutyRate: 0.075, // 7.5%
    registrationFee: 0,
    gstRateAffordable: 0.01,
    gstRateStandard: 0.05,
    affordableLimit: 4500000,
    otherCharges: 0.03, // 3% registration
    notes: '7.5% stamp duty + 3% registration = 10.5% total. High overall charges.',
    isSystem: true,
  },
  {
    stateCode: 'MP',
    stateName: 'Madhya Pradesh',
    propertyType: 'resale',
    stampDutyRate: 0.075,
    registrationFee: 0,
    gstRateAffordable: null,
    gstRateStandard: null,
    affordableLimit: null,
    otherCharges: 0.03,
    notes: 'No GST on resale. Total 10.5%.',
    isSystem: true,
  },

  // Andhra Pradesh
  {
    stateCode: 'AP',
    stateName: 'Andhra Pradesh',
    propertyType: 'builder',
    stampDutyRate: 0.05, // 5%
    registrationFee: 0,
    gstRateAffordable: 0.01,
    gstRateStandard: 0.05,
    affordableLimit: 4500000,
    otherCharges: 0.005, // 0.5% registration
    notes: '5% stamp duty + 0.5% registration. Lower overall charges.',
    isSystem: true,
  },
  {
    stateCode: 'AP',
    stateName: 'Andhra Pradesh',
    propertyType: 'resale',
    stampDutyRate: 0.05,
    registrationFee: 0,
    gstRateAffordable: null,
    gstRateStandard: null,
    affordableLimit: null,
    otherCharges: 0.005,
    notes: 'No GST on resale.',
    isSystem: true,
  },

  // Goa
  {
    stateCode: 'GA',
    stateName: 'Goa',
    propertyType: 'builder',
    stampDutyRate: 0.035, // 3.5%
    registrationFee: 0,
    gstRateAffordable: 0.01,
    gstRateStandard: 0.05,
    affordableLimit: 4500000,
    otherCharges: 0.01, // ~1% registration
    notes: '3.5% stamp duty - one of the lowest in India. 1% registration.',
    isSystem: true,
  },
  {
    stateCode: 'GA',
    stateName: 'Goa',
    propertyType: 'resale',
    stampDutyRate: 0.035,
    registrationFee: 0,
    gstRateAffordable: null,
    gstRateStandard: null,
    affordableLimit: null,
    otherCharges: 0.01,
    notes: 'One of the lowest stamp duty rates in India.',
    isSystem: true,
  },
]

async function main() {
  console.log('🌱 Seeding database...')

  // Delete existing system state charges
  await prisma.stateCharges.deleteMany({
    where: { isSystem: true },
  })

  // Insert state charges
  for (const charge of stateChargesData) {
    await prisma.stateCharges.create({
      data: charge,
    })
  }

  console.log(`✅ Created ${stateChargesData.length} state charge entries`)
  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
