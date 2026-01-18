import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

// Get session ID from cookie or create new one
function getSessionId(request: NextRequest): string {
  return request.cookies.get('session_id')?.value || uuidv4()
}

// GET - List properties
export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value
    const sessionId = getSessionId(request)

    // Fetch properties based on auth status
    const properties = await prisma.property.findMany({
      where: userId
        ? { userId }
        : { sessionId, userId: null },
      orderBy: { createdAt: 'desc' },
    })

    const response = NextResponse.json({ properties })

    // Set session cookie if not logged in
    if (!userId && !request.cookies.get('session_id')) {
      response.cookies.set('session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      })
    }

    return response
  } catch (error) {
    console.error('Get properties error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    )
  }
}

// POST - Create property
export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value
    const sessionId = getSessionId(request)
    const data = await request.json()

    const property = await prisma.property.create({
      data: {
        id: data.id || uuidv4(),
        name: data.name,
        propertyType: data.propertyType,
        inputMode: data.inputMode,
        pricePerSqFt: data.pricePerSqFt,
        areaSqFt: data.areaSqFt,
        parkingCost: data.parkingCost,
        totalDealValue: data.totalDealValue,
        blackComponent: data.blackComponent,
        overrides: data.overrides || {},
        calculations: data.calculations || {},
        stateCode: data.stateCode,
        userId: userId || null,
        sessionId: userId ? null : sessionId,
      },
    })

    const response = NextResponse.json({ property })

    // Set session cookie if not logged in
    if (!userId && !request.cookies.get('session_id')) {
      response.cookies.set('session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
      })
    }

    return response
  } catch (error) {
    console.error('Create property error:', error)
    return NextResponse.json(
      { error: 'Failed to create property' },
      { status: 500 }
    )
  }
}
