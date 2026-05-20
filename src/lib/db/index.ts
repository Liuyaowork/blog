import Database from 'better-sqlite3'
import path from 'node:path'
import fs from 'node:fs'

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data')

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
	fs.mkdirSync(DATA_DIR, { recursive: true })
}

const DB_PATH = path.join(DATA_DIR, 'blog.db')

let _sqlite: Database.Database | null = null

function getDb(): Database.Database {
	if (!_sqlite) {
		_sqlite = new Database(DB_PATH)
		_sqlite.pragma('journal_mode = WAL')
		_sqlite.pragma('foreign_keys = ON')
		initDatabase()
	}
	return _sqlite
}

export const sqlite = new Proxy({} as Database.Database, {
	get(_target, prop) {
		const db = getDb()
		const value = (db as any)[prop]
		if (typeof value === 'function') {
			return value.bind(db)
		}
		return value
	}
})

export type DB = Database.Database

/** Get data directory path */
export function getDataDir(): string {
	return DATA_DIR
}

let _initialized = false

/** 创建所有表（如不存在） */
export function initDatabase(): void {
	if (_initialized) return
	_initialized = true

	const db = _sqlite || new Database(DB_PATH)
	db.pragma('journal_mode = WAL')
	db.pragma('foreign_keys = ON')

	db.exec(`
		CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			username TEXT NOT NULL UNIQUE,
			password_hash TEXT NOT NULL,
			created_at TEXT NOT NULL DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS blogs (
			slug TEXT PRIMARY KEY,
			title TEXT NOT NULL,
			summary TEXT DEFAULT '',
			tags TEXT DEFAULT '[]',
			date TEXT NOT NULL,
			category TEXT DEFAULT '',
			cover TEXT DEFAULT '',
			hidden INTEGER DEFAULT 0,
			created_at TEXT NOT NULL DEFAULT (datetime('now')),
			updated_at TEXT NOT NULL DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS likes (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			slug TEXT NOT NULL,
			ip TEXT DEFAULT '',
			created_at TEXT NOT NULL DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS sessions (
			id TEXT PRIMARY KEY,
			user_id INTEGER NOT NULL REFERENCES users(id),
			created_at TEXT NOT NULL DEFAULT (datetime('now')),
			expires_at TEXT NOT NULL
		);
	`)
}
