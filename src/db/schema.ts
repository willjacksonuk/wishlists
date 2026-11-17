import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const timestamp = (name: string) =>
  integer(name, { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('subsec') * 1000)`);

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
  createdAt: timestamp("created_at"),
});

export const wishlists = sqliteTable("wishlists", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  updatedAt: timestamp("updated_at"),
});

export const priorities = ["high", "medium", "low"] as const;
export type Priority = (typeof priorities)[number];

export const items = sqliteTable("items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  wishlistId: integer("wishlist_id")
    .notNull()
    .references(() => wishlists.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  brand: text("brand"),
  description: text("description"),
  url: text("url"),
  /** Price in pence, so "£" is only ever added when displaying. */
  pricePence: integer("price_pence"),
  discountCode: text("discount_code"),
  priority: text("priority", { enum: priorities }),
  /** Set when the User marks the Item as Received; null means still wanted. */
  receivedAt: integer("received_at", { mode: "timestamp_ms" }),
  createdAt: timestamp("created_at"),
});

export const sessions = sqliteTable("sessions", {
  /** SHA-256 of the token in the cookie, so a leaked database can't be used to log in. */
  id: text("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
});

export type User = typeof users.$inferSelect;
export type Wishlist = typeof wishlists.$inferSelect;
export type Item = typeof items.$inferSelect;
