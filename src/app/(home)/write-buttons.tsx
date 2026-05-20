import { ANIMATION_DELAY, CARD_SPACING } from '@/consts'
import PenSVG from '@/svgs/pen.svg'
import { LogIn } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState, useCallback } from 'react'
import { useConfigStore } from './stores/config-store'
import { useCenterStore } from '@/hooks/use-center'
import { useRouter } from 'next/navigation'
import { useSize } from '@/hooks/use-size'
import DotsSVG from '@/svgs/dots.svg'
import { HomeDraggableLayer } from './home-draggable-layer'
import { toast } from 'sonner'

export default function WriteButton() {
	const center = useCenterStore()
	const { cardStyles, setConfigDialogOpen, siteContent } = useConfigStore()
	const { maxSM } = useSize()
	const router = useRouter()
	const styles = cardStyles.writeButtons || {}
	const hiCardStyles = cardStyles.hiCard || {}
	const clockCardStyles = cardStyles.clockCard || {}

	const [show, setShow] = useState(false)
	const [isLoggedIn, setIsLoggedIn] = useState(false)

	// 检查登录状态
	const checkLoginStatus = useCallback(async () => {
		try {
			const res = await fetch('/api/auth', { method: 'GET' })
			const data = await res.json()
			setIsLoggedIn(data.authenticated === true)
		} catch {
			setIsLoggedIn(false)
		}
	}, [])

	// 退出登录
	const handleLogout = useCallback(async () => {
		try {
			await fetch('/api/auth', { method: 'DELETE' })
			setIsLoggedIn(false)
			toast.success('已退出登录')
			router.refresh()
		} catch {
			toast.error('退出失败')
		}
	}, [router])

	useEffect(() => {
		setTimeout(() => setShow(true), (styles.order || 1) * ANIMATION_DELAY * 1000)
		checkLoginStatus()
	}, [styles.order, checkLoginStatus])

	if (maxSM) return null

	if (!show) return null

	const x = styles.offsetX != null ? center.x + styles.offsetX : center.x + CARD_SPACING + (hiCardStyles.width || 400) / 2
	const y = styles.offsetY != null ? center.y + styles.offsetY : center.y - (clockCardStyles.offset || 0) - (styles.height || 40) - CARD_SPACING / 2 - (clockCardStyles.height || 100)

	return (
		<HomeDraggableLayer cardKey='writeButtons' x={x} y={y} width={styles.width} height={styles.height}>
			<motion.div initial={{ left: x, top: y }} animate={{ left: x, top: y }} className='absolute flex items-center gap-4'>
				<motion.button
					onClick={() => router.push('/write')}
					initial={{ opacity: 0, scale: 0.6 }}
					animate={{ opacity: 1, scale: 1 }}
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					style={{ boxShadow: 'inset 0 0 12px rgba(255, 255, 255, 0.4)' }}
					className='brand-btn whitespace-nowrap'>
					{siteContent.enableChristmas && (
						<>
							<img
								src='/images/christmas/snow-8.webp'
								alt='Christmas decoration'
								className='pointer-events-none absolute'
								style={{ width: 60, left: -2, top: -4, opacity: 0.95 }}
							/>
						</>
					)}

					<PenSVG />
					<span>写文章</span>
				</motion.button>

				{/* 登录/用户按钮 */}
				<motion.button
					initial={{ opacity: 0, scale: 0.6 }}
					animate={{ opacity: 1, scale: 1 }}
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					onClick={() => {
						if (isLoggedIn) {
							handleLogout()
						} else {
							router.push('/login')
						}
					}}
					style={{ boxShadow: 'inset 0 0 12px rgba(255, 255, 255, 0.4)' }}
					className={isLoggedIn ? 'rounded-xl border bg-white/60 px-3 py-2 text-sm backdrop-blur-sm transition-colors hover:bg-white/80' : 'brand-btn whitespace-nowrap'}>
					{isLoggedIn ? (
						<span>退出登录</span>
					) : (
						<><LogIn className="h-4 w-4" /><span>管理员登录</span></>
					)}
				</motion.button>

				<motion.button
					initial={{ opacity: 0, scale: 0.6 }}
					animate={{ opacity: 1, scale: 1 }}
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					onClick={() => setConfigDialogOpen(true)}
					className='p-2'>
					<DotsSVG className='h-6 w-6' />
				</motion.button>
			</motion.div>
		</HomeDraggableLayer>
	)
}
