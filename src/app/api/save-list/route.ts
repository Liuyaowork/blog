import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/db/session'
import path from 'node:path'
import fs from 'node:fs'

function requireAuth(request: NextRequest): boolean {
	const sessionId = request.cookies.get('session_id')?.value
	if (!sessionId) return false
	return getSession(sessionId) !== null
}

const ALLOWED_FILES = [
	'projects/list.json',
	'share/list.json',
	'bloggers/list.json',
	'pictures/list.json',
	'about/list.json',
	'snippets/list.json'
]

/** POST /api/save-list - 保存列表数据到本地文件 */
export async function POST(request: NextRequest) {
	try {
		if (!requireAuth(request)) {
			return NextResponse.json({ error: '未登录' }, { status: 401 })
		}

		const body = await request.json()
		const { file, data } = body

		if (!file || !data) {
			return NextResponse.json({ error: '缺少参数' }, { status: 400 })
		}

		// 安全检查：只允许写入指定的文件
		if (!ALLOWED_FILES.includes(file)) {
			return NextResponse.json({ error: '不允许的文件' }, { status: 403 })
		}

		// 写入到 src/app/ 下的对应 list.json
		const filePath = path.join(process.cwd(), 'src', 'app', file)
		const dir = path.dirname(filePath)
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true })
		}

		fs.writeFileSync(filePath, JSON.stringify(data, null, '\t'), 'utf-8')

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Save list error:', error)
		return NextResponse.json({ error: '保存失败' }, { status: 500 })
	}
}
