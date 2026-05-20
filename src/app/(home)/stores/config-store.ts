import { create } from 'zustand'

export type SiteContent = {
	meta?: { title?: string; description?: string; username?: string }
	theme?: Record<string, string>
	backgroundColors?: string[]
	artImages?: Array<{ id: string; url: string }>
	currentArtImageId?: string
	backgroundImages?: Array<{ id: string; url: string }>
	currentBackgroundImageId?: string
	socialButtons?: Array<{ id: string; type: string; value: string; label: string; order: number }>
	clockShowSeconds?: boolean
	summaryInContent?: boolean
	isCachePem?: boolean
	hideEditButton?: boolean
	enableCategories?: boolean
	currentHatIndex?: number
	hatFlipped?: boolean
	enableChristmas?: boolean
	beian?: { text: string; link: string }
	[key: string]: any
}

export type CardStyles = Record<string, any>

interface ConfigStore {
	siteContent: SiteContent
	cardStyles: CardStyles
	regenerateKey: number
	configDialogOpen: boolean
	loading: boolean
	setSiteContent: (content: SiteContent) => void
	setCardStyles: (styles: CardStyles) => void
	resetSiteContent: () => void
	resetCardStyles: () => void
	regenerateBubbles: () => void
	setConfigDialogOpen: (open: boolean) => void
	loadConfig: () => Promise<void>
}

const defaultSiteContent: SiteContent = {
	meta: { title: 'YYsuni', description: '', username: 'Suni' },
	theme: {},
	backgroundColors: [],
	artImages: [],
	backgroundImages: [],
	socialButtons: [],
	clockShowSeconds: false,
	summaryInContent: false,
	isCachePem: false,
	hideEditButton: false,
	enableCategories: true,
	currentHatIndex: 3,
	hatFlipped: false,
	enableChristmas: false,
	beian: { text: '', link: '' }
}

export const useConfigStore = create<ConfigStore>((set, get) => ({
	siteContent: { ...defaultSiteContent },
	cardStyles: {},
	regenerateKey: 0,
	configDialogOpen: false,
	loading: true,

	setSiteContent: (content: SiteContent) => {
		set({ siteContent: content })
	},
	setCardStyles: (styles: CardStyles) => {
		set({ cardStyles: styles })
	},
	resetSiteContent: () => {
		set({ siteContent: { ...defaultSiteContent } })
	},
	resetCardStyles: () => {
		set({ cardStyles: {} })
	},
	regenerateBubbles: () => {
		set(state => ({ regenerateKey: state.regenerateKey + 1 }))
	},
	setConfigDialogOpen: (open: boolean) => {
		set({ configDialogOpen: open })
	},

	loadConfig: async () => {
		try {
			const res = await fetch('/api/config')
			if (res.ok) {
				const data = await res.json()
				set({
					siteContent: data.siteContent || { ...defaultSiteContent },
					cardStyles: data.cardStyles || {},
					loading: false
				})
			} else {
				set({ loading: false })
			}
		} catch {
			set({ loading: false })
		}
	}
}))

