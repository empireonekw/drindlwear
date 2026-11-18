#!/usr/bin/env bash
# One-time setup of dirndlwear.de on 13.140.168.178 (run as root, from the cloned repo). Safe to re-run.
#
#   git clone https://github.com/empireonekw/drindlwear.git /www/wwwroot/dirndlwear
#   bash /www/wwwroot/dirndlwear/scripts/server/setup.sh
#
# 1. Checks Node.js 20.19+ and PM2 (installs them if missing).
# 2. Uses the MongoDB that already runs on this server for sellpify (127.0.0.1:27017, login required, never
#    reachable from the internet) and gives this site its own login that can only use its own database.
# 3. Asks once for the MongoDB Atlas connection string, copies the whole database from Atlas (product photos too,
#    they are stored in the database) and checks every collection has the same number of documents.
#    Nothing is switched if they differ. The Atlas string is kept in .env.local.atlas for rollback.
# 4. Writes .env.local for the local database, builds the site and runs it as PM2 app `dirndlwear` on
#    127.0.0.1:4820.
# 5. Puts nginx in front for dirndlwear.de (Cloudflare connects on port 443, SSL/TLS mode "Full").
#    The old "coming soon" nginx config is backed up to /root/nginx-backup/. Other sites are left untouched.
set -euo pipefail

main() {

APP=dirndlwear
DOMAIN=dirndlwear.de
PORT=4820
APP_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="$APP_DIR/.env.local"
ADMIN_CREDS=/root/.mongodb-sellpify   # this server's MongoDB admin login (made by sellpify's mongo-local.sh)
CREDS=/root/.mongodb-dirndlwear
BACKUP_ROOT=/root/mongo-backup
MARK='written by drindlwear scripts/server/setup.sh'

say()  { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }
warn() { printf '\n\033[1;33m!!  %s\033[0m\n' "$*"; }
die()  { printf '\n\033[1;31mXX  %s\033[0m\n' "$*"; exit 1; }

[ "$(id -u)" = 0 ] || die "Please run this as root."
cd "$APP_DIR"
grep -q '"name": "dirndl-wear-storefront"' package.json 2>/dev/null || die "Run this from the Dirndl Wear code folder (got $APP_DIR)."
command -v apt-get >/dev/null 2>&1 || die "This script supports Ubuntu only."

umask 077
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# --------------------------------------------------------------- 1. tools
say "1/6 Tools"
DEBIAN_FRONTEND=noninteractive apt-get install -y git curl openssl ca-certificates >/dev/null
node_ok() {
  command -v node >/dev/null 2>&1 &&
    node -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a>20||(a===20&&b>=19)?0:1)'
}
if node_ok; then
  echo "Node.js $(node -v) already installed"
else
  echo "Installing Node.js 22"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null
  DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs >/dev/null
  hash -r
  node_ok || die "Node.js 20.19+ is required but $(node -v 2>/dev/null || echo 'none') is active."
fi
command -v pm2 >/dev/null 2>&1 || { echo "Installing PM2"; npm install -g pm2 >/dev/null; }

# --------------------------------------------------------------- 2. MongoDB on this server
say "2/6 MongoDB on this server"
command -v mongosh >/dev/null 2>&1 && command -v mongodump >/dev/null 2>&1 ||
  die "MongoDB is not installed here. Run sellpify's scripts/server/mongo-local.sh first (it installs MongoDB 8.0)."
[ -f "$ADMIN_CREDS" ] || die "$ADMIN_CREDS (the MongoDB admin password) is missing."
systemctl start mongod
mongosh --quiet --eval 'db.runCommand({ ping: 1 }).ok' mongodb://127.0.0.1:27017/admin 2>/dev/null | grep -q 1 ||
  die "MongoDB is not answering on 127.0.0.1:27017. See: systemctl status mongod"
ADMIN_PW=$(grep -m1 '^ADMIN_PW=' "$ADMIN_CREDS" | cut -d= -f2-)
[ -n "$ADMIN_PW" ] || die "No ADMIN_PW in $ADMIN_CREDS."
ADMIN_URI="mongodb://admin:$ADMIN_PW@127.0.0.1:27017/?authSource=admin"
echo "OK   MongoDB running on 127.0.0.1:27017"

