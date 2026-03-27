import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Configure it in Vercel environment variables (Supabase connection string).",
  );
}

// Support SSL for Supabase and other hosted Postgres (required by Supabase)
const ssl = process.env.DATABASE_URL.includes("supabase.co") ||
            process.env.NODE_ENV === "production"
  ? { rejectUnauthorized: false }
  : false;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: ssl || undefined,
});

export const db = drizzle(pool, { schema });

export * from "./schema";
