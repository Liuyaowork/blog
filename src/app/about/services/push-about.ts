import { toast } from 'sonner'

export type AboutData = {
	title: string
	description: string
	content: string
}

export async function pushAbout(data: AboutData): Promise<void> {
	toast.info('正在保存关于页面...')
	const saveRes = await fetch('/api/save-list', {
		method: 'POST',
		credentials: 'include',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ file: 'about/list.json', data })
	})

	if (!saveRes.ok) {
		const errText = await saveRes.text()
		let errMsg: string
		try { errMsg = JSON.parse(errText).error || '保存失败' } catch { errMsg = errText || '保存失败' }
		throw new Error(errMsg)
	}

	toast.success('保存成功！')
}

