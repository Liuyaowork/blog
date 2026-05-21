import type { Project } from '../components/project-card'
import type { ImageItem } from '../components/image-upload-dialog'
import { toast } from 'sonner'

export type PushProjectsParams = {
	projects: Project[]
	imageItems?: Map<string, ImageItem>
}

export async function pushProjects(params: PushProjectsParams): Promise<void> {
	const { projects, imageItems } = params

	toast.info('正在上传图片...')
	let updatedProjects = [...projects]

	if (imageItems && imageItems.size > 0) {
		for (const [url, imageItem] of imageItems.entries()) {
			if (imageItem.type === 'file') {
				const formData = new FormData()
				formData.append('file', imageItem.file)
				formData.append('subDir', 'project')

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

				updatedProjects = updatedProjects.map(p => (p.url === url ? { ...p, image: publicPath } : p))
			}
		}
	}

	toast.info('正在保存项目列表...')
	const saveRes = await fetch('/api/save-list', {
		method: 'POST',
		credentials: 'include',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ file: 'projects/list.json', data: updatedProjects })
	})

	if (!saveRes.ok) {
		const errText = await saveRes.text()
		let errMsg: string
		try { errMsg = JSON.parse(errText).error || '保存失败' } catch { errMsg = errText || '保存失败' }
		throw new Error(errMsg)
	}

	toast.success('保存成功！')
}

