# Wishlist — wishlist.willjackson.uk

A small wishlist site. Each User has one public Wishlist, and manages it after logging in. Admins create Users. See [CONTEXT.md](./CONTEXT.md) for the vocabulary and [docs/adr](./docs/adr) for the main decisions.

## Features

- Directory of every Wishlist on the home page, each Wishlist at `/{username}`
- Items with title, brand, description, link, price, discount code and priority, ordered high → low, newest first
- Mark Items as Received to hide them from Visitors (and undo it), or delete them
- Edit your Wishlist's title, subtitle, your display name and password at `/manage/settings`
- Admins create, reset and delete Users at `/admin/users`
- Light and dark themes

## Tech stack

- [Astro](https://astro.build/), server-rendered with the Node adapter
- SQLite via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) and [Drizzle ORM](https://orm.drizzle.team/)
- Argon2 password hashes, sessions stored in SQLite
- [Tailwind CSS v4](https://tailwindcss.com/) and [Starwind](https://starwind.dev/)

## Development

```sh
npm install
npm run import-legacy -- --username will --display-name "Will Jackson"   # first run only
npm run dev      # http://localhost:4321
```

The database lives at `./data/wishlist.db` (override with `DATABASE_PATH`). Migrations in `./drizzle` run automatically on start-up.

After changing `src/db/schema.ts`, run `npm run db:generate` and commit the new migration.

## Deploying with Dokploy

1. Create an Application from this repo with the **Dockerfile** build type.
2. Add a volume mount at `/data` so the database survives redeploys.
3. Set the domain to `wishlist.willjackson.uk`, container port `4321`. If you use a different domain, set the `SITE_HOSTNAME` build argument to it so form posts pass Astro's origin check behind the proxy.
4. Deploy, then open the container's terminal once and run:

   ```sh
   node scripts/import-legacy.mjs --username will --display-name "Will Jackson"
   ```

   It creates you as an Admin with the old wishlist's items and prints a temporary password. Change it in Settings after logging in. It refuses to run if any users exist.

Backups of `/data` aren't set up yet.
