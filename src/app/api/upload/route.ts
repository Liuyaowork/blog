import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/db/session'
import { getImagesDir } from '@/lib/db/paths'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

function requireAuth(request: NextRequest): boolean {
	const sessionId = request.cookies.get('session_id')?.value
	if (!sessionId) return false
	return getSession(sessionId) !== null
}

/** POST /api/upload - 上传文件（图片） */
export async function POST(request: NextRequest) {
	try {
		if (!requireAuth(request)) {
			return NextResponse.json({ error: '未登录' }, { status: 401 })
		}

		const formData = await request.formData()
		const file = formData.get('file') as File | null
		const subDir = formData.get('subDir') as string || 'blogs'

		if (!file) {
			return NextResponse.json({ error: '请选择文件' }, { status: 400 })
		}

		// 验证文件类型
		const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/ico']
		if (!allowedTypes.includes(file.type)) {
			return NextResponse.json({ error: '不支持的文件类型' }, { status: 400 })
		}

		// 生成唯一文件名
		const buffer = Buffer.from(await file.arrayBuffer())
		const hash = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 16)
		const ext = path.extname(file.name) || '.png'
		const filename = `${hash}${ext}`

		// 保存到 images 目录
		const targetDir = path.join(getImagesDir(), subDir)
		if (!fs.existsSync(targetDir)) {
			fs.mkdirSync(targetDir, { recursive: true })
		}
		const filepath = path.join(targetDir, filename)
		fs.writeFileSync(filepath, buffer)

		const url = `/api/images/${subDir}/${filename}`

		return NextResponse.json({ success: true, url, filename })
	} catch (error) {
		console.error('Upload error:', error)
		return NextResponse.json({ error: '上传失败' }, { status: 500 })
	}
}
