import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value

    if (token) {
      // Delete session from database
      await prisma.session.deleteMany({
        where: { token },
      })
    }

    // Clear cookies
    const response = NextResponse.json({ success: true })
    response.cookies.delete('auth_token')
    response.cookies.delete('user_id')

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    )
  }
}
