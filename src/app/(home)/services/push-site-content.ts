import { toast } from 'sonner'
import type { SiteContent, CardStyles } from '../stores/config-store'
import type { FileItem, ArtImageUploads, SocialButtonImageUploads, BackgroundImageUploads } from '../config-dialog/site-settings'

type ArtImageConfig = SiteContent['artImages'][number]
type BackgroundImageConfig = SiteContent['backgroundImages'][number]

async function uploadImage(file: File, subDir: string): Promise<string | null> {
	try {
		const formData = new FormData()
		formData.append('file', file)
		formData.append('subDir', subDir)

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
		return data.url
	} catch {
		toast.error('上传失败')
		return null
	}
}

export async function pushSiteContent(
	siteContent: SiteContent,
	cardStyles: CardStyles,
	faviconItem?: FileItem | null,
	avatarItem?: FileItem | null,
	artImageUploads?: ArtImageUploads,
	removedArtImages?: ArtImageConfig[],
	backgroundImageUploads?: BackgroundImageUploads,
	removedBackgroundImages?: BackgroundImageConfig[],
	socialButtonImageUploads?: SocialButtonImageUploads
): Promise<void> {
	toast.info('正在保存配置...')

	try {
		// Handle favicon upload
		if (faviconItem?.type === 'file') {
			toast.info('正在上传 Favicon...')
			await uploadImage(faviconItem.file, '.')
		}

		// Handle avatar upload
		if (avatarItem?.type === 'file') {
			toast.info('正在上传 Avatar...')
			await uploadImage(avatarItem.file, '.')
		}

		// Handle art images upload
		if (artImageUploads) {
			for (const [id, item] of Object.entries(artImageUploads)) {
				if (item.type !== 'file') continue
				toast.info(`正在上传 Art 图片 ${id}...`)
				await uploadImage(item.file, 'art')
			}
		}

		// Handle background images upload
		if (backgroundImageUploads) {
			for (const [id, item] of Object.entries(backgroundImageUploads)) {
				if (item.type !== 'file') continue
				toast.info(`正在上传背景图片 ${id}...`)
				await uploadImage(item.file, 'background')
			}
		}

		// Handle social button images upload
		if (socialButtonImageUploads) {
			for (const [buttonId, item] of Object.entries(socialButtonImageUploads)) {
				if (item.type !== 'file') continue
				toast.info(`正在上传社交按钮图片 ${buttonId}...`)
				await uploadImage(item.file, 'social-buttons')
			}
		}

		// Save config via API
		const res = await fetch('/api/config', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ siteContent, cardStyles })
		})

		if (!res.ok) {
			const err = await res.json()
			throw new Error(err.error || '保存失败')
		}

		toast.success('保存成功！')
	} catch (error) {
		console.error('Save config error:', error)
		toast.error('保存失败')
		throw error
	}
}
