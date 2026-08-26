#!/bin/bash
# One-command deploy of www.transfong.com — no tarball, no password prompts.
#
#   ./deploy.sh            deploy the current working tree to the live server
#   ./deploy.sh --dry-run  show exactly what would change, upload nothing
#
# Auth is the ~/.ssh/transfong_deploy key (set up once with ssh-copy-id).
# Only the files listed in build-bundle.sh are ever uploaded, so nothing else
# in this folder — PDFs, credentials, design files — can reach the server.
set -e
cd "$(dirname "$0")"

HOST=ubuntu@43.156.134.44
KEY=~/.ssh/transfong_deploy
WEBROOT=/var/www/transfong-web
STAGE="$PWD/.deploy-stage"
SSH="ssh -i $KEY -o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new"

DRY=""
[ "$1" = "--dry-run" ] && DRY="--dry-run" && echo "DRY RUN — nothing will be uploaded"

# --- 0. preflight: the key must work, or we stop before touching anything ----
if ! $SSH "$HOST" 'true' 2>/dev/null; then
    echo "ERROR: cannot log in to $HOST with $KEY"
    echo "Run this once (it will ask for the server password):"
    echo "  ssh-copy-id -i ${KEY}.pub $HOST"
    exit 1
fi
# The webroot is owned by www-data, so the sync runs through sudo on the server.
if ! $SSH "$HOST" 'sudo -n true' 2>/dev/null; then
    echo "ERROR: passwordless sudo is not available for $HOST — cannot write $WEBROOT"
    exit 1
fi

VERSION=$(git rev-parse --short HEAD)
# Check only the files that actually ship — read from build-bundle.sh's list, so a
# stray .html in a design-handoff folder never looks like a pending site change.
SITE_FILES=$(sed -n 's/^FILES="\(.*\)"$/\1/p' build-bundle.sh)
DIRTY=$(git status --porcelain -- $SITE_FILES pictures competition fonts 2>/dev/null | wc -l | tr -d ' ')
[ "$DIRTY" != "0" ] && echo "NOTE: $DIRTY uncommitted site file(s) — deploying the working tree, not the last commit"

# --- 1. stage: same file list and ?v= cache-busting as the tarball build -----
KEEP_STAGE=1 STAGE_DIR="$STAGE" ./build-bundle.sh >/dev/null
echo "Staged release $VERSION ($(find "$STAGE" -type f | wc -l | tr -d ' ') files)"

# --- 2. upload: only what changed, and delete what we removed ---------------
echo "Syncing to $HOST:$WEBROOT ..."
# -rlptz not -a: ownership is fixed up below instead of copied from this Mac.
# .well-known is certbot's HTTPS renewal challenge dir — --delete must never touch it.
rsync -rlptz --delete $DRY --itemize-changes \
      --rsync-path='sudo rsync' \
      --exclude '.DS_Store' --exclude '._*' --exclude '.well-known' \
      -e "$SSH" "$STAGE/" "$HOST:$WEBROOT/" | sed 's/^/  /'

if [ -n "$DRY" ]; then
    rm -rf "$STAGE"
    echo "Dry run complete — nothing was changed on the server."
    exit 0
fi

# nginx serves as www-data, so hand the files back to it after the root-owned sync.
# The ._* sweep clears macOS AppleDouble junk left by the old tar-extract deploys
# (rsync --delete skips them because they are excluded from the transfer above).
$SSH "$HOST" "sudo find $WEBROOT -name '._*' -delete; \
              sudo chown -R www-data:www-data $WEBROOT && sudo chmod -R a+rX $WEBROOT"

# --- 3. verify: prove the live site actually serves this release ------------
# (no nginx reload needed — these are static files, and nginx sends
#  Cache-Control: no-cache on HTML so browsers pick changes up immediately)
sleep 1
CODE=$(curl -s -o /dev/null -w '%{http_code}' https://www.transfong.com/)
LIVE=$(curl -s https://www.transfong.com/ | sed -n 's/.*styles\.css?v=\([a-f0-9]*\).*/\1/p' | head -1)
rm -rf "$STAGE"

echo ""
if [ "$CODE" = "200" ] && [ "$LIVE" = "$VERSION" ]; then
    echo "DEPLOYED — www.transfong.com is live on release $VERSION (HTTP $CODE)"
else
    echo "CHECK NEEDED — HTTP $CODE, live release stamp '$LIVE', expected '$VERSION'"
    exit 1
fi
