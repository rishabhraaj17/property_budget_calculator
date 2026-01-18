import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value
    const userId = request.cookies.get('user_id')?.value

    if (!token || !userId) {
      return NextResponse.json({ user: null })
    }

    // Verify session
    const session = await prisma.session.findUnique({
      where: { token },
    })

    if (!session || session.expiresAt < new Date()) {
      // Session expired or invalid
      const response = NextResponse.json({ user: null })
      response.cookies.delete('auth_token')
      response.cookies.delete('user_id')
      return response
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({ user: null })
  }
}
