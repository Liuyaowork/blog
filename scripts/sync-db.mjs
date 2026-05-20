/**
 * 将 data/blogs/index.json 中的博客元数据导入 SQLite 数据库
 */
import { sqlite, initDatabase } from '../src/lib/db'
import { getBlogDir } from '../src/lib/db/paths'
import fs from 'node:fs'
import path from 'node:path'

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data')

initDatabase()

const indexPath = path.join(DATA_DIR, 'blogs', 'index.json')

if (!fs.existsSync(indexPath)) {
	console.error('未找到 index.json，请先运行 scripts/migrate-data.mjs')
	process.exit(1)
}

const blogs = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
console.log(`发现 ${blogs.length} 篇文章`)

const now = new Date().toISOString()
let imported = 0

for (const blog of blogs) {
	const existing = sqlite.prepare('SELECT slug FROM blogs WHERE slug = ?').get(blog.slug)
	if (existing) {
		console.log(`  跳过 (已存在): ${blog.slug}`)
		continue
	}

	// 尝试读取 config.json 获取更多信息
	let config = {}
	const configPath = path.join(getBlogDir(blog.slug), 'config.json')
	if (fs.existsSync(configPath)) {
		try {
			config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
		} catch { /* ignore */ }
	}

	const merged = { ...blog, ...config }
	const tagsStr = JSON.stringify(merged.tags || [])
	const coverStr = typeof merged.cover === 'string' ? merged.cover : ''
	const summaryStr = typeof merged.summary === 'string' ? merged.summary : ''
	const categoryStr = typeof merged.category === 'string' ? merged.category : ''

	try {
		sqlite.prepare(
			'INSERT OR REPLACE INTO blogs (slug, title, tags, date, summary, cover, hidden, category, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
		).run(
			blog.slug,
			merged.title || blog.slug,
			tagsStr,
			blog.date || now.split('T')[0],
			summaryStr,
			coverStr,
			merged.hidden ? 1 : 0,
			categoryStr,
			now,
			now
		)
		console.log(`  ✓ ${blog.slug}`)
		imported++
	} catch (err) {
		console.error(`  ✗ ${blog.slug}: ${err}`)
	}
}

console.log(`\n导入完成! 新增 ${imported} 篇文章`)
