import { and, asc, count, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { items, users, wishlists, type Item } from "@/db/schema";

/** High, then medium, then low, then no Priority; newest first within each. */
const itemOrder = [
  asc(sql`case ${items.priority} when 'high' then 0 when 'medium' then 1 when 'low' then 2 else 3 end`),
  desc(items.createdAt),
  desc(items.id),
];

/** Every Wishlist for the Directory, alphabetical by Display name, with its count of visible Items. */
export function directory() {
  return db
    .select({
      username: users.username,
      displayName: users.displayName,
      title: wishlists.title,
      itemCount: count(items.id),
    })
    .from(wishlists)
    .innerJoin(users, eq(users.id, wishlists.userId))
    .leftJoin(items, and(eq(items.wishlistId, wishlists.id), isNull(items.receivedAt)))
    .groupBy(wishlists.id)
    .orderBy(sql`${users.displayName} collate nocase`)
    .all();
}

export function wishlistByUsername(username: string) {
  return db
    .select({ wishlist: wishlists, user: users })
    .from(wishlists)
    .innerJoin(users, eq(users.id, wishlists.userId))
    .where(eq(users.username, username))
    .get();
}

export function wishlistForUser(userId: number) {
  return db.select().from(wishlists).where(eq(wishlists.userId, userId)).get();
}

/** Items Visitors can see: everything not marked Received. */
export function visibleItems(wishlistId: number): Item[] {
  return db
    .select()
    .from(items)
    .where(and(eq(items.wishlistId, wishlistId), isNull(items.receivedAt)))
    .orderBy(...itemOrder)
    .all();
}

/** All Items, split into wanted and Received, for the User managing their Wishlist. */
export function itemsForOwner(wishlistId: number) {
  const all = db.select().from(items).where(eq(items.wishlistId, wishlistId)).orderBy(...itemOrder).all();
  return {
    wanted: all.filter((item) => item.receivedAt === null),
    received: all
      .filter((item) => item.receivedAt !== null)
      .sort((a, b) => b.receivedAt!.getTime() - a.receivedAt!.getTime()),
  };
}

/** An Item, but only if it belongs to this Wishlist, so Users can't touch each other's Items. */
export function ownItem(wishlistId: number, itemId: number) {
  if (!Number.isInteger(itemId)) return undefined;
  return db
    .select()
    .from(items)
    .where(and(eq(items.id, itemId), eq(items.wishlistId, wishlistId)))
    .get();
}

/** Records that the Wishlist changed, for its "Last updated" footer. */
export function touchWishlist(wishlistId: number) {
  db.update(wishlists).set({ updatedAt: new Date() }).where(eq(wishlists.id, wishlistId)).run();
}

export const defaultWishlistTitle = (displayName: string) => `${displayName.split(/\s+/)[0]}'s wishlist`;
