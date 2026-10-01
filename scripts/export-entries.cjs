/**
 * Build-time snapshot of dictionary entries for a fast first paint.
 * Run automatically via `prebuild` on Vercel / `npm run build`.
 * Local: `npm run export-entries` (optional; uses .env.local).
 */
const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const outPath = path.join(root, "public", "entries.json");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    if (process.env[key] !== undefined) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function serializeEntry(doc) {
  const notes = Array.isArray(doc.notes)
    ? doc.notes.map(String).filter((item) => item.trim() !== "")
    : doc.notes
      ? [String(doc.notes)]
      : [];

  return {
    _id: doc._id?.toString() ?? "",
    romanisation: doc.romanisation ?? "",
    chinese: doc.chinese ?? "",
    definitions: Array.isArray(doc.definitions) ? doc.definitions : [],
    main_entry_id: doc.main_entry_id ? doc.main_entry_id.toString() : null,
    is_head: doc.is_head !== false,
    alt_romanisation: Array.isArray(doc.alt_romanisation)
      ? doc.alt_romanisation
      : [],
    notes: notes.join("\n"),
    tags: Array.isArray(doc.tags) ? doc.tags.map(String) : [],
  };
}

function writeSnapshot(payload) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(payload)}\n`, "utf8");
}

async function main() {
  loadEnvFile(path.join(root, ".env.local"));
  loadEnvFile(path.join(root, ".env"));

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "dictionary";
  const collectionName = process.env.MONGODB_COLLECTION || "englishhakka";

  if (!uri) {
    console.warn(
      "[export-entries] MONGODB_URI missing — writing empty public/entries.json",
    );
    writeSnapshot({ entries: [], count: 0, generatedAt: null });
    return;
  }

  const client = new MongoClient(uri, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 15000,
  });

  try {
    await client.connect();
    const docs = await client
      .db(dbName)
      .collection(collectionName)
      .find({})
      .sort({ romanisation: 1 })
      .toArray();

    const entries = docs.map(serializeEntry);
    writeSnapshot({
      entries,
      count: entries.length,
      generatedAt: new Date().toISOString(),
    });
    console.log(
      `[export-entries] Wrote ${entries.length} entries to public/entries.json`,
    );
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error("[export-entries] Failed:", error);
  writeSnapshot({ entries: [], count: 0, generatedAt: null });
  // Don't fail the Vercel build if Atlas is briefly unreachable — site can still fetch live.
  process.exit(0);
});
