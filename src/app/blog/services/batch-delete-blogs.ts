import { toast } from 'sonner'

export async function batchDeleteBlogs(slugs: string[]): Promise<void> {
	const uniqueSlugs = Array.from(new Set(slugs.filter(Boolean)))
	if (uniqueSlugs.length === 0) {
		throw new Error('需要至少选择一篇文章')
	}

	try {
		for (const slug of uniqueSlugs) {
			toast.info(`正在删除 ${slug}...`)
			const res = await fetch(`/api/blogs?slug=${encodeURIComponent(slug)}`, {
				method: 'DELETE'
			})
			if (!res.ok) {
				const err = await res.json()
				throw new Error(err.error || '删除失败')
			}
		}

		toast.success('删除成功！')
	} catch (error) {
		console.error('Batch delete error:', error)
		toast.error('删除失败')
		throw error
	}
}

