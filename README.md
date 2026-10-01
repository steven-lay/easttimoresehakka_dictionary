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
