import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { items } from "@/db/schema";
import { ownItem, touchWishlist, wishlistForUser } from "@/lib/wishlists";

/** Marks an Item as Received (received=1) or undoes it (received=0). */
export const POST: APIRoute = async ({ locals, params, request, redirect }) => {
  const wishlist = wishlistForUser(locals.user!.id)!;
  const item = ownItem(wishlist.id, Number(params.id));
  if (!item) return new Response("Item not found", { status: 404 });

  const form = await request.formData();
  const receivedAt = form.get("received") === "1" ? new Date() : null;
  db.update(items).set({ receivedAt }).where(eq(items.id, item.id)).run();
  touchWishlist(wishlist.id);
  return redirect("/manage");
};
