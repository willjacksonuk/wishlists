# Wishlist

A small site where each person keeps one public wishlist of gift ideas, and manages it after logging in.

## Language

### People

**User**:
A person with an account who can log in. Every User has exactly one Wishlist.
_Avoid_: Account, member, owner

**Username**:
The short, unique name a User logs in with, which is also the address of their Wishlist.
_Avoid_: Handle, login, slug

**Admin**:
A User who can also create, reset the password of, and delete other Users. New Users only exist because an Admin created them. Admins edit only their own Wishlist.
_Avoid_: Superuser, owner

**Visitor**:
Anyone viewing a Wishlist without logging in, typically someone choosing a gift.
_Avoid_: Guest, gift-giver, viewer

### Wishlists

**Wishlist**:
A User's public list of Items, with a title and subtitle. Anyone can view it without logging in.
_Avoid_: List, registry

**Directory**:
The site's home page, listing every Wishlist with a link to each.
_Avoid_: Index, homepage, all lists

**Item**:
One thing on a Wishlist: a title plus optional brand, description, link, price, discount code and Priority.
_Avoid_: Product, gift, entry

**Priority**:
How much the User wants an Item: high, medium or low.
_Avoid_: Importance, rank

**Discount code**:
A code a Visitor can use when buying the Item, shown on the Item.
_Avoid_: Promo, voucher

**Received**:
An Item the User has marked as already received. It is hidden from Visitors but the User can still see it and undo it, unlike a deleted Item, which is gone.
_Avoid_: Bought, claimed, purchased, archived
