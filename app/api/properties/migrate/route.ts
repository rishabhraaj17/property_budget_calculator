import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST - Migrate session properties to user account
export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value
    const sessionId = request.cookies.get('session_id')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'Login required' },
        { status: 401 }
      )
    }

    if (!sessionId) {
      return NextResponse.json({ migrated: 0 })
    }

    // Migrate all session properties to user
    const result = await prisma.property.updateMany({
      where: {
        sessionId,
        userId: null,
      },
      data: {
        userId,
        sessionId: null,
      },
    })

    return NextResponse.json({ migrated: result.count })
  } catch (error) {
    console.error('Migrate properties error:', error)
    return NextResponse.json(
      { error: 'Failed to migrate properties' },
      { status: 500 }
    )
  }
}
