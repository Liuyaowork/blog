import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/db/session'
import { getDataDir } from '@/lib/db/paths'
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

function getListDataDir(): string {
	// 在 Docker 容器中（standalone 模式），data/ 是持久化卷
	// 本地开发时也使用 data/ 确保一致性
	return path.join(getDataDir(), 'lists')
}

/** GET /api/save-list?file=xxx - 获取列表数据 */
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url)
		const file = searchParams.get('file')

		if (!file || !ALLOWED_FILES.includes(file)) {
			return NextResponse.json({ error: '参数错误' }, { status: 400 })
		}

		const filePath = path.join(getListDataDir(), file)
		if (!fs.existsSync(filePath)) {
			return NextResponse.json({ error: '文件不存在' }, { status: 404 })
		}

		const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
		return NextResponse.json(data)
	} catch (error) {
		console.error('Read list error:', error)
		return NextResponse.json({ error: '读取失败' }, { status: 500 })
	}
}

/** POST /api/save-list - 保存列表数据 */
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

		// 写入到 data/lists/ 目录（持久化卷，适用于 Docker 容器）
		const dataFilePath = path.join(getListDataDir(), file)
		const dataDir = path.dirname(dataFilePath)
		if (!fs.existsSync(dataDir)) {
			fs.mkdirSync(dataDir, { recursive: true })
		}
		fs.writeFileSync(dataFilePath, JSON.stringify(data, null, '\t'), 'utf-8')

		// 同时尝试写入 src/app/ 下的 list.json（本地开发环境兼容）
		try {
			const srcFilePath = path.join(process.cwd(), 'src', 'app', file)
			const srcDir = path.dirname(srcFilePath)
			if (!fs.existsSync(srcDir)) {
				fs.mkdirSync(srcDir, { recursive: true })
			}
			fs.writeFileSync(srcFilePath, JSON.stringify(data, null, '\t'), 'utf-8')
		} catch {
			// src/app/ 写入失败（如 Docker standalone 模式），忽略
		}

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Save list error:', error)
		return NextResponse.json({ error: '保存失败' }, { status: 500 })
	}
}
