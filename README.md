# GLOBAL

**Intelligence For Token Launches.**

A crypto launchpad designed like a classified intelligence platform operating global financial infrastructure. Not another pump.fun clone — every token is a **Mission**, every launch is an **authorised deployment**, every creator is an **Agent**.

## Pages

- **/** — Landing: classified-network hero + live global operations dashboard (world map, radar sweep, deployment feed)
- **/explore** — Mission database with search, theatre/quick filters, grid / table / analytics views
- **/missions/[slug]** — Mission Overview: price chart, funding progress, agent briefing, deployment parameters, mission timeline, top holders, intel feed
- **/launch** — 5-step deployment protocol: Choose Theatre → Mission Identity → Communications → Mission Parameters → Final Briefing
- **/command** — Command Centre: global metrics, deployment map, activity feed, regional heatmap
- **/leaderboard** — Top Operatives rankings
- **/docs** — Field Manual

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · Framer Motion · Recharts · TanStack Table · Lucide

## Run locally

```bash
npm install
npm run dev     # development — http://localhost:3000
npm run build && npm run start   # production
```

All market data is deterministic mock data (`src/lib/data.ts`) — no backend required.

## Design system

Dark mode only. Background `#050607`, panels `#11161D`/`#171D26`, primary `#A8FF35`, accent `#4DE3FF`. Inter for text, Geist Mono for the micro-detail layer (mission IDs, coordinates, clearance stamps, UTC clock). Background texture — graticule, flight paths, radar rings — stays under 5% opacity.
