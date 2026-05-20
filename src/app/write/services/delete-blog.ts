import { toast } from 'sonner'

export async function deleteBlog(slug: string): Promise<void> {
	if (!slug) throw new Error('需要 slug')

	try {
		toast.info('正在删除文章...')

		const res = await fetch(`/api/blogs?slug=${encodeURIComponent(slug)}`, {
			method: 'DELETE'
		})

		if (!res.ok) {
			const err = await res.json()
			throw new Error(err.error || '删除失败')
		}

		toast.success('删除成功！')
	} catch (error) {
		console.error('Delete blog error:', error)
		toast.error('删除失败')
		throw error
	}
}
