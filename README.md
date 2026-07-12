# CFB Viewing Guide

A Next.js college football **TV viewing guide** powered by the [College Football Data API](https://collegefootballdata.com). Games for a given week are laid out in an Action Network–style grid:

- **Rows** = broadcast networks (CBS, ESPN, FOX, …)
- **Columns** = kickoff time windows (Eastern)
- **Cells** = matchups with team logos

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **API key** — request a free key at [collegefootballdata.com/key](https://collegefootballdata.com/key), then:

   ```bash
   cp .env.example .env.local
   # edit .env.local and set CFBD_API_KEY
   ```

3. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). You’ll be redirected to the current (or latest) week.

## URL params

| Path | Description |
|------|-------------|
| `/` | Redirects to the default week for the season |
| `/week/2` | Week 2 of the default season year |
| `/week/2?year=2025` | Week 2 of the 2025 season |
| `/?week=5&year=2024` | Same via home redirect |

Default season year: current calendar year from August onward; otherwise the previous year.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- CFBD endpoints: `/games`, `/games/media`, `/teams`, `/calendar`

## Caching & free-tier budget (1,000 calls/month)

CFBD free tier is tight (~1k calls/month). This app is designed to almost never re-hit the API for the same data:

| Layer | What it does |
|-------|----------------|
| **React `cache()`** | Dedupes identical calls within a single request (e.g. calendar used by guide + week nav) |
| **In-memory TTL cache** | Process-local cache + in-flight coalescing (helps `next dev` a lot) |
| **Next.js Data Cache** | `fetch` with `force-cache` + `revalidate`, plus `unstable_cache` on the assembled guide |

| Endpoint | TTL |
|----------|-----|
| `/teams` | 7 days |
| `/calendar` | 24 hours |
| `/games`, `/games/media` (current/upcoming week) | 6 hours |
| `/games`, `/games/media` (past weeks / prior seasons) | 7 days |

**Practical cost:** first visit to a week ≈ 2–4 network calls; revisiting the same week (and shared teams/calendar) is served from cache. Browsing many weeks mostly spends quota on `/games` + `/games/media` only.

### Usage logging

Real network responses include `x-calllimit-remaining`. On each **network** call the server logs something like:

```text
[CFBD] NETWORK /games?year=2025&week=2&... status=200 120ms revalidate=21600s · monthly 8/1000 used (992 remaining, 1%) · process network calls=3
```

- **WARN** when remaining ≤ 150  
- **ERROR / CRITICAL** when remaining ≤ 50  
- Cache hits log only in development (`CACHE HIT`)

## Project layout

```
src/
  app/
    page.tsx              # redirects to /week/[week]
    week/[week]/page.tsx  # main guide
  components/
    ViewingGuideTable.tsx
    MatchupCard.tsx
    WeekNav.tsx
  lib/
    cfbd/                 # API client, cache, usage logging, grid builder
    networks.ts           # outlet normalization / order
    time.ts               # ET time buckets
```
