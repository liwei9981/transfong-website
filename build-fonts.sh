#!/bin/bash
# Regenerates the self-hosted web fonts in fonts/ from the source .otf/.ttf files.
#
#   ./build-fonts.sh [SOURCE_DIR]      default source: ~/Desktop/Font
#
# Latin faces (Space Grotesk, Inter) are converted whole. Noto Sans SC is
# SUBSET, because the full CJK face is ~10 MB per weight: it keeps every
# Chinese character currently used on the site plus the 3,755 GB2312 level-1
# common characters, so new Chinese copy will not fall back to a system font.
# Re-run this after adding Chinese text that uses rare characters.
set -e
cd "$(dirname "$0")"
SRC="${1:-$HOME/Desktop/Font}"
OUT=fonts
mkdir -p "$OUT"

# --- 1. collect the CJK characters the site actually uses -------------------
python3 - "$OUT" <<'PY'
import os, sys
FILES = "index.html ai-immersion.html ningxia-immersion.html ai-acceleration.html privacy.html fellowship.html internship.html tech-fellows.html styles.css immersion.css acceleration.css fellows.css deck.css script.js immersion.js acceleration.js fellows.js deck.js".split()
RANGES = [(0x2E80,0x9FFF),(0x3000,0x303F),(0xFF00,0xFFEF),(0x4E00,0x9FFF)]
used = set()
for f in FILES:
    if os.path.exists(f):
        for ch in open(f, encoding='utf-8', errors='ignore').read():
            if any(a <= ord(ch) <= b for a,b in RANGES): used.add(ch)
common = set()
for hi in range(0xB0, 0xD8):            # GB2312 level 1 = 3,755 most common
    for lo in range(0xA1, 0xFF):
        try: common.add(bytes([hi,lo]).decode('gb2312'))
        except Exception: pass
extra = set('　、。〈〉《》「」『』【】〔〕！＂＃＄％＆＇（）＊＋，－．／：；＜＝＞？＠［＼］＾＿｀｛｜｝～·—…‘’“”')
chars = used | common | extra
open('/tmp/_cjk_subset.txt','w',encoding='utf-8').write(''.join(sorted(chars)))
print(f"  CJK subset: {len(used)} used on site + commons = {len(chars)} glyphs")
PY

# --- 2. Latin faces: straight woff2 conversion ------------------------------
for pair in "SpaceGrotesk-Regular.ttf" "SpaceGrotesk-Bold.ttf" "Inter-Regular.otf" "Inter-Bold.otf"; do
    base="${pair%.*}"
    python3 -m fontTools.subset "$SRC/$pair" \
        --unicodes='U+0000-00FF,U+0100-024F,U+0259,U+1E00-1EFF,U+2000-206F,U+2074,U+20A0-20BF,U+2122,U+2190-21BB,U+2212,U+2215,U+FEFF,U+FFFD' \
        --output-file="$OUT/$base.woff2" --flavor=woff2 \
        --layout-features='*' --no-hinting --desubroutinize --drop-tables+=DSIG >/dev/null
    printf "  %-28s %s\n" "$base.woff2" "$(ls -lh "$OUT/$base.woff2" | awk '{print $5}')"
done

# --- 3. Noto Sans SC: subset -----------------------------------------------
for pair in "NotoSansSC-Regular.ttf" "NotoSansSC-Bold.ttf"; do
    base="${pair%.*}"
    python3 -m fontTools.subset "$SRC/$pair" \
        --text-file=/tmp/_cjk_subset.txt \
        --output-file="$OUT/$base.woff2" --flavor=woff2 \
        --layout-features='' --no-hinting --desubroutinize \
        --drop-tables+=DSIG --name-IDs='' >/dev/null
    printf "  %-28s %s\n" "$base.woff2" "$(ls -lh "$OUT/$base.woff2" | awk '{print $5}')"
done
# --- 4. Noto Sans SC "UI" micro-subset -------------------------------------
# Chinese that renders even in English mode (the 中文 toggle + Chinese company
# names). Declared last in styles.css with a narrow unicode-range, so English
# visitors download ~4 KB instead of the ~520 KB main CJK face.
python3 - <<'PY2'
import re, os
PAGES = "index.html ai-immersion.html ningxia-immersion.html ai-acceleration.html privacy.html fellowship.html".split()
CJK = lambda ch: any(a<=ord(ch)<=b for a,b in [(0x2E80,0x9FFF),(0x3000,0x303F),(0xFF00,0xFFEF),(0x4E00,0x9FFF)])
always=set()
for f in PAGES:
    if not os.path.exists(f): continue
    s=open(f,encoding='utf-8').read()
    s=re.sub(r'data-zh="[^"]*"','',s)
    s=re.sub(r'<!--.*?-->','',s,flags=re.S)
    s=re.sub(r'<(script|style)\b.*?</\1>','',s,flags=re.S|re.I)
    s=re.sub(r'<[^>]+>','\n',s)
    always |= {c for c in s if CJK(c)}
always |= set('创士锋')
open('/tmp/_cjk_ui.txt','w',encoding='utf-8').write(''.join(sorted(always)))
rng = ','.join('U+%04X'%ord(c) for c in sorted(always))
open('/tmp/_cjk_ui_range.txt','w').write(rng)
print(f"  UI subset: {len(always)} always-visible glyphs")
PY2

for pair in "NotoSansSC-Regular.ttf" "NotoSansSC-Bold.ttf"; do
    base="UI-${pair%.*}"
    python3 -m fontTools.subset "$SRC/$pair" \
        --text-file=/tmp/_cjk_ui.txt \
        --output-file="$OUT/$base.woff2" --flavor=woff2 \
        --layout-features='' --no-hinting --desubroutinize \
        --drop-tables+=DSIG --name-IDs='' >/dev/null
    printf "  %-28s %s\n" "$base.woff2" "$(ls -lh "$OUT/$base.woff2" | awk '{print $5}')"
done
echo "  unicode-range for CSS written to /tmp/_cjk_ui_range.txt"
echo "Fonts written to $OUT/"
