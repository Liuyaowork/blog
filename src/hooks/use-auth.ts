import { create } from 'zustand'

interface AuthStore {
	isAuth: boolean
	checkAuth: () => Promise<void>
	logout: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
	isAuth: false,

	checkAuth: async () => {
		try {
			const res = await fetch('/api/auth', { method: 'GET' })
			const data = await res.json()
			set({ isAuth: data.authenticated === true })
		} catch {
			set({ isAuth: false })
		}
	},

	logout: async () => {
		try {
			await fetch('/api/auth', { method: 'DELETE' })
			set({ isAuth: false })
		} catch {
			set({ isAuth: false })
		}
	}
}))

// 初始化时检查登录状态
useAuthStore.getState().checkAuth()
