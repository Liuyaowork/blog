'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)
	const router = useRouter()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		setError('')

		try {
			const res = await fetch('/api/auth', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password })
			})

			const data = await res.json()

			if (!res.ok) {
				setError(data.error || '登录失败')
				return
			}

			router.push('/')
			router.refresh()
		} catch {
			setError('网络错误')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#d4e8f3] to-[#f7da3987]">
			<div className="w-full max-w-md rounded-2xl bg-white/80 p-8 shadow-xl backdrop-blur-sm">
				<div className="mb-8 text-center">
					<h1 className="text-3xl font-bold text-[#5B423F]">YYsuni</h1>
					<p className="mt-2 text-[#8b7667]">管理后台登录</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-5">
					<div>
						<label className="mb-1 block text-sm font-medium text-[#5B423F]">用户名</label>
						<input
							type="text"
							value={username}
							onChange={e => setUsername(e.target.value)}
							className="w-full rounded-lg border border-[#ffffff] bg-white/60 px-4 py-2.5 text-[#5B423F] placeholder-[#8b7667]/50 outline-none transition-all focus:border-[#2fcbe7] focus:ring-2 focus:ring-[#2fcbe7]/20"
							placeholder="请输入用户名"
							required
							autoFocus
						/>
					</div>

					<div>
						<label className="mb-1 block text-sm font-medium text-[#5B423F]">密码</label>
						<input
							type="password"
							value={password}
							onChange={e => setPassword(e.target.value)}
							className="w-full rounded-lg border border-[#ffffff] bg-white/60 px-4 py-2.5 text-[#5B423F] placeholder-[#8b7667]/50 outline-none transition-all focus:border-[#2fcbe7] focus:ring-2 focus:ring-[#2fcbe7]/20"
							placeholder="请输入密码"
							required
						/>
					</div>

					{error && (
						<div className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-500">
							{error}
						</div>
					)}

					<button
						type="submit"
						disabled={loading}
						className="w-full rounded-lg bg-[#2fcbe7] px-4 py-2.5 font-medium text-white transition-all hover:bg-[#2fcbe7]/80 disabled:opacity-60"
					>
						{loading ? '登录中...' : '登录'}
					</button>
				</form>
			</div>
		</div>
	)
}