CUR_URI=""
[ -f "$ENV_FILE" ] && CUR_URI=$(grep -m1 '^MONGODB_URI=' "$ENV_FILE" | cut -d= -f2- | tr -d "\r'\"" || true)
case "$CUR_URI" in *@127.0.0.1:27017/*) ALREADY_LOCAL=1 ;; *) ALREADY_LOCAL=0 ;; esac

if [ "$ALREADY_LOCAL" = 1 ]; then
  DB=$(printf '%s' "$CUR_URI" | sed -E 's#^mongodb://[^/]+/([^?]*).*#\1#')
  echo "OK   the site already uses the local database '$DB'"
else
  ATLAS_URI=""
  [ -f "$ENV_FILE.atlas" ] && ATLAS_URI=$(grep -m1 '^MONGODB_URI=' "$ENV_FILE.atlas" | cut -d= -f2- | tr -d "\r'\"" || true)
  [ -z "$ATLAS_URI" ] && ATLAS_URI="$CUR_URI"
  if [ -z "$ATLAS_URI" ]; then
    echo "Paste the MongoDB Atlas connection string (MONGODB_URI from your .env.local, mongodb+srv://...) and press Enter:"
    read -r ATLAS_URI </dev/tty
    ATLAS_URI=$(printf '%s' "$ATLAS_URI" | tr -d "\r'\"" | sed 's/^ *//; s/ *$//; s/^MONGODB_URI=//')
  fi
  case "$ATLAS_URI" in mongodb://*|mongodb+srv://*) ;; *) die "That is not a MongoDB connection string. Run this again." ;; esac
  printf '# Atlas database before the move to this server (%s)\nMONGODB_URI=%s\n' "$MARK" "$ATLAS_URI" > "$ENV_FILE.atlas"
  chmod 600 "$ENV_FILE.atlas"
  # Database name = the path of the URI (…mongodb.net/<name>?…); the app falls back to "dirndl-wear".
  DB=$(printf '%s' "$ATLAS_URI" | sed -E 's#^mongodb(\+srv)?://[^/]+/?([^?]*).*#\2#')
  DB_ARG=""
  if [ -z "$DB" ]; then DB=dirndl-wear; DB_ARG="--db=$DB"; fi

  # ------------------------------------------------------------- 3. copy from Atlas
  say "3/6 Copying database '$DB' from Atlas"
  U="$ATLAS_URI" mongosh --quiet --nodb --eval 'connect(process.env.U).runCommand({ ping: 1 }).ok' 2>"$TMP/err" | grep -q 1 || {
    sed 's/^/     /' "$TMP/err" | tail -3
    die "Cannot reach Atlas. In MongoDB Atlas > Network Access add this server's IP ($(curl -s --max-time 5 https://api.ipify.org || echo 13.140.168.178)), then run this again. Nothing was changed."
  }
  OUT="$BACKUP_ROOT/dirndlwear-atlas-$(date +%Y%m%d-%H%M%S)"
  mkdir -p "$OUT"
  printf "uri: '%s'\n" "$ATLAS_URI" > "$TMP/src.yaml"
  printf "uri: '%s'\n" "$ADMIN_URI" > "$TMP/dst.yaml"
  mongodump --config="$TMP/src.yaml" $DB_ARG --out="$OUT" --quiet || die "Could not read from Atlas. Nothing was changed."
  [ -d "$OUT/$DB" ] || die "Atlas has no database named '$DB'. Nothing was changed."
  mongorestore --config="$TMP/dst.yaml" --dir="$OUT" --nsInclude="$DB.*" --drop --quiet || die "Could not write the copy. Nothing was switched."
fi

# This site's own login: read/write on its database only.
[ -f "$CREDS" ] || printf '# MongoDB password for dirndlwear.de (%s)\nAPP_PW=%s\n' "$MARK" "$(openssl rand -hex 24)" > "$CREDS"
chmod 600 "$CREDS"
APP_PW=$(grep -m1 '^APP_PW=' "$CREDS" | cut -d= -f2-)
ADMIN_PW="$ADMIN_PW" APP_PW="$APP_PW" DB="$DB" APP="$APP" mongosh --quiet mongodb://127.0.0.1:27017/admin --eval '
  db.auth("admin", process.env.ADMIN_PW);
  const d = db.getSiblingDB(process.env.DB);
  const roles = [{ role: "readWrite", db: process.env.DB }, { role: "dbAdmin", db: process.env.DB }];
  if (d.getUser(process.env.APP)) d.updateUser(process.env.APP, { pwd: process.env.APP_PW, roles });
  else d.createUser({ user: process.env.APP, pwd: process.env.APP_PW, roles });' >/dev/null
LOCAL_URI="mongodb://$APP:$APP_PW@127.0.0.1:27017/$DB?authSource=$DB"
echo "OK   login '$APP' can read and write database '$DB' (password in $CREDS)"

