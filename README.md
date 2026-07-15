# Transfong Website

Marketing website for **Transfong Ventures** — a Singapore-led, cross-border tech
business accelerator. Live at **https://www.transfong.com**.

This is a **static, multi-page site** (plain HTML/CSS/JS — no build step, no framework).
The repository is the source of truth; the live site is a copy of these files served by
Nginx on a Tencent Cloud server.

---

## Project structure

| Path | Purpose |
|------|---------|
| `index.html` | Home page (hero, about, services, team, contact) |
| `ai-acceleration.html` | AI Acceleration Programme |
| `ai-immersion.html` | AI Immersion Trip (Wuxi & Nanjing) |
| `privacy.html` | Privacy policy |
| `styles.css` | Global/shared styles (loaded on every page) |
| `immersion.css`, `acceleration.css` | Page-specific styles |
| `script.js` | Shared JS (language toggle, nav, animations) |
| `immersion.js`, `acceleration.js` | Page-specific JS |
| `favicon.png` | Site icon |
| `pictures/` | Images (subfolders: `gallery/`, `visits/`, `city photos/`) |
| `competition/` | Competition images (used by `ai-acceleration.html`) |

**Not part of the deployed site** (kept in the repo for reference only, never uploaded to
the server): the `*.md` notes, `*.pdf` decks, `Brand colors.png`, `Immersion Trip/`,
`.obsidian/`, and `vercel.json` (a leftover from the Vercel era — no longer used).

The site is **bilingual (EN / 中文)**: translatable elements carry `data-en` / `data-zh`
attributes and `script.js` swaps them based on a `data-lang` value saved in `localStorage`.

---

## Local preview

No tooling required — open the files directly, or run a simple static server:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000/index.html
```

---

## Hosting

**Current (since 2026-07-15):** self-hosted on a **Tencent Cloud Lightweight Application
Server** (Singapore region), running **Ubuntu + Nginx**, with HTTPS via a free
auto-renewing **Let's Encrypt** certificate. The same server also hosts the NIM AI Bot;
the website is served as a separate name-based Nginx virtual host, so the two coexist.

**Previous:** GitHub → **Vercel** (automatic deploy on every push to `main`).
Vercel is no longer used for production. See [Migration reference](#migration-reference-github--vercel--tencent-cloud) below.

> Deployment to the live site is **manual** — pushing to GitHub updates the code but does
> **not** update the live server. Follow the steps below to publish changes.

---

## How to update the live website

The workflow is: **edit locally → commit to GitHub → upload the files to the server.**

### 1. Edit and commit (source of truth)
```bash
# make your edits, then:
git add -A
git commit -m "describe your change"
git push origin main
```

### 2. Build a clean bundle (only the web files)
From the project root:
```bash
tar czf transfong-web.tar.gz \
  index.html ai-immersion.html ai-acceleration.html privacy.html \
  styles.css immersion.css acceleration.css \
  script.js immersion.js acceleration.js \
  favicon.png pictures competition
```

### 3. Upload to the server
```bash
scp transfong-web.tar.gz ubuntu@43.156.134.44:/tmp/
```

### 4. Publish on the server
```bash
ssh ubuntu@43.156.134.44

# replace the web root with the fresh copy
sudo rm -rf /var/www/transfong-web/*
sudo tar xzf /tmp/transfong-web.tar.gz -C /var/www/transfong-web
sudo chown -R www-data:www-data /var/www/transfong-web
```
Changes are live immediately — no Nginx restart needed for content updates.

### 5. Verify
```bash
curl -m 15 -I https://www.transfong.com   # expect HTTP/1.1 200 OK
```

> **Credentials** (SSH password / keys) are **not** stored in this repository. Keep them in
> a password manager or the private migration doc. Consider switching to **SSH key auth**
> so uploads don't require typing a password (and to enable CI auto-deploy later).

---

## Server configuration reference

| Item | Value |
|------|-------|
| Server IP | `43.156.134.44` (Tencent Cloud Lightweight, Singapore) |
| SSH user | `ubuntu` |
| Web root | `/var/www/transfong-web` |
| Nginx vhost | `/etc/nginx/sites-available/transfong` → symlinked into `sites-enabled/` |
| SSL | Let's Encrypt via `certbot --nginx` (auto-renews every ~90 days) |
| Domains | `transfong.com`, `www.transfong.com` |

**Nginx vhost** (`/etc/nginx/sites-available/transfong`) — note the `try_files` rule that
reproduces the clean URLs (`/ai-immersion` → `ai-immersion.html`) the site had on Vercel:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name transfong.com www.transfong.com;
    root /var/www/transfong-web;
    index index.html;

    gzip on;
    gzip_comp_level 5;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml application/xml text/javascript;

    # Clean URLs: /ai-immersion -> ai-immersion.html (matches old Vercel cleanUrls)
    location / {
        try_files $uri $uri.html $uri/ =404;
    }

    location ~* \.(?:css|js|png|jpe?g|webp|gif|ico|svg|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public";
    }
}
# (certbot adds the matching HTTPS server block on :443 automatically)
```

After editing the vhost: `sudo nginx -t && sudo systemctl reload nginx`.

---

## Migration reference: GitHub → Vercel → Tencent Cloud

Recorded 2026-07-15. Steps performed during the one-time migration:

1. **DNS (GoDaddy).** Pointed the domain at the server:
   - `A` record: `@` → `43.156.134.44`
   - `CNAME` record: `www` → `transfong.com`
   - Removed the old Vercel record.
2. **Files.** Uploaded the web bundle to `/var/www/transfong-web` (see steps above).
3. **Nginx.** Created the virtual host above; enabled it; `nginx -t`; reloaded.
4. **HTTPS.** Issued the certificate:
   ```bash
   sudo apt update && sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d transfong.com -d www.transfong.com --redirect --agree-tos -m contact@transfong.com
   ```
5. **Decommission.** Detached the domain from the Vercel project so it no longer serves the
   old copy.

### ⚠️ Gotcha — two firewalls
HTTPS timed out after the initial setup because **port 443 was blocked at the Tencent Cloud
console firewall**, even though the server's UFW allowed it. Traffic must pass **both**:

- **Tencent Cloud console firewall** — 轻量应用服务器 → instance → **防火墙** (or **安全组**
  for a CVM). Must allow inbound **TCP 80 and 443** from `0.0.0.0/0`.
- **UFW** (on the server) — `sudo ufw allow 80/tcp && sudo ufw allow 443/tcp`.

To diagnose from the server (bypasses external firewalls):
`curl -m 10 -kI https://127.0.0.1/ -H "Host: www.transfong.com"` — a `200` means Nginx is
fine and any remaining failure is a firewall.

---

## Possible future improvement

Deployment is currently manual. It can be automated with a **GitHub Actions** workflow that
`rsync`s the files to the server over SSH on every push to `main` (requires switching the
server to SSH key auth). Ask before setting this up if/when desired.
