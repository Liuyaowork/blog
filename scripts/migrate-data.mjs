/**
 * 数据迁移脚本：将 public/blogs/ 中的现有数据迁移到 data/ 目录和 SQLite 数据库
 * 
 * 运行方式：node scripts/migrate-data.mjs
 * 或者通过 Next.js 的 API 触发
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

const PUBLIC_BLOGS_DIR = path.join(rootDir, 'public', 'blogs')
const DATA_DIR = path.join(rootDir, 'data')

function migrateBlogs() {
	console.log('正在迁移博客数据...')

	if (!fs.existsSync(PUBLIC_BLOGS_DIR)) {
		console.log('未找到 public/blogs 目录，跳过迁移')
		return
	}

	const entries = fs.readdirSync(PUBLIC_BLOGS_DIR, { withFileTypes: true })
	const blogDirs = entries.filter(e => e.isDirectory()).map(e => e.name)

	console.log(`发现 ${blogDirs.length} 个博客目录`)

	// 复制每个博客目录
	for (const dir of blogDirs) {
		const srcDir = path.join(PUBLIC_BLOGS_DIR, dir)
		const destDir = path.join(DATA_DIR, 'blogs', dir)
		copyDirSync(srcDir, destDir)
		console.log(`  已迁移: ${dir}`)
	}

	// 复制 index.json
	const srcIndex = path.join(PUBLIC_BLOGS_DIR, 'index.json')
	const destIndex = path.join(DATA_DIR, 'blogs', 'index.json')
	if (fs.existsSync(srcIndex)) {
		fs.copyFileSync(srcIndex, destIndex)
		console.log('  已迁移: blogs/index.json')
	}

	console.log('博客数据迁移完成!')
}

function migrateImages() {
	console.log('正在迁移图片数据...')

	const PUBLIC_IMAGES_DIR = path.join(rootDir, 'public', 'images')
	if (!fs.existsSync(PUBLIC_IMAGES_DIR)) {
		console.log('未找到 public/images 目录，跳过迁移')
		return
	}

	const destDir = path.join(DATA_DIR, 'images')
	copyDirSync(PUBLIC_IMAGES_DIR, destDir)
	console.log('图片数据迁移完成!')
}

function migrateConfig() {
	console.log('正在迁移配置文件...')

	// 迁移 site-content.json
	const srcDir = path.join(rootDir, 'src', 'config')
	const srcSiteContent = path.join(srcDir, 'site-content.json')
	const destSiteContent = path.join(DATA_DIR, 'config', 'site-content.json')
	if (fs.existsSync(srcSiteContent)) {
		fs.copyFileSync(srcSiteContent, destSiteContent)
		console.log('  已迁移: config/site-content.json')
	}

	// 迁移 card-styles.json
	const srcCardStyles = path.join(srcDir, 'card-styles.json')
	const destCardStyles = path.join(DATA_DIR, 'config', 'card-styles.json')
	if (fs.existsSync(srcCardStyles)) {
		fs.copyFileSync(srcCardStyles, destCardStyles)
		console.log('  已迁移: config/card-styles.json')
	}

	console.log('配置文件迁移完成!')
}

function copyDirSync(src, dest) {
	if (!fs.existsSync(dest)) {
		fs.mkdirSync(dest, { recursive: true })
	}

	const entries = fs.readdirSync(src, { withFileTypes: true })
	for (const entry of entries) {
		const srcPath = path.join(src, entry.name)
		const destPath = path.join(dest, entry.name)

		if (entry.isDirectory()) {
			copyDirSync(srcPath, destPath)
		} else {
			fs.copyFileSync(srcPath, destPath)
		}
	}
}

// 确保 data 目录结构存在
if (!fs.existsSync(DATA_DIR)) {
	fs.mkdirSync(DATA_DIR, { recursive: true })
}
if (!fs.existsSync(path.join(DATA_DIR, 'blogs'))) {
	fs.mkdirSync(path.join(DATA_DIR, 'blogs'), { recursive: true })
}
if (!fs.existsSync(path.join(DATA_DIR, 'images'))) {
	fs.mkdirSync(path.join(DATA_DIR, 'images'), { recursive: true })
}
if (!fs.existsSync(path.join(DATA_DIR, 'config'))) {
	fs.mkdirSync(path.join(DATA_DIR, 'config'), { recursive: true })
}

// 执行迁移
migrateBlogs()
migrateImages()
migrateConfig()

console.log('')
console.log('所有数据迁移完成！')
console.log('请运行 pnpm dev 启动项目，然后访问 /api/init/status 检查是否需要初始化管理员账户。')
