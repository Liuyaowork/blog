import { toast } from 'sonner'
import type { BlogIndexItem } from '@/lib/blog-index'

export async function saveBlogEdits(originalItems: BlogIndexItem[], nextItems: BlogIndexItem[], _categories: string[]): Promise<void> {
	const removedSlugs = originalItems.filter(item => !nextItems.some(next => next.slug === item.slug)).map(item => item.slug)
	const uniqueRemoved = Array.from(new Set(removedSlugs.filter(Boolean)))

	try {
		for (const slug of uniqueRemoved) {
			toast.info('正在删除 ' + slug + '...')
			const res = await fetch('/api/blogs?slug=' + encodeURIComponent(slug), { method: 'DELETE' })
			if (!res.ok) {
				throw new Error((await res.json()).error || '删除失败')
			}
		}

		for (const item of nextItems) {
			const res = await fetch('/api/blogs', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					slug: item.slug,
					title: item.title,
					tags: item.tags,
					date: item.date,
					summary: item.summary,
					cover: item.cover,
					hidden: item.hidden,
					category: item.category,
					md: ''
				})
			})
			if (!res.ok) {
				throw new Error((await res.json()).error || '更新失败')
			}
		}

		toast.success('保存成功！')
	} catch (error) {
		console.error('Save edits error:', error)
		toast.error('保存失败')
		throw error
	}
}
