// One-off: creates the first Admin and imports the old static wishlist
// (scripts/legacy-wishlist.json) as their Wishlist. Prints a temporary password.
//
//   node scripts/import-legacy.mjs --username will --display-name "Will Jackson"
//
// Refuses to run if any Users already exist, so it can't be run twice by mistake.
import { hash } from "@node-rs/argon2";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { parseArgs } from "node:util";

const { values: args } = parseArgs({
  options: {
    username: { type: "string" },
    "display-name": { type: "string" },
  },
});
const username = args.username?.trim().toLowerCase();
const displayName = args["display-name"]?.trim();
if (!username || !displayName || !/^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/.test(username)) {
  console.error('Usage: node scripts/import-legacy.mjs --username will --display-name "Will Jackson"');
  process.exit(1);
}

const databasePath = resolve(process.env.DATABASE_PATH ?? "./data/wishlist.db");
mkdirSync(dirname(databasePath), { recursive: true });
const sqlite = new Database(databasePath);
sqlite.pragma("foreign_keys = ON");
migrate(drizzle(sqlite), { migrationsFolder: resolve(process.env.MIGRATIONS_PATH ?? "./drizzle") });

if (sqlite.prepare("select count(*) as n from users").get().n > 0) {
  console.error("There are already users in the database, so nothing was imported.");
  process.exit(1);
}

const legacy = JSON.parse(
  readFileSync(new URL("./legacy-wishlist.json", import.meta.url), "utf8"),
);

/** "£40.00" -> 4000 */
function toPence(price) {
  if (!price) return null;
  const match = /(\d+)(?:\.(\d{1,2}))?/.exec(price.replace(/,/g, ""));
  return match ? Number(match[1]) * 100 + Number((match[2] ?? "0").padEnd(2, "0")) : null;
}
const orNull = (value) => (value && String(value).trim()) || null;

const password = randomBytes(12).toString("base64url");
const passwordHash = await hash(password);

sqlite.transaction(() => {
  const userId = sqlite
    .prepare("insert into users (username, display_name, password_hash, is_admin) values (?, ?, ?, 1)")
    .run(username, displayName, passwordHash).lastInsertRowid;
  const wishlistId = sqlite
    .prepare("insert into wishlists (user_id, title, subtitle) values (?, ?, ?)")
    .run(userId, legacy.title, orNull(legacy.subtitle)).lastInsertRowid;
  const insertItem = sqlite.prepare(
    `insert into items (wishlist_id, title, brand, description, url, price_pence, discount_code, priority)
     values (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const item of legacy.items) {
    insertItem.run(
      wishlistId,
      item.title,
      orNull(item.brand),
      orNull(item.description),
      orNull(item.url),
      toPence(item.price),
      orNull(item.code),
      ["high", "medium", "low"].includes(item.priority) ? item.priority : null,
    );
  }
})();

console.log(`Imported ${legacy.items.length} items into ${username}'s wishlist.`);
console.log(`Log in as "${username}" with this temporary password, then change it in Settings:`);
console.log(`\n  ${password}\n`);
