import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import * as schema from "./schema";

const databasePath = resolve(process.env.DATABASE_PATH ?? "./data/wishlist.db");
mkdirSync(dirname(databasePath), { recursive: true });

const sqlite = new Database(databasePath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

// Bring the database up to date on start-up. Migrations live in ./drizzle,
// which must sit next to the server's working directory.
migrate(db, { migrationsFolder: resolve(process.env.MIGRATIONS_PATH ?? "./drizzle") });
