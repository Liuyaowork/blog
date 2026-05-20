/**
 * Docker 容器启动初始化脚本
 * 在容器首次启动时执行数据迁移和初始化
 */
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const DATA_DIR = process.env.DATA_DIR || '/app/data'
const PUBLIC_DIR = '/app/public'

console.log('=== YYsuni Blog 初始化脚本 ===')
console.log(`数据目录: ${DATA_DIR}`)

// 检查 data 目录是否为空，如果是则从 public 迁移数据
const dataBlogsDir = path.join(DATA_DIR, 'blogs')
const dataConfigDir = path.join(DATA_DIR, 'config')
const dataImagesDir = path.join(DATA_DIR, 'images')

const needsMigration = !fs.existsSync(dataBlogsDir) || fs.readdirSync(dataBlogsDir).length === 0

if (needsMigration) {
	console.log('检测到 data 目录为空，正在从 public 迁移现有数据...')

	// 创建目录
	;[dataBlogsDir, dataConfigDir, dataImagesDir].forEach(dir => {
		if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
	})

	// 迁移博客数据
	const publicBlogsDir = path.join(PUBLIC_DIR, 'blogs')
	if (fs.existsSync(publicBlogsDir)) {
		copyDirSync(publicBlogsDir, dataBlogsDir)
		console.log('✅ 博客数据已迁移')
	}

	// 迁移图片数据
	const publicImagesDir = path.join(PUBLIC_DIR, 'images')
	if (fs.existsSync(publicImagesDir)) {
		copyDirSync(publicImagesDir, dataImagesDir)
		console.log('✅ 图片数据已迁移')
	}

	console.log('数据迁移完成!')
} else {
	console.log('data 目录已有数据，跳过迁移')
}

console.log('=== 启动 Next.js 服务器 ===')

// 启动 Next.js 服务
try {
	execSync('node server.js', { stdio: 'inherit', cwd: '/app' })
} catch (error) {
	console.error('启动失败:', error.message)
	process.exit(1)
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
