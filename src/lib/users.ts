import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, wishlists } from "@/db/schema";
import { hashPassword } from "./auth";
import { defaultWishlistTitle } from "./wishlists";

/** Creates a User together with their (empty) Wishlist. */
export async function createUser(input: {
  username: string;
  displayName: string;
  password: string;
  isAdmin: boolean;
}) {
  const passwordHash = await hashPassword(input.password);
  return db.transaction((tx) => {
    const user = tx
      .insert(users)
      .values({
        username: input.username,
        displayName: input.displayName,
        passwordHash,
        isAdmin: input.isAdmin,
      })
      .returning()
      .get();
    const wishlist = tx
      .insert(wishlists)
      .values({ userId: user.id, title: defaultWishlistTitle(input.displayName) })
      .returning()
      .get();
    return { user, wishlist };
  });
}

export function usernameTaken(username: string) {
  return db.select({ id: users.id }).from(users).where(eq(users.username, username)).get() !== undefined;
}

