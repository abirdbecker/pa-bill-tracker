---
name: review-bills
description: Triage the PA Bill Tracker review queue — bills that matched a keyword search but aren't yet curated. Use when the user asks to flag/review/approve bills, check the review queue, triage new bill matches, or clear bills awaiting approval.
---

# Review Bills

Triage `data/review-queue.json` — bills that matched a keyword search on palegis but
have no nickname/summary in `data/known-bills.json` yet, so they're hidden from the
public site until curated. For each, decide **approve** (it fits its issue) or
**hide** (false positive from full-text `AND` matching).

## How the gate works (context)

`scripts/build-data.js` only shows a matched bill publicly once it appears in
`known-bills.json` under `nicknames` or `descriptions`. Otherwise it routes to
`data/review-queue.json`. So your job is to move each queued bill into one of:
- **`nicknames` + `descriptions`** → bill becomes visible on the site, or
- **`hide`** → bill is suppressed (it false-matched).

## Steps

1. **Read the queue.** Open `data/review-queue.json`. If `count` is 0 or the file is
   missing, tell the user there's nothing to review and stop. Otherwise note each
   bill's `id`, `issues` (which issue it matched), `matchedKeywords`, `title`,
   `primeSponsor`, `status`, `firstSeen`, and `url`.

2. **Look up what each bill actually does.** The official `title` is often a dry
   "An Act amending..." that hides the real subject. Use WebFetch on the bill's `url`
   to get a plain-language summary, and judge it against the issue it matched. The
   common false positive is a long bill where the `AND` keyword terms appear in
   unrelated places (e.g. a chiropractic bill under AI, a sports-betting bill under
   "age verification"). Fetch bills in parallel when there are several.

3. **Recommend, then confirm.** Present a compact table: `id` · matched issue ·
   one-line "what it really does" · **recommendation** (Approve / Hide) · reason.
   For each Approve, draft a short `nickname` (a few words, plain language) and a
   2–3 sentence `description` (what it does, sponsor, how it relates to sibling
   bills — link companions like "Senate companion to HB1098"). Ask the user to
   confirm or adjust before writing anything.

4. **Apply decisions to `data/known-bills.json`** (keep JSON valid, match existing
   formatting/indentation):
   - **Approve:** add `"<id>": "<nickname>"` to `nicknames` and
     `"<id>": "<description>"` to `descriptions`.
   - **Hide:** append `"<id>"` to the `hide` array.
   - If a bill belongs in a different issue than the one it matched, optionally add
     `"<id>": "<Issue Name>"` to `categoryOverride`.

5. **Rebuild and verify.** Run `npm run build-data`. Confirm the approved bills now
   appear in `public/data/bills.json`, the hidden ones don't, and
   `data/review-queue.json` `count` dropped accordingly. The build prints a "⚠ N
   matched bill(s) awaiting review" summary — it should be empty (or only contain
   bills the user deferred).

6. **Offer to ship.** Ask before committing. If yes, commit `data/known-bills.json`,
   `public/data/bills.json`, and `data/review-queue.json` together and push to
   `main` (auto-deploys to Vercel). Use a message like
   `Review queue: approve <ids>, hide <ids>`.

## Notes

- The daily GitHub Action (`.github/workflows/daily-refresh.yml`) regenerates the
  queue every morning, so new matches accumulate there between runs of this skill.
- Don't invent bill summaries — base them on the fetched palegis page. If a fetch
  fails, say so and leave that bill in the queue rather than guessing.
- A bill can be deferred (left in the queue) if the user isn't sure — just don't add
  it to `nicknames`/`descriptions`/`hide`.
