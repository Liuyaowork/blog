import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/db/session'
import { siteContentPath, cardStylesPath, getImagesDir } from '@/lib/db/paths'
import { initDatabase } from '@/lib/db'
import fs from 'node:fs'
import path from 'node:path'

initDatabase()

function requireAuth(request: NextRequest): boolean {
	const sessionId = request.cookies.get('session_id')?.value
	if (!sessionId) return false
	return getSession(sessionId) !== null
}

/** GET /api/config - 获取站点配置 */
export async function GET() {
	try {
		let siteContent = {}
		const scPath = siteContentPath()
		if (fs.existsSync(scPath)) {
			siteContent = JSON.parse(fs.readFileSync(scPath, 'utf-8'))
		}

		let cardStyles = {}
		const csPath = cardStylesPath()
		if (fs.existsSync(csPath)) {
			cardStyles = JSON.parse(fs.readFileSync(csPath, 'utf-8'))
		}

		return NextResponse.json({ siteContent, cardStyles })
	} catch (error) {
		console.error('Get config error:', error)
		return NextResponse.json({ error: '获取配置失败' }, { status: 500 })
	}
}

/** POST /api/config - 保存站点配置 */
export async function POST(request: NextRequest) {
	try {
		if (!requireAuth(request)) {
			return NextResponse.json({ error: '未登录' }, { status: 401 })
		}

		const body = await request.json()
		const { siteContent, cardStyles } = body

		if (siteContent) {
			fs.writeFileSync(siteContentPath(), JSON.stringify(siteContent, null, 2), 'utf-8')
		}

		if (cardStyles) {
			fs.writeFileSync(cardStylesPath(), JSON.stringify(cardStyles, null, 2), 'utf-8')
		}

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Save config error:', error)
		return NextResponse.json({ error: '保存配置失败' }, { status: 500 })
	}
}
