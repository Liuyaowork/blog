import { NextRequest, NextResponse } from 'next/server'

// 需要登录才能访问的管理页面路由
const PROTECTED_ROUTES = [
	'/write',
	'/_write',
]

export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl

	// 检查是否是需要保护的路由
	const isProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route))

	if (isProtected) {
		const sessionId = request.cookies.get('session_id')?.value

		if (!sessionId) {
			const loginUrl = new URL('/login', request.url)
			loginUrl.searchParams.set('redirect', pathname)
			return NextResponse.redirect(loginUrl)
		}
	}

	return NextResponse.next()
}

export const config = {
	matcher: [
		'/write/:path*',
	]
}
