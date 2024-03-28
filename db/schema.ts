import {
  index,
  integer,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core'
import { nanoid } from 'nanoid'

export const user = sqliteTable('user', {
  id: integer('id').primaryKey().notNull(),
  nanoId: text('nanoId').unique().$defaultFn(() => nanoid(21)).notNull(),
  name: text('name').notNull(),
  age: integer('age'),
}, table => ({
  nanoIdx: index('nano_idx').on(table.nanoId),
}))

export type UserEntity = typeof user.$inferSelect
export type NewUser = typeof user.$inferInsert

export const post = sqliteTable('post', {
  id: integer('id').primaryKey().unique(),
  nanoId: text('nanoId').unique().$defaultFn(() => nanoid(21)),
  title: text('title'),
  content: text('content'),
  userId: integer('userId').references(() => user.id, { onDelete: 'cascade' }).notNull(),
}, table => ({
  nanoIdx: index('nano_idx').on(table.nanoId),
}))

export type PostEntity = typeof post.$inferSelect
export type NewPost = typeof post.$inferInsert
