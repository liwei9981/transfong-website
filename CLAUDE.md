# CLAUDE.md — Transfong Website

Static bilingual marketing site (plain HTML/CSS/JS, no build step) for Transfong Ventures,
live at https://www.transfong.com. See README.md for structure, hosting, and deploy steps.

## Critical conventions

- **Bilingual toggle:** every visible text element carries `data-en` / `data-zh`; `script.js`
  swaps `textContent` on EN|中文 toggle. The swap REPLACES all text nodes of the element and
  destroys child elements — the ONLY preserved child is `<span class="title-red-dot">`.
  Never nest icons/spans inside a translated element; give each translated line its own span.
- **Names:** never invent Chinese translations for founder or company names. If no Chinese
  name exists in source material, keep the English form in `data-zh` too. On the internship
  page, founders are anonymized by policy: title + surname only (Dr. Yang), no photos.
- **Design tokens** (`styles.css :root`): navy #011B64, red #FF0006 (title dot), teal #00B1B0,
  purple #6779BD; fonts Plus Jakarta Sans / Noto Sans SC; 16px card radius.
  Section headers: `.section-label` pill + `.section-title` ending `<span class="title-red-dot">.</span>`.
  Recurring card-title pattern: icon chip left + colored two-line title (spans display:block).
- **Menu naming:** Competition (ai-acceleration.html), Immersion (ai-immersion.html),
  Internship (internship.html; old /tech-fellows is a redirect stub — keep it).

## Workflow rules

- **Deploy:** run `./build-bundle.sh` (stamps `?v=<git hash>` cache-busting on asset URLs),
  then scp/ssh per README. Only Li Wei can enter the server password. Always build from the
  MAIN folder after merging to main.
- **Worktrees:** after a session's branch merges to main, REMOVE its worktree
  (`git worktree remove .claude/worktrees/<name> && git branch -d <branch>`).
  Stale worktree copies have repeatedly misled other sessions.
- Non-web files in this folder (docs, decks, Logos/, handoff folders) stay untracked — do not
  add them to the deploy bundle or commit them unless asked.

## Content facts that override older copies

- Bootcamp: 2 weeks, 4–5 small-group online sessions (NOT 4 weeks).
- Startups supported: 200+ annually (NOT 800+).
- CAIEP partner name: 中国国际人才交流协会 / China Association for International Exchange of
  Personnel — no "中心", no Ministry affiliation shown.