if [ "$ALREADY_LOCAL" = 0 ]; then
  COUNT_JS='const d = connect(process.env.U);
    print(d.getCollectionNames().filter((c) => !c.startsWith("system.")).sort()
      .map((c) => c + "=" + d.getCollection(c).countDocuments()).join("\n"));'
  # Same database name on both sides (the Atlas URI may name it in its path or not).
  ATLAS_DB_URI=$(printf '%s' "$ATLAS_URI" | sed -E "s#^(mongodb(\+srv)?://[^/?]+)/?[^?]*#\1/$DB#")
  U="$ATLAS_DB_URI" mongosh --quiet --nodb --eval "$COUNT_JS" > "$TMP/atlas.txt"
  U="$LOCAL_URI" mongosh --quiet --nodb --eval "$COUNT_JS" > "$TMP/local.txt"
  if ! diff -q "$TMP/atlas.txt" "$TMP/local.txt" >/dev/null; then
    diff "$TMP/atlas.txt" "$TMP/local.txt" || true
    die "The copy does not match Atlas (above: Atlas < > local). Nothing was switched. Run this again."
  fi
  sed 's/^/     /' "$TMP/local.txt"
  echo "OK   all $(wc -l < "$TMP/local.txt") collections copied, same document counts as Atlas (copy kept in $OUT)"
fi

# --------------------------------------------------------------- 4. settings
say "4/6 Settings (.env.local)"
if [ -f "$ENV_FILE" ]; then
  cp -p "$ENV_FILE" "$ENV_FILE.bak-$(date +%Y%m%d-%H%M%S)"
  grep -v -E '^(MONGODB_URI|MONGODB_DB|TRUSTED_IP_HEADER)=' "$ENV_FILE" > "$TMP/env" || true
else
  printf '# %s production settings (%s)\n' "$DOMAIN" "$MARK" > "$TMP/env"
fi
grep -q '^AUTH_SECRET=.' "$TMP/env" ||
  printf '# Keyed hashes for rate limits. Keep it private; changing it resets the limits.\nAUTH_SECRET=%s\n' "$(openssl rand -base64 48 | tr -d '\n=' | tr '+/' '-_')" >> "$TMP/env"
{
  cat "$TMP/env"
  echo "MONGODB_URI=$LOCAL_URI"
  echo "# nginx sets X-Real-IP to the visitor's IP (from Cloudflare's CF-Connecting-IP)."
  echo "TRUSTED_IP_HEADER=x-real-ip"
} > "$ENV_FILE"
chmod 600 "$ENV_FILE"
echo "OK   $ENV_FILE points at the local database (Atlas string kept in $ENV_FILE.atlas)"

# --------------------------------------------------------------- 5. build + run
say "5/6 Building and starting (a few minutes)"
if ss -ltnH "sport = :$PORT" 2>/dev/null | grep -q . && ! pm2 describe "$APP" >/dev/null 2>&1; then
  die "Port $PORT is already used by another program."
fi
SKIP_PULL=1 bash scripts/deploy.sh
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || warn "Could not enable PM2 start-on-boot (run: pm2 startup)."
pm2 save >/dev/null

# --------------------------------------------------------------- 6. nginx
say "6/6 nginx for $DOMAIN"
command -v nginx >/dev/null 2>&1 || die "nginx is not installed."
NGINX=$(command -v nginx)
CONF_DIR=/etc/nginx/conf.d
CONF="$CONF_DIR/$DOMAIN.conf"
if [ -f "$CONF" ] && ! grep -q "$MARK" "$CONF"; then
  mkdir -p /root/nginx-backup
  cp -p "$CONF" "/root/nginx-backup/$DOMAIN.conf.$(date +%Y%m%d-%H%M%S)"
  echo "Old config (coming-soon page) backed up to /root/nginx-backup/"
fi
OWNER80=$(ss -ltnpH 'sport = :80' 2>/dev/null | grep -o '(("[^"]*"' | head -1 | tr -d '("' || true)
if [ -n "$OWNER80" ] && [ "$OWNER80" != nginx ]; then
  LISTEN="listen 443 ssl;"
  echo "Port 80 belongs to $OWNER80 (left untouched); nginx serves $DOMAIN on port 443"
else
  LISTEN="listen 80;
    listen 443 ssl;"
fi

# Certificate for the Cloudflare -> server hop (Cloudflare SSL/TLS mode "Full").
CERT_DIR=/etc/ssl/$APP
if [ ! -s "$CERT_DIR/fullchain.pem" ]; then
  mkdir -p "$CERT_DIR"
  openssl req -x509 -nodes -newkey rsa:2048 -days 3650 \
    -subj "/CN=$DOMAIN" -addext "subjectAltName=DNS:$DOMAIN,DNS:www.$DOMAIN" \
    -keyout "$CERT_DIR/privkey.pem" -out "$CERT_DIR/fullchain.pem" >/dev/null 2>&1
  chmod 600 "$CERT_DIR/privkey.pem"
