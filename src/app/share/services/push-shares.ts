import type { Share } from '../components/share-card'
import type { LogoItem } from '../components/logo-upload-dialog'
import { toast } from 'sonner'

export type PushSharesParams = {
	shares: Share[]
	logoItems?: Map<string, LogoItem>
}

export async function pushShares(params: PushSharesParams): Promise<void> {
	const { shares, logoItems } = params

	toast.info('正在上传图标...')
	let updatedShares = [...shares]

	if (logoItems && logoItems.size > 0) {
		for (const [url, logoItem] of logoItems.entries()) {
			if (logoItem.type === 'file') {
				const formData = new FormData()
				formData.append('file', logoItem.file)
				formData.append('subDir', 'share')

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

				updatedShares = updatedShares.map(s => (s.url === url ? { ...s, logo: publicPath } : s))
			}
		}
	}

	toast.info('正在保存分享列表...')
	const saveRes = await fetch('/api/save-list', {
		method: 'POST',
		credentials: 'include',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ file: 'share/list.json', data: updatedShares })
	})

	if (!saveRes.ok) {
		const errText = await saveRes.text()
		let errMsg: string
		try { errMsg = JSON.parse(errText).error || '保存失败' } catch { errMsg = errText || '保存失败' }
		throw new Error(errMsg)
	}

	toast.success('保存成功！')
}

