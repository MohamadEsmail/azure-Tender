# DEPLOYMENT.md — Running the platform on a VPS

This guide deploys the Azure Creative Platform to a plain Linux VPS (Ubuntu
22.04 / 24.04). The VPS runs everything the app needs: the Next.js server, the
background worker, and (optionally) headless Chromium for PDF export. **Supabase
stays in the cloud** and holds the database, auth, and file storage — the VPS
only runs the application.

```
Internet ──HTTPS──▶ Nginx (:443) ──▶ Next.js (PM2, :3000) ──▶ Supabase cloud
                                          ▲                     (Postgres, Auth,
                          cron ──every min─┘  /api/worker/run    Storage, RLS)
                                             (extraction, image gen, decks)
```

You never expose port 3000 publicly — Nginx terminates TLS and proxies to it.

---

## 0. Prerequisites

- A VPS with a public IP, and a domain name pointed at it (an `A` record).
- SSH access as a sudo-capable user (examples below assume user `azure`).
- Your three secrets ready:
  - `SUPABASE_SERVICE_ROLE_KEY` — Supabase dashboard → Project Settings → API Keys → `service_role`
  - `ANTHROPIC_API_KEY` — console.anthropic.com
  - `HF_CREDENTIALS` — Higgsfield dashboard, in the form `KEY_ID:KEY_SECRET`
- The Supabase project is already provisioned (migrations `0001`–`0005` applied).
  If you ever recreate it, re-apply everything in `supabase/migrations/` in order.

---

## 1. Prepare the server

```bash
# Node.js 22 (NodeSource) + build tools + git + nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential git nginx

# PM2 process manager (keeps the app running, restarts on reboot)
sudo npm install -g pm2

node -v   # expect v22.x
```

---

## 2. Get the code and configure secrets

```bash
cd ~
git clone <your-repo-url> azure-Tender
cd azure-Tender
git checkout claude/ai-event-design-platform-0bh88p   # or main once merged

npm ci

# Create the env file (git-ignored). Start from the template:
cp .env.example .env.local
nano .env.local
```

Fill `.env.local` — the Supabase URL and anon key are already public/known; add
the three secrets and a worker secret:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://qybmhbputdkafqguaqmn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiI...        # anon key
SUPABASE_SERVICE_ROLE_KEY=...                               # secret
ANTHROPIC_API_KEY=sk-ant-...                                # secret
HF_CREDENTIALS=KEY_ID:KEY_SECRET                            # secret
DEFAULT_IMAGE_PROVIDER=higgsfield
WORKER_SECRET=<any long random string>                     # e.g. `openssl rand -hex 32`
NEXT_PUBLIC_APP_URL=https://your-domain.com                # your real domain
```

> `.env.local` is git-ignored, so secrets never get committed. Keep it readable
> only by your user: `chmod 600 .env.local`.

---

## 3. Build

```bash
npm run build
```

This compiles the production bundle. Re-run it after every code update.

---

## 4. Run under PM2

Edit `deploy/ecosystem.config.js` and set `cwd` to your clone path
(`/home/azure/azure-Tender`), then:

```bash
pm2 start deploy/ecosystem.config.js
pm2 save            # remember the process list
pm2 startup         # prints one command — run it, to relaunch on reboot
pm2 logs azure-platform   # tail logs; Ctrl+C to exit
```

The app now listens on `127.0.0.1:3000`.

---

## 5. Nginx + HTTPS

```bash
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/azure-platform
sudo nano /etc/nginx/sites-available/azure-platform   # set server_name to your domain
sudo ln -s /etc/nginx/sites-available/azure-platform /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Free TLS certificate + auto-renewal
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

Visit `https://your-domain.com` — you should see the sign-in page.

---

## 6. The background worker (cron)

The app kicks the worker itself after each upload/generation, but a once-a-minute
cron makes it reliable (it retries anything left queued):

```bash
chmod +x deploy/worker-cron.sh
crontab -e
```

Add (adjust the path if different):

```
* * * * * /home/azure/azure-Tender/deploy/worker-cron.sh >> /var/log/azure-worker.log 2>&1
```

The script reads `WORKER_SECRET` from `.env.local` and pings
`/api/worker/run`. Watch it with `tail -f /var/log/azure-worker.log`.

> Because the VPS runs a long-lived Node process, image generation (which can
> take minutes) has no request timeout to fight — unlike serverless hosts. This
> is why a VPS is the right home for this platform.

---

## 7. First run

1. In Supabase → Authentication → Users, confirm your admin user exists
   (`creative@azu.ae` is already an admin).
2. Open `https://your-domain.com`, sign in, create a project, upload a brief,
   and watch the extraction complete.
3. Walk the pipeline: Brief → Strategy → Moodboard → Visual DNA → Spaces →
   Presentation. Each stage has a human approval gate.

---

## 8. Updating the deployment

```bash
cd ~/azure-Tender
git pull
npm ci
npm run build
pm2 reload azure-platform     # zero-downtime restart
```

---

## 9. Optional — server-side PDF export

The presentation currently exports via the browser's print-to-PDF (works
everywhere, no server dependency). To add true server-side PDF rendering later
(Playwright + headless Chromium), install the browser and its system libraries:

```bash
npx playwright install --with-deps chromium
```

Then a `presentation_render` job can render the deck HTML to a PDF asset. The VPS
supports this; a shared/serverless host generally does not.

---

## 10. Optional — self-hosting Supabase

If you later want the database on your own VPS too (no cloud dependency),
Supabase is open-source and ships a Docker compose stack. Point the same three
`NEXT_PUBLIC_SUPABASE_URL` / keys at your self-hosted instance and re-apply
`supabase/migrations/`. No application code changes.

---

## 11. Security checklist

- [ ] `.env.local` is `chmod 600` and never committed (it is git-ignored).
- [ ] Only ports 80/443 (and SSH) are open; port 3000 is not exposed publicly.
- [ ] HTTPS is enforced (certbot redirects HTTP → HTTPS).
- [ ] `WORKER_SECRET` is long and random; it guards `/api/worker/run`.
- [ ] `service_role` key lives only in `.env.local` on the server — never in the
      browser, never in git, never in chat.
- [ ] Supabase RLS is on for every table (it is, via the migrations).

---

## 12. Troubleshooting

| Symptom | Check |
|---|---|
| 502 Bad Gateway | Is PM2 up? `pm2 status`, `pm2 logs azure-platform`. |
| Extraction never finishes | Is the worker running? `tail -f /var/log/azure-worker.log`; verify `ANTHROPIC_API_KEY`. |
| Images don't generate | `HF_CREDENTIALS` set correctly (`KEY_ID:KEY_SECRET`)? Check worker logs. |
| Upload fails on large files | Nginx `client_max_body_size` (60M in the example) and disk space. |
| "Missing required environment variable" | A key is absent from `.env.local`; add it and `pm2 reload`. |
| Login loops back to sign-in | `NEXT_PUBLIC_APP_URL` must match your real HTTPS domain. |
