import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

// GET - List state charges
export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value
    const { searchParams } = new URL(request.url)
    const stateCode = searchParams.get('stateCode')
    const propertyType = searchParams.get('propertyType')

    // Build where clause
    const where: Record<string, unknown> = {}
    if (stateCode) where.stateCode = stateCode
    if (propertyType) where.propertyType = { in: [propertyType, 'all'] }

    // Get system charges + user's custom charges
    const charges = await prisma.stateCharges.findMany({
      where: {
        ...where,
        OR: [
          { isSystem: true },
          { userId: userId || undefined },
        ],
      },
      orderBy: [{ stateName: 'asc' }, { propertyType: 'asc' }],
    })

    // Get unique states for dropdown
    const states = await prisma.stateCharges.findMany({
      where: {
        OR: [
          { isSystem: true },
          { userId: userId || undefined },
        ],
      },
      select: {
        stateCode: true,
        stateName: true,
      },
      distinct: ['stateCode'],
      orderBy: { stateName: 'asc' },
    })

    return NextResponse.json({ charges, states })
  } catch (error) {
    console.error('Get state charges error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch state charges' },
      { status: 500 }
    )
  }
}

// POST - Create custom state charges (user-specific)
export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value
    const data = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'Login required to save custom charges' },
        { status: 401 }
      )
    }

    // Check for existing custom entry
    const existing = await prisma.stateCharges.findFirst({
      where: {
        stateCode: data.stateCode,
        propertyType: data.propertyType,
        userId,
      },
    })

    if (existing) {
      // Update existing
      const charge = await prisma.stateCharges.update({
        where: { id: existing.id },
        data: {
          stateName: data.stateName,
          stampDutyRate: data.stampDutyRate,
          registrationFee: data.registrationFee,
          gstRateAffordable: data.gstRateAffordable,
          gstRateStandard: data.gstRateStandard,
          affordableLimit: data.affordableLimit,
          metroSurcharge: data.metroSurcharge,
          otherCharges: data.otherCharges,
          notes: data.notes,
          sourceUrl: data.sourceUrl,
          lastVerified: data.lastVerified ? new Date(data.lastVerified) : null,
        },
      })
      return NextResponse.json({ charge })
    }

    // Create new custom entry
    const charge = await prisma.stateCharges.create({
      data: {
        id: uuidv4(),
        stateCode: data.stateCode,
        stateName: data.stateName,
        propertyType: data.propertyType,
        stampDutyRate: data.stampDutyRate,
        registrationFee: data.registrationFee,
        gstRateAffordable: data.gstRateAffordable,
        gstRateStandard: data.gstRateStandard,
        affordableLimit: data.affordableLimit,
        metroSurcharge: data.metroSurcharge,
        otherCharges: data.otherCharges,
        notes: data.notes,
        sourceUrl: data.sourceUrl,
        lastVerified: data.lastVerified ? new Date(data.lastVerified) : null,
        isSystem: false,
        userId,
      },
    })

    return NextResponse.json({ charge })
  } catch (error) {
    console.error('Create state charges error:', error)
    return NextResponse.json(
      { error: 'Failed to create state charges' },
      { status: 500 }
    )
  }
}
