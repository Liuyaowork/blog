import { NextRequest, NextResponse } from 'next/server'
import { getImagesDir } from '@/lib/db/paths'
import fs from 'node:fs'
import path from 'node:path'

const MIME_TYPES: Record<string, string> = {
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.png': 'image/png',
	'.gif': 'image/gif',
	'.webp': 'image/webp',
	'.svg': 'image/svg+xml',
	'.ico': 'image/x-icon'
}

/** GET /api/images/[...path] - 获取图片 */
export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ path: string[] }> }
) {
	try {
		const { path: pathSegments } = await params
		if (!pathSegments || pathSegments.length === 0) {
			return NextResponse.json({ error: '路径错误' }, { status: 400 })
		}

		const relativePath = pathSegments.join('/')
		const filePath = path.join(getImagesDir(), relativePath)

		// 安全性检查：确保路径在 images 目录内
		const imagesDir = getImagesDir()
		const resolvedPath = path.resolve(filePath)
		if (!resolvedPath.startsWith(path.resolve(imagesDir))) {
			return NextResponse.json({ error: '禁止访问' }, { status: 403 })
		}

		if (!fs.existsSync(resolvedPath)) {
			return NextResponse.json({ error: '文件不存在' }, { status: 404 })
		}

		const ext = path.extname(resolvedPath).toLowerCase()
		const contentType = MIME_TYPES[ext] || 'application/octet-stream'
		const buffer = fs.readFileSync(resolvedPath)

		return new NextResponse(buffer, {
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=31536000, immutable'
			}
		})
	} catch (error) {
		console.error('Serve image error:', error)
		return NextResponse.json({ error: '获取图片失败' }, { status: 500 })
	}
}
