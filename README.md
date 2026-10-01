# English–Hakka dictionary

Single-page Next.js interface over the `dictionary.englishhakka` MongoDB collection.

## Setup

1. Copy the connection string into `.env.local`:

```
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=dictionary
MONGODB_COLLECTION=englishhakka
```

Use your Atlas URI instead of `127.0.0.1` if the database is in the cloud.

2. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Search matches `romanisation`, `chinese`, `definitions`, and `alt_romanisation`. Records with `is_head: false` are shown under the headword pointed to by `main_entry_id`.

## Fast first load

On `npm run build` (including Vercel), entries are exported to `public/entries.json` so the page can show a snapshot immediately, then refresh from MongoDB in the background.

```bash
npm run export-entries
```

## Admin

Add entries or edit existing ones at [http://localhost:3000/admin](http://localhost:3000/admin).

Set a password in `.env.local`:

```
ADMIN_PASSWORD=choose-a-strong-password
```

Also add `ADMIN_PASSWORD` in Vercel → Project → Settings → Environment Variables, then redeploy.
