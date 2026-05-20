import path from 'node:path'
import fs from 'node:fs'

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data')

export function getDataDir(): string {
	return DATA_DIR
}

export function getBlogsDir(): string {
	const dir = path.join(DATA_DIR, 'blogs')
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
	return dir
}

export function getImagesDir(): string {
	const dir = path.join(DATA_DIR, 'images')
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
	return dir
}

export function getConfigDir(): string {
	const dir = path.join(DATA_DIR, 'config')
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
	return dir
}

export function getBlogDir(slug: string): string {
	const dir = path.join(getBlogsDir(), slug)
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
	return dir
}

export function siteContentPath(): string {
	return path.join(getConfigDir(), 'site-content.json')
}

export function cardStylesPath(): string {
	return path.join(getConfigDir(), 'card-styles.json')
}

export function blogsIndexPath(): string {
	return path.join(getBlogsDir(), 'index.json')
}

export function blogMarkdownPath(slug: string): string {
	return path.join(getBlogDir(slug), 'index.md')
}

export function blogConfigPath(slug: string): string {
	return path.join(getBlogDir(slug), 'config.json')
}
