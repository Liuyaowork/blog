import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

/** 管理员用户表 */
export const users = sqliteTable('users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	createdAt: text('created_at').notNull().default('current_timestamp')
})

/** 博客文章元数据表 */
export const blogs = sqliteTable('blogs', {
	slug: text('slug').primaryKey(),
	title: text('title').notNull(),
	summary: text('summary').default(''),
	tags: text('tags').default('[]'), // JSON array stored as string
	date: text('date').notNull(),
	category: text('category').default(''),
	cover: text('cover').default(''),
	hidden: integer('hidden', { mode: 'boolean' }).default(false),
	createdAt: text('created_at').notNull().default('current_timestamp'),
	updatedAt: text('updated_at').notNull().default('current_timestamp')
})

/** 点赞记录表 */
export const likes = sqliteTable('likes', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	slug: text('slug').notNull(),
	ip: text('ip').default(''),
	createdAt: text('created_at').notNull().default('current_timestamp')
})

/** Session 会话表 */
export const sessions = sqliteTable('sessions', {
	id: text('id').primaryKey(), // uuid
	userId: integer('user_id').notNull().references(() => users.id),
	createdAt: text('created_at').notNull().default('current_timestamp'),
	expiresAt: text('expires_at').notNull()
})
