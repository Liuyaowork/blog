import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { sqlite, initDatabase } from '@/lib/db'

// Ensure database is initialized
initDatabase()

/** GET /api/init/status - 检查是否已初始化 */
export async function GET() {
	try {
		const row = sqlite.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
		return NextResponse.json({ initialized: row.count > 0 })
	} catch {
		return NextResponse.json({ initialized: false })
	}
}

/** POST /api/init/setup - 初始化管理员账户 */
export async function POST(request: NextRequest) {
	try {
		// Check if already initialized
		const row = sqlite.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
		if (row.count > 0) {
			return NextResponse.json({ error: '已初始化，不能重复安装' }, { status: 400 })
		}

		const { username, password } = await request.json()

		if (!username || !password) {
			return NextResponse.json({ error: '请输入用户名和密码' }, { status: 400 })
		}

		if (password.length < 6) {
			return NextResponse.json({ error: '密码至少需要6个字符' }, { status: 400 })
		}

		const salt = await bcrypt.genSalt(10)
		const passwordHash = await bcrypt.hash(password, salt)

		sqlite.prepare(
			'INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)'
		).run(username, passwordHash, new Date().toISOString())

		return NextResponse.json({ success: true, message: '管理员账户创建成功' })
	} catch (error) {
		console.error('Setup error:', error)
		return NextResponse.json({ error: '初始化失败' }, { status: 500 })
	}
}
