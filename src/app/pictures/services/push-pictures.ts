import type { ImageItem } from '../../projects/components/image-upload-dialog'
import { toast } from 'sonner'
import type { Picture } from '../page'

export type PushPicturesParams = {
	pictures: Picture[]
	imageItems?: Map<string, ImageItem>
}

export async function pushPictures(params: PushPicturesParams): Promise<void> {
	const { pictures, imageItems } = params

	toast.info('正在上传图片...')
	let updatedPictures = [...pictures]

	if (imageItems && imageItems.size > 0) {
		for (const [key, imageItem] of imageItems.entries()) {
			if (imageItem.type === 'file') {
				const formData = new FormData()
				formData.append('file', imageItem.file)
				formData.append('subDir', 'pictures')

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

				const [groupId, indexStr] = key.split('::')
				const imageIndex = Number(indexStr) || 0

				updatedPictures = updatedPictures.map(p => {
					if (p.id !== groupId) return p
					const currentImages = p.images && p.images.length > 0 ? p.images : p.image ? [p.image] : []
					const nextImages = currentImages.map((img, idx) => (idx === imageIndex ? publicPath : img))
					return { ...p, image: undefined, images: nextImages }
				})
			}
		}
	}

	toast.info('正在保存图床列表...')
	const saveRes = await fetch('/api/save-list', {
		method: 'POST',
		credentials: 'include',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ file: 'pictures/list.json', data: updatedPictures })
	})

	if (!saveRes.ok) {
		const errText = await saveRes.text()
		let errMsg: string
		try { errMsg = JSON.parse(errText).error || '保存失败' } catch { errMsg = errText || '保存失败' }
		throw new Error(errMsg)
	}

	toast.success('保存成功！')
}
