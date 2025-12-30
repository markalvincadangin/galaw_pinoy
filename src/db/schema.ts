import { pgTable, uuid, text, timestamp, integer } from 'drizzle-orm/pg-core';

/**
 * Reflections table - replaces the old Firebase 'reflections' collection
 * Stores user reflections about their fitness and cultural experience
 */
// db/schema.ts
export const reflections = pgTable('reflections', {
    id: uuid('id').defaultRandom().primaryKey(),  // UUID primary key
    name: text('name').notNull(),                 // Student's name
    school: text('school').notNull(),             // School name
    year: text('year').notNull(),                 // Year level
    section: text('section').notNull(),           // Section/class
    content: text('content').notNull(),           // Reflection content
    createdAt: timestamp('created_at').defaultNow(), // Timestamp
});


/**
 * Users table - links to Supabase Auth
 * The id field matches auth.users.id from Supabase Auth
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  username: text('username').notNull().unique(),
  avatarUrl: text('avatar_url'),
  totalCalories: integer('total_calories').default(0).notNull(),
  gamesPlayed: integer('games_played').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Scores table - tracks game history
 */
export const scores = pgTable('scores', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  gameType: text('game_type').notNull(),
  score: integer('score').notNull(),
  playedAt: timestamp('played_at').defaultNow().notNull(),
});
