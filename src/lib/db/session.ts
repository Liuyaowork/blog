import { sqlite } from './index'
import { v4 as uuidv4 } from 'uuid'

const SESSION_DURATION_DAYS = 7

export type SessionUser = {
	id: number
	username: string
}

export function createSession(userId: number): string {
	const id = uuidv4()
	const now = new Date()
	const expiresAt = new Date(now.getTime() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000)

	sqlite.prepare(
		'INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)'
	).run(id, userId, now.toISOString(), expiresAt.toISOString())

	return id
}

export function getSession(sessionId: string): SessionUser | null {
	if (!sessionId) return null

	const session = sqlite.prepare(`
		SELECT s.id, s.user_id as userId, s.expires_at as expiresAt, u.username
		FROM sessions s
		INNER JOIN users u ON s.user_id = u.id
		WHERE s.id = ?
	`).get(sessionId) as { id: string; userId: number; expiresAt: string; username: string } | undefined

	if (!session) return null

	const now = new Date()
	const expires = new Date(session.expiresAt)
	if (now > expires) {
		deleteSession(sessionId)
		return null
	}

	return { id: session.userId, username: session.username }
}

export function deleteSession(sessionId: string): void {
	sqlite.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId)
}

/** 清理过期 session */
export function cleanExpiredSessions(): void {
	sqlite.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')").run()
}

declare global {
	namespace globalThis {
		var __sessionCleanupInterval: ReturnType<typeof setInterval> | undefined
	}
}

/** 启动定期清理过期 session */
export function startSessionCleanup(): void {
	if (typeof globalThis.__sessionCleanupInterval !== 'undefined') return
	// 每小时清理一次
	globalThis.__sessionCleanupInterval = setInterval(cleanExpiredSessions, 60 * 60 * 1000)
}
