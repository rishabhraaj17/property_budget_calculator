import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Get single property
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.cookies.get('user_id')?.value
    const sessionId = request.cookies.get('session_id')?.value

    const property = await prisma.property.findFirst({
      where: {
        id: params.id,
        OR: [
          { userId: userId || undefined },
          { sessionId: sessionId || undefined },
        ],
      },
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ property })
  } catch (error) {
    console.error('Get property error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch property' },
      { status: 500 }
    )
  }
}

// PUT - Update property
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.cookies.get('user_id')?.value
    const sessionId = request.cookies.get('session_id')?.value
    const data = await request.json()

    // First verify ownership
    const existing = await prisma.property.findFirst({
      where: {
        id: params.id,
        OR: [
          { userId: userId || undefined },
          { sessionId: sessionId || undefined },
        ],
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    const property = await prisma.property.update({
      where: { id: params.id },
      data: {
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
      },
    })

    return NextResponse.json({ property })
  } catch (error) {
    console.error('Update property error:', error)
    return NextResponse.json(
      { error: 'Failed to update property' },
      { status: 500 }
    )
  }
}

// DELETE - Delete property
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.cookies.get('user_id')?.value
    const sessionId = request.cookies.get('session_id')?.value

    // First verify ownership
    const existing = await prisma.property.findFirst({
      where: {
        id: params.id,
        OR: [
          { userId: userId || undefined },
          { sessionId: sessionId || undefined },
        ],
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    await prisma.property.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete property error:', error)
    return NextResponse.json(
      { error: 'Failed to delete property' },
      { status: 500 }
    )
  }
}
