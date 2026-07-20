#!/bin/bash
# Builds transfong-web.tar.gz for deployment with automatic cache-busting.
# Asset URLs in HTML get ?v=<git short hash>, so browsers fetch fresh CSS/JS/images
# after every release while still caching for 30 days between releases.
set -e
cd "$(dirname "$0")"

VERSION=$(git rev-parse --short HEAD)
STAGE=$(mktemp -d)
echo "Staging release $VERSION ..."

FILES="index.html ai-immersion.html ai-acceleration.html privacy.html fellowship.html internship.html tech-fellows.html styles.css immersion.css acceleration.css fellows.css script.js immersion.js acceleration.js fellows.js favicon.png"
cp $FILES "$STAGE/"
cp -R pictures competition "$STAGE/"

# Stamp version onto every local css/js/image reference in the HTML files
python3 - "$STAGE" "$VERSION" << 'PYEOF'
import re, sys, os
stage, version = sys.argv[1], sys.argv[2]
pat = re.compile(r'(href|src)="((?!https?://)[^"]+?\.(?:css|js|png|jpe?g|webp|svg))(\?[^"]*)?"')
for f in os.listdir(stage):
    if not f.endswith('.html'):
        continue
    p = os.path.join(stage, f)
    html = open(p, encoding='utf-8').read()
    html = pat.sub(lambda m: f'{m.group(1)}="{m.group(2)}?v={version}"', html)
    open(p, 'w', encoding='utf-8').write(html)
    print(f'  stamped {f}')
PYEOF

COPYFILE_DISABLE=1 tar --no-xattrs --no-mac-metadata -czf ~/Desktop/transfong-web.tar.gz -C "$STAGE" .
rm -rf "$STAGE"
echo "Bundle ready: ~/Desktop/transfong-web.tar.gz (release $VERSION)"
