# KEA Operations Intelligence

Field force, merchandising, geographic coverage, and workforce performance
intelligence platform for KEA operations.

**Live dashboard:** _(add your Vercel URL here after deploying)_

## Features

- 📊 Executive overview with KPIs, trend charts and workforce mix donut
- 🗺️ Live Nigerian map with role-colour-coded staff pins (VSR, Merchandiser, Supervisor, TSR)
- 👥 Workforce records with sort, filter, search, and pagination
- 🔍 Global filters: date range, region, role, client
- 📥 Power BI export (folder-of-CSVs, imported via _Home ▸ Get data ▸ Folder_)
- 🎨 Light and dark themes
- 📱 Fully responsive — desktop, tablet, mobile

## Tech stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Recharts (visualisations)
- React-Leaflet + CartoDB tiles (map)
- Lucide icons
- Optional PostgreSQL + Drizzle ORM

## Local development

```bash
npm install
npm run dev
# → http://localhost:3000
```

The dashboard runs entirely from client-side sample data, so **no database is
required**.

## Deploying to Vercel

See [`DEPLOY.md`](./DEPLOY.md) for step-by-step instructions.

The short version:

1. Push this folder to GitHub.
2. Import the repository at https://vercel.com/new.
3. Vercel auto-detects Next.js — click **Deploy**.

That's it. You'll get a permanent URL like `kea-operations.vercel.app`.

## License

Internal KEA project — all rights reserved.
