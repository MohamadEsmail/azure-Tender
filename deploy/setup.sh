#!/usr/bin/env bash
#
# One-shot VPS setup for the Azure Creative Platform.
# Run as root, from inside the cloned repo, AFTER creating .env.local:
#
#     sudo bash deploy/setup.sh your-domain.com
#
# It installs Node/PM2/nginx, builds the app, starts it under PM2, configures
# nginx, and installs the worker cron. TLS (certbot) is printed as the final
# manual step, because it needs your DNS to already point at this server.
set -euo pipefail

DOMAIN="${1:-}"
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"

log() { echo -e "\n\033[1;34m==> $1\033[0m"; }

if [[ $EUID -ne 0 ]]; then
  echo "Please run with sudo:  sudo bash deploy/setup.sh <domain>" >&2
  exit 1
fi
if [[ ! -f "$APP_DIR/.env.local" ]]; then
  echo "Missing $APP_DIR/.env.local — create it first (cp .env.example .env.local && edit)." >&2
  exit 1
fi

log "Installing system packages (Node 22, git, nginx, certbot)"
if ! command -v node >/dev/null || [[ "$(node -v | cut -dv -f2 | cut -d. -f1)" -lt 22 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
apt-get install -y build-essential git nginx certbot python3-certbot-nginx
command -v pm2 >/dev/null || npm install -g pm2

log "Installing dependencies and building"
npm ci
npm run build

log "Starting the app under PM2"
pm2 delete azure-platform >/dev/null 2>&1 || true
pm2 start npm --name azure-platform --cwd "$APP_DIR" -- start
pm2 save
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true

log "Configuring nginx"
NGINX_FILE=/etc/nginx/sites-available/azure-platform
sed "s/your-domain.com/${DOMAIN:-_}/g" "$APP_DIR/deploy/nginx.conf.example" > "$NGINX_FILE"
ln -sf "$NGINX_FILE" /etc/nginx/sites-enabled/azure-platform
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

log "Installing the worker cron (every minute)"
chmod +x "$APP_DIR/deploy/worker-cron.sh"
CRON_LINE="* * * * * APP_DIR=$APP_DIR $APP_DIR/deploy/worker-cron.sh >> /var/log/azure-worker.log 2>&1"
( crontab -l 2>/dev/null | grep -v 'deploy/worker-cron.sh' ; echo "$CRON_LINE" ) | crontab -

log "Done."
echo "The app is running on http://127.0.0.1:3000 (behind nginx)."
if [[ -n "$DOMAIN" ]]; then
  echo ""
  echo "Final step — enable HTTPS once your domain points at this server's IP:"
  echo "    sudo certbot --nginx -d $DOMAIN"
else
  echo ""
  echo "No domain given. Re-run with your domain, or open http://<server-ip> after"
  echo "allowing port 80. HTTPS needs a domain: sudo certbot --nginx -d <domain>"
fi
