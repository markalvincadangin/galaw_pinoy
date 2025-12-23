import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Create the postgres connection
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL environment variable is not set. Please configure it in your .env.local file.'
  );
}

const client = postgres(connectionString);

// Create and export the Drizzle database instance
export const db = drizzle(client, { schema });