fi

# Trust CF-Connecting-IP only from Cloudflare's own ranges, so nobody can fake their IP by calling the server directly.
CF_REALIP=""
for list in ips-v4 ips-v6; do
  for range in $(curl -fsS --max-time 10 "https://www.cloudflare.com/$list" 2>/dev/null); do
    CF_REALIP="$CF_REALIP    set_real_ip_from $range;
"
  done
done
[ -n "$CF_REALIP" ] || warn "Could not fetch Cloudflare's IP ranges; visitor IPs will be Cloudflare's until you re-run this script."

PROXY="        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr; # the real visitor IP (real_ip_header below), never client-supplied
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;"

cat > "$TMP/site.conf" <<EOF
# $DOMAIN -> Next.js on 127.0.0.1:$PORT ($MARK)

limit_req_zone \$binary_remote_addr zone=${APP}_api:10m rate=10r/s;
limit_req_zone \$binary_remote_addr zone=${APP}_pages:10m rate=10r/s;
limit_conn_zone \$binary_remote_addr zone=${APP}_conn:10m;

server {
    $LISTEN
    server_name www.$DOMAIN;
    ssl_certificate     $CERT_DIR/fullchain.pem;
    ssl_certificate_key $CERT_DIR/privkey.pem;
    return 301 https://$DOMAIN\$request_uri;
}

server {
    $LISTEN
    server_name $DOMAIN;
    ssl_certificate     $CERT_DIR/fullchain.pem;
    ssl_certificate_key $CERT_DIR/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_session_cache shared:${APP}_ssl:10m;
    ssl_session_timeout 1d;
    server_tokens off;

$CF_REALIP    real_ip_header CF-Connecting-IP;

    limit_req_status 429;
    limit_conn_status 429;
    limit_conn ${APP}_conn 60;

    client_max_body_size 12m; # admin photo uploads are 5 MB at most (lib/server/images.ts)

    # Build files and product photos: many per page, never limited.
    location ~ ^/(_next/(static|image)|api/images)/ {
$PROXY
    }

    # Live customer messages (Socket.IO, server.mjs): websocket upgrade, long-lived connections.
    location /socket.io/ {
        limit_req zone=${APP}_api burst=100 nodelay;
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 1h;
        proxy_send_timeout 1h;
        proxy_buffering off;
    }

    location /api/ {
        limit_req zone=${APP}_api burst=100 nodelay;
$PROXY
    }

    location / {
        limit_req zone=${APP}_pages burst=120 nodelay;
$PROXY
    }
}
EOF
[ -f "$CONF" ] && cp -p "$CONF" "$TMP/old.conf"
cat "$TMP/site.conf" > "$CONF"
chmod 644 "$CONF"
if ! "$NGINX" -t; then
  if [ -f "$TMP/old.conf" ]; then cat "$TMP/old.conf" > "$CONF"; else rm -f "$CONF"; fi
  die "nginx rejected the new config, so the old one was put back (other sites unaffected)."
fi
systemctl reload nginx 2>/dev/null || systemctl restart nginx || die "nginx did not start. See: journalctl -u nginx -n 30"

# --------------------------------------------------------------- checks
say "Checking"
problems=0
code=$(curl -sk -o /dev/null -w '%{http_code}' --resolve "$DOMAIN:443:127.0.0.1" "https://$DOMAIN/" || true)
if [ "$code" = 200 ]; then echo "OK   $DOMAIN answers through nginx on port 443"; else warn "HTTPS through nginx returned $code"; problems=1; fi
if curl -s -m 30 "http://127.0.0.1:$PORT/api/health" | grep -q '"status":"ok"'; then
  echo "OK   site connected to the local database"
else
  warn "Health check failed. See: pm2 logs $APP"; problems=1
fi
if [ -f /etc/cron.d/mongo-backup ]; then
  echo "OK   nightly MongoDB backup (02:30, /root/mongo-backup/) already covers database '$DB'"
else
  warn "No nightly MongoDB backup found (/etc/cron.d/mongo-backup)."
fi

echo
if [ "$problems" = 0 ]; then
  echo "dirndlwear.de is running on this server with its database on this server."
  echo "Next, in Cloudflare: A record @ -> 13.140.168.178 (orange cloud), CNAME www -> $DOMAIN, SSL/TLS mode Full."
else
  warn "Setup finished with the problems above."
fi
echo "Future updates:  cd $APP_DIR && bash scripts/deploy.sh"
echo "Logs:            pm2 logs $APP"
echo "Back to Atlas:   copy the MONGODB_URI line from $ENV_FILE.atlas into $ENV_FILE, then: pm2 restart $APP --update-env"
}

main "$@"
