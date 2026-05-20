import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { sqlite, initDatabase } from '@/lib/db'
import { createSession, getSession, deleteSession } from '@/lib/db/session'

// Ensure database is initialized
initDatabase()

/** POST /api/auth/login - 用户登录 */
export async function POST(request: NextRequest) {
	try {
		const { username, password } = await request.json()

		if (!username || !password) {
			return NextResponse.json({ error: '请输入用户名和密码' }, { status: 400 })
		}

		const user = sqlite.prepare('SELECT * FROM users WHERE username = ?').get(username) as { id: number; username: string; password_hash: string } | undefined

		if (!user) {
			return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
		}

		const valid = await bcrypt.compare(password, user.password_hash)
		if (!valid) {
			return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
		}

		const sessionId = createSession(user.id)

		const response = NextResponse.json({
			success: true,
			user: { id: user.id, username: user.username }
		})

		response.cookies.set('session_id', sessionId, {
			httpOnly: true,
			secure: false,
			sameSite: 'lax',
			path: '/',
			maxAge: 7 * 24 * 60 * 60 // 7 days
		})

		return response
	} catch (error) {
		console.error('Login error:', error)
		return NextResponse.json({ error: '登录失败' }, { status: 500 })
	}
}

/** GET /api/auth/me - 获取当前登录用户 */
export async function GET(request: NextRequest) {
	try {
		const sessionId = request.cookies.get('session_id')?.value
		if (!sessionId) {
			return NextResponse.json({ authenticated: false }, { status: 401 })
		}

		const user = getSession(sessionId)
		if (!user) {
			return NextResponse.json({ authenticated: false }, { status: 401 })
		}

		return NextResponse.json({ authenticated: true, user })
	} catch {
		return NextResponse.json({ authenticated: false }, { status: 401 })
	}
}

/** DELETE /api/auth/logout - 退出登录 */
export async function DELETE(request: NextRequest) {
	const sessionId = request.cookies.get('session_id')?.value
	if (sessionId) {
		deleteSession(sessionId)
	}

	const response = NextResponse.json({ success: true })
	response.cookies.set('session_id', '', {
		httpOnly: true,
		secure: false,
		sameSite: 'lax',
		path: '/',
		maxAge: 0
	})

	return response
}
