# Deploying to Dokploy

This guide takes the wishlist from a GitHub branch to a live site on your Dokploy VPS. It takes about 15 minutes the first time. After that, deploying is just pushing to the branch.

Dokploy's screens change between versions, so a button may be named slightly differently from what's written here. Each step says what you're trying to do, so you can find the equivalent.

## What you need

- Dokploy running on your VPS, which you already have.
- The repo on GitHub, with the code on the `sqlite-backend` branch (or `main` once it's merged).
- Access to DNS for `willjackson.uk`.

## 1. Point the domain at the VPS

In your DNS provider, create or update an **A record**:

| Name | Value |
| --- | --- |
| `wishlist` | your VPS's IPv4 address |

If the old static site is still served from somewhere else (e.g. Cloudflare Pages), this change replaces it. If your DNS is on Cloudflare, set the record to **DNS only** (grey cloud) until the HTTPS certificate has been issued in step 5, then you can turn the proxy back on.

## 2. Let Dokploy read the repo

The repo is private, so Dokploy needs permission to clone it. If you haven't connected GitHub to Dokploy before:

1. In Dokploy, go to **Settings → Git** (sometimes **Git Providers**).
2. Choose **GitHub** and follow the prompts to create and install the Dokploy GitHub App.
3. When GitHub asks which repositories to allow, choose `wishlist.willjackson.uk`.

If you'd rather not use the GitHub App, you can use the **Git** provider with an SSH URL and add Dokploy's SSH key as a read-only deploy key on the repo instead.

## 3. Create the Compose service

The repo's `docker-compose.yml` builds the Dockerfile and attaches a named volume, `wishlist-data`, at `/data`. That volume is where the SQLite database lives, and it survives every redeploy, so there's no volume to set up by hand.

1. Open a project in Dokploy (or create one, e.g. "Personal").
2. **Create Service → Compose**. Name it `wishlist`. If it asks for a compose type, choose **Docker Compose** (not Stack).
3. In the service's **General** tab, under the source/provider section:
   - **Provider:** GitHub
   - **Repository:** `wishlist.willjackson.uk`
   - **Branch:** `sqlite-backend`
   - **Compose path:** `./docker-compose.yml`
4. Save.

### Environment variables

You don't need any. The Dockerfile already sets `DATABASE_PATH=/data/wishlist.db`, `HOST=0.0.0.0`, `PORT=4321` and `NODE_ENV=production`.

The one optional setting is `SITE_HOSTNAME`, which defaults to `wishlist.willjackson.uk`. Only set it (in the service's **Environment** tab, as `SITE_HOSTNAME=your.domain`) if you deploy on a different domain. If it doesn't match the real domain, logging in and saving forms fail with a 403.

## 4. Add the domain

1. Go to the service's **Domains** tab and **Add domain**:
   - **Service name:** `wishlist`
   - **Host:** `wishlist.willjackson.uk`
   - **Path:** `/`
   - **Container port:** `4321`
   - **HTTPS:** on
   - **Certificate:** Let's Encrypt
2. Save.

## 5. Deploy

Click **Deploy** and open the **Deployments** tab to watch the log. The build installs packages, runs `astro build`, and starts the server. It should finish in a few minutes.

When it's done, the **Logs** tab should show the server listening on port 4321. Database migrations run automatically every time the server starts.

Visit `https://wishlist.willjackson.uk`. You should see an empty Directory page saying "No wishlists yet."

## 6. Create your admin account and import the old items

This only needs doing once, ever.

1. In the service, open the **Terminal** for the `wishlist` container (sometimes under **Logs → Terminal** or the ⋯ menu). Pick `sh` if it asks for a shell.
2. Run:

   ```sh
   node scripts/import-legacy.mjs --username will --display-name "Will Jackson"
   ```

3. It prints a temporary password. Copy it.
4. Go to `https://wishlist.willjackson.uk/login`, log in as `will` with that password, and change it straight away in **Manage → Settings**.

The script refuses to run if any users already exist, so running it twice by accident is harmless.

From now on, create other people from **Users** in the header. Each new user gets a temporary password to send them.

## 7. Turn on automatic deploys (optional)

In the service's **General** tab, turn on **Autodeploy**. With the GitHub App, every push to the `sqlite-backend` branch then redeploys the site. Your data is safe across deploys because it lives in the `wishlist-data` volume.

When you merge the branch into `main`, change the service's **Branch** to `main`.

## Checking it's healthy

- **Logs tab:** errors from the server show up here.
- **The database file:** in the Docker Terminal, `ls -la /data` should show `wishlist.db` (plus `-wal` and `-shm` files while it's running).

## Troubleshooting

**Logging in or saving a form gives "Forbidden" (403).**
Astro rejects form posts whose origin doesn't match the site. Check the domain in Dokploy exactly matches `SITE_HOSTNAME` (default `wishlist.willjackson.uk`) and that you're using `https://`. If you changed `SITE_HOSTNAME`, redeploy, because it's read at build time.

**All the wishlists vanished after a redeploy.**
Docker Compose names the volume after the Dokploy service, so this happens if the service was deleted and recreated, or deleted with its volumes. Keep the same service and don't tick any "delete volumes" option. If it's already happened, run the import script again; anything else is gone.

**The site shows a Bad Gateway / 502.**
Usually the domain's service name isn't `wishlist` or its container port isn't `4321`, or the server crashed on start-up. Check the **Logs** tab.

**The HTTPS certificate isn't issued.**
The DNS record from step 1 hasn't reached the VPS yet, or Cloudflare's proxy is on. Wait a few minutes, make sure the record is DNS-only, then save the domain again to retry.

**Someone forgot their password.**
Log in as an admin, go to **Users → Edit → Reset password**, and send them the new temporary password.

## Backups

Backups aren't set up yet. Everything lives in the single `wishlist.db` file in the `wishlist-data` volume. Until backups are set up, losing the VPS or the volume loses every wishlist.
