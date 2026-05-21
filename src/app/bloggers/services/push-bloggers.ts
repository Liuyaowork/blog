import type { Blogger } from '../grid-view'
import type { AvatarItem } from '../components/avatar-upload-dialog'
import { toast } from 'sonner'

export type PushBloggersParams = {
	bloggers: Blogger[]
	avatarItems?: Map<string, AvatarItem>
}

export async function pushBloggers(params: PushBloggersParams): Promise<void> {
	const { bloggers, avatarItems } = params

	toast.info('正在上传头像...')
	let updatedBloggers = [...bloggers]

	if (avatarItems && avatarItems.size > 0) {
		for (const [url, avatarItem] of avatarItems.entries()) {
			if (avatarItem.type === 'file') {
				const formData = new FormData()
				formData.append('file', avatarItem.file)
				formData.append('subDir', 'blogger')

				const uploadRes = await fetch('/api/upload', {
					method: 'POST',
					credentials: 'include',
					body: formData
				})

				if (!uploadRes.ok) {
					const errText = await uploadRes.text()
					let errMsg: string
					try { errMsg = JSON.parse(errText).error || '上传失败' } catch { errMsg = errText || '上传失败' }
					throw new Error(errMsg)
				}

				const uploadData = await uploadRes.json()
				const publicPath = uploadData.url

				updatedBloggers = updatedBloggers.map(b => (b.url === url ? { ...b, avatar: publicPath } : b))
			}
		}
	}

	toast.info('正在保存博主列表...')
	const saveRes = await fetch('/api/save-list', {
		method: 'POST',
		credentials: 'include',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ file: 'bloggers/list.json', data: updatedBloggers })
	})

	if (!saveRes.ok) {
		const errText = await saveRes.text()
		let errMsg: string
		try { errMsg = JSON.parse(errText).error || '保存失败' } catch { errMsg = errText || '保存失败' }
		throw new Error(errMsg)
	}

	toast.success('保存成功！')
}
