import { priorities, type Priority } from "@/db/schema";

/** Names that can't be Usernames because they're (or may become) app pages. */
const RESERVED_USERNAMES = new Set([
  "admin", "api", "assets", "login", "logout", "manage", "new", "settings",
  "static", "users", "wishlist", "wishlists",
]);

export function usernameError(username: string): string | null {
  if (!/^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/.test(username)) {
    return "Usernames are 1 to 32 lowercase letters, numbers and hyphens, and can't start or end with a hyphen.";
  }
  if (RESERVED_USERNAMES.has(username)) return `"${username}" is reserved. Please choose another.`;
  return null;
}

export const MIN_PASSWORD_LENGTH = 8;

export function passwordError(password: string): string | null {
  return password.length < MIN_PASSWORD_LENGTH
    ? `Passwords need at least ${MIN_PASSWORD_LENGTH} characters.`
    : null;
}

/** Text from a form field, trimmed, with empty strings as null. */
export function field(form: FormData, name: string): string | null {
  const value = form.get(name);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/** Turns "£40", "40.00" or "12.7" into pence. Returns undefined if it isn't a price. */
export function parsePrice(input: string | null): number | null | undefined {
  if (input === null) return null;
  const match = /^£?\s*(\d{1,7})(?:\.(\d{1,2}))?$/.exec(input.replace(/,/g, ""));
  if (!match) return undefined;
  return Number(match[1]) * 100 + Number((match[2] ?? "0").padEnd(2, "0"));
}

export const formatPrice = (pence: number) => `£${(pence / 100).toFixed(2)}`;

/** Price in pence as it appears in the edit form, without the "£". */
export const priceForInput = (pence: number | null) =>
  pence === null ? "" : (pence / 100).toFixed(2);

/** Only http(s) links are allowed, so a link can never run script. */
export function isWebUrl(input: string): boolean {
  try {
    const url = new URL(input);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export interface ItemInput {
  title: string;
  brand: string | null;
  description: string | null;
  url: string | null;
  pricePence: number | null;
  discountCode: string | null;
  priority: Priority | null;
}

export type ItemFormValues = Record<keyof ItemInput | "price", string>;

export function parseItemForm(
  form: FormData,
): { ok: true; item: ItemInput } | { ok: false; errors: Partial<Record<string, string>> } {
  const errors: Record<string, string> = {};

  const title = field(form, "title");
  if (!title) errors.title = "Every item needs a title.";

  const url = field(form, "url");
  if (url && !isWebUrl(url)) errors.url = "Links must start with https:// or http://.";

  const pricePence = parsePrice(field(form, "price"));
  if (pricePence === undefined) errors.price = "Prices look like 40 or 12.50.";

  const priorityValue = field(form, "priority");
  const priority = priorities.find((p) => p === priorityValue) ?? null;

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    item: {
      title: title!,
      brand: field(form, "brand"),
      description: field(form, "description"),
      url,
      pricePence: pricePence ?? null,
      discountCode: field(form, "discountCode"),
      priority,
    },
  };
}
