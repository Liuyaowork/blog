import { NextRequest, NextResponse } from 'next/server'
import { sqlite, initDatabase } from '@/lib/db'
import { getSession } from '@/lib/db/session'
import { getBlogDir, blogsIndexPath } from '@/lib/db/paths'
import fs from 'node:fs'
import path from 'node:path'

initDatabase()

// 认证中间件
function requireAuth(request: NextRequest): boolean {
	const sessionId = request.cookies.get('session_id')?.value
	if (!sessionId) return false
	return getSession(sessionId) !== null
}

/** GET /api/blogs - 获取博客列表 */
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url)
		const slug = searchParams.get('slug')

		// 获取单篇文章
		if (slug) {
			const blog = sqlite.prepare('SELECT * FROM blogs WHERE slug = ?').get(slug) as Record<string, any> | undefined

			if (!blog) {
				return NextResponse.json({ error: '文章不存在' }, { status: 404 })
			}

			// 读取 markdown 内容
			const mdPath = path.join(getBlogDir(slug), 'index.md')
			let markdown = ''
			if (fs.existsSync(mdPath)) {
				markdown = fs.readFileSync(mdPath, 'utf-8')
			}

			return NextResponse.json({
				...blog,
				tags: JSON.parse(blog.tags || '[]'),
				markdown
			})
		}

		// 获取文章列表
		const isAdmin = requireAuth(request)
		const hiddenParam = searchParams.get('hidden')
		const category = searchParams.get('category')
		const tag = searchParams.get('tag')

		let allBlogs: Record<string, any>[]
		if (!isAdmin) {
			allBlogs = sqlite.prepare("SELECT * FROM blogs WHERE hidden = 0 ORDER BY date DESC").all()
		} else if (hiddenParam === 'true') {
			allBlogs = sqlite.prepare("SELECT * FROM blogs WHERE hidden = 1 ORDER BY date DESC").all()
		} else {
			allBlogs = sqlite.prepare("SELECT * FROM blogs ORDER BY date DESC").all()
		}

		let filtered = allBlogs

		if (category) {
			filtered = filtered.filter(b => b.category === category)
		}

		if (tag) {
			filtered = filtered.filter(b => {
				const tags = JSON.parse(b.tags || '[]')
				return tags.includes(tag)
			})
		}

		const result = filtered.map(b => ({
			...b,
			tags: JSON.parse(b.tags || '[]')
		}))

		return NextResponse.json(result)
	} catch (error) {
		console.error('Get blogs error:', error)
		return NextResponse.json({ error: '获取文章列表失败' }, { status: 500 })
	}
}

/** POST /api/blogs - 创建/更新博客 */
export async function POST(request: NextRequest) {
	try {
		if (!requireAuth(request)) {
			return NextResponse.json({ error: '未登录' }, { status: 401 })
		}

		const body = await request.json()
		const { slug, title, md, tags, date, summary, hidden, category, cover } = body

		if (!slug || !title) {
			return NextResponse.json({ error: 'slug 和标题不能为空' }, { status: 400 })
		}

		const blogDir = getBlogDir(slug)
		const now = new Date().toISOString()
		const dateStr = date || now.split('T')[0]
		const tagsStr = JSON.stringify(tags || [])

		// 保存 markdown
		if (md) {
			fs.writeFileSync(path.join(blogDir, 'index.md'), md, 'utf-8')
		}

		// 保存 config
		const config = { title, tags: tags || [], date: dateStr, summary, cover, hidden, category }
		fs.writeFileSync(path.join(blogDir, 'config.json'), JSON.stringify(config, null, 2), 'utf-8')

		// 保存到数据库
		const existing = sqlite.prepare('SELECT slug FROM blogs WHERE slug = ?').get(slug)

		if (existing) {
			sqlite.prepare(
				'UPDATE blogs SET title = ?, tags = ?, date = ?, summary = ?, cover = ?, hidden = ?, category = ?, updated_at = ? WHERE slug = ?'
			).run(title, tagsStr, dateStr, summary || '', cover || '', hidden ? 1 : 0, category || '', now, slug)
		} else {
			sqlite.prepare(
				'INSERT INTO blogs (slug, title, tags, date, summary, cover, hidden, category, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
			).run(slug, title, tagsStr, dateStr, summary || '', cover || '', hidden ? 1 : 0, category || '', now, now)
		}

		// 更新 index.json
		updateBlogsIndex()

		return NextResponse.json({ success: true, slug })
	} catch (error) {
		console.error('Save blog error:', error)
		return NextResponse.json({ error: '保存文章失败' }, { status: 500 })
	}
}

/** DELETE /api/blogs - 删除博客 */
export async function DELETE(request: NextRequest) {
	try {
		if (!requireAuth(request)) {
			return NextResponse.json({ error: '未登录' }, { status: 401 })
		}

		const { searchParams } = new URL(request.url)
		const slug = searchParams.get('slug')

		if (!slug) {
			return NextResponse.json({ error: '需要 slug' }, { status: 400 })
		}

		// 删除博客目录
		const blogDir = getBlogDir(slug)
		if (fs.existsSync(blogDir)) {
			fs.rmSync(blogDir, { recursive: true, force: true })
		}

		// 删除数据库记录
		sqlite.prepare('DELETE FROM blogs WHERE slug = ?').run(slug)

		// 更新 index.json
		updateBlogsIndex()

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Delete blog error:', error)
		return NextResponse.json({ error: '删除文章失败' }, { status: 500 })
	}
}

/** 更新 blogs/index.json */
function updateBlogsIndex() {
	const allBlogs = sqlite.prepare('SELECT * FROM blogs ORDER BY date DESC').all() as Record<string, any>[]

	const indexData = allBlogs.map(b => ({
		slug: b.slug,
		title: b.title,
		tags: JSON.parse(b.tags || '[]'),
		date: b.date,
		summary: b.summary,
		cover: b.cover,
		hidden: !!b.hidden,
		category: b.category
	}))

	fs.writeFileSync(blogsIndexPath(), JSON.stringify(indexData, null, 2), 'utf-8')
}
