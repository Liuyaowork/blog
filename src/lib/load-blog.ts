import type { BlogConfig } from '@/app/blog/types'

export type { BlogConfig } from '@/app/blog/types'

export type LoadedBlog = {
	slug: string
	config: BlogConfig
	markdown: string
	cover?: string
}

/**
 * Load blog data via local API
 */
export async function loadBlog(slug: string): Promise<LoadedBlog> {
	if (!slug) {
		throw new Error('Slug is required')
	}

	const res = await fetch(`/api/blogs?slug=${encodeURIComponent(slug)}`)
	if (!res.ok) {
		throw new Error('Blog not found')
	}

	const data = await res.json()

	return {
		slug: data.slug,
		config: {
			title: data.title,
			tags: data.tags,
			date: data.date,
			summary: data.summary,
			cover: data.cover,
			hidden: data.hidden,
			category: data.category
		},
		markdown: data.markdown || '',
		cover: data.cover
	}
}
