import { toast } from 'sonner'
import type { ImageItem } from '../types'
import { formatDateTimeLocal } from '../stores/write-store'

export type PushBlogParams = {
	form: {
		slug: string
		title: string
		md: string
		tags: string[]
		date?: string
		summary?: string
		hidden?: boolean
		category?: string
	}
	cover?: ImageItem | null
	images?: ImageItem[]
	mode?: 'create' | 'edit'
	originalSlug?: string | null
}

async function uploadImage(file: File, slug: string): Promise<{ url: string; hash: string } | null> {
	try {
		const formData = new FormData()
		formData.append('file', file)
		formData.append('subDir', `blogs/${slug}`)

		const res = await fetch('/api/upload', {
			method: 'POST',
			body: formData
		})

		if (!res.ok) {
			const err = await res.json()
			toast.error(err.error || '上传失败')
			return null
		}

		const data = await res.json()
		return { url: data.url, hash: data.filename?.split('.')[0] || '' }
	} catch {
		toast.error('上传失败')
		return null
	}
}

export async function pushBlog(params: PushBlogParams): Promise<void> {
	const { form, cover, images, mode = 'create' } = params

	if (!form?.slug) throw new Error('需要 slug')

	toast.info('正在准备上传...')

	let finalMd = form.md
	let coverPath: string | undefined

	// Upload cover image
	if (cover?.type === 'file') {
		toast.info('正在上传封面...')
		const result = await uploadImage(cover.file, form.slug)
		if (result) {
			coverPath = result.url
		}
	} else if (cover?.type === 'url') {
		coverPath = cover.url
	}

	// Upload content images and replace placeholders
	if (images && images.length > 0) {
		toast.info('正在上传图片...')
		for (const img of images) {
			if (img.type !== 'file') continue

			const result = await uploadImage(img.file, form.slug)
			if (result) {
				const placeholder = `local-image:${img.id}`
				finalMd = finalMd.split(`(${placeholder})`).join(`(${result.url})`)
			}
		}
	}

	// Save blog via API
	toast.info('正在保存文章...')
	const res = await fetch('/api/blogs', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			slug: form.slug,
			title: form.title,
			md: finalMd,
			tags: form.tags,
			date: form.date || formatDateTimeLocal(),
			summary: form.summary,
			hidden: form.hidden,
			category: form.category,
			cover: coverPath,
			mode,
			originalSlug: params.originalSlug
		})
	})

	if (!res.ok) {
		const err = await res.json()
		throw new Error(err.error || '发布失败')
	}

	toast.success('发布成功！')
}
