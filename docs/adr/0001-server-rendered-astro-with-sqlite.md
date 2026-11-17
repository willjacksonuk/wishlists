# Server-rendered Astro with SQLite replaces Pages CMS

The wishlist was a static Astro build whose Items were JSON files edited through Pages CMS. To support Users, logins and per-User Wishlists, we keep the existing Astro repo (to preserve its look) and switch it to server rendering with the Node adapter, storing all data in a single SQLite file. It runs as one container on the existing Dokploy VPS, with the database on a persistent volume.

## Consequences

- Wishlist data no longer lives in git, so backups of the SQLite volume replace git history. Setting up those backups was deliberately deferred (2026-11-17).
- Pages CMS (`.pages.yml`) and the `src/content/` collections are removed after a one-off import of the existing Items.

## Considered Options

- Self-hosting an existing open-source wishlist app: rejected, since it would replace this site's design and codebase rather than extend them.
