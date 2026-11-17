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

## Deploying

See [docs/deploying-to-dokploy.md](./docs/deploying-to-dokploy.md). In short: a Dokploy **Compose** service using `docker-compose.yml` (which keeps the database in a named volume), a domain on container port `4321`, then run `node scripts/import-legacy.mjs` once in the container to create the first admin.

Backups of `/data` aren't set up yet.
