import { NextRequest, NextResponse } from 'next/server'
import { sqlite, initDatabase } from '@/lib/db'

initDatabase()

const RATE_LIMIT_MS = 24 * 60 * 60 * 1000 // 24小时

/** GET /api/likes?slug=xxx - 获取点赞数 */
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url)
		const slug = searchParams.get('slug')

		if (!slug) {
			return NextResponse.json({ error: '需要 slug' }, { status: 400 })
		}

		const row = sqlite.prepare('SELECT COUNT(*) as count FROM likes WHERE slug = ?').get(slug) as { count: number }

		return NextResponse.json({ count: row.count })
	} catch (error) {
		console.error('Get likes error:', error)
		return NextResponse.json({ count: 0 })
	}
}

/** POST /api/likes?slug=xxx - 点赞 */
export async function POST(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url)
		const slug = searchParams.get('slug')

		if (!slug) {
			return NextResponse.json({ error: '需要 slug' }, { status: 400 })
		}

		// 获取 IP 用于频率限制
		const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
			|| request.headers.get('x-real-ip')
			|| 'unknown'

		// 检查24小时内是否已点赞
		const oneDayAgo = new Date(Date.now() - RATE_LIMIT_MS).toISOString()
		const recent = sqlite.prepare(
			"SELECT id FROM likes WHERE slug = ? AND ip = ? AND created_at >= ?"
		).get(slug, ip, oneDayAgo)

		if (recent) {
			const row = sqlite.prepare('SELECT COUNT(*) as count FROM likes WHERE slug = ?').get(slug) as { count: number }
			return NextResponse.json({ count: row.count, reason: 'rate_limited' })
		}

		sqlite.prepare(
			'INSERT INTO likes (slug, ip, created_at) VALUES (?, ?, ?)'
		).run(slug, ip, new Date().toISOString())

		const row = sqlite.prepare('SELECT COUNT(*) as count FROM likes WHERE slug = ?').get(slug) as { count: number }

		return NextResponse.json({ count: row.count })
	} catch (error) {
		console.error('Like error:', error)
		return NextResponse.json({ error: '点赞失败' }, { status: 500 })
	}
}
