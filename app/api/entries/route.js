import { NextResponse } from "next/server";
import { getCollection } from "../../../lib/mongodb";
import { searchFilter, serializeEntry, toObjectId } from "../../../lib/entries";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  try {
    const collection = await getCollection();
    const filter = query ? searchFilter(query) : {};
    const matches = await collection.find(filter).limit(2000).toArray();

    const headIds = new Set();
    for (const doc of matches) {
      if (doc.is_head === false && doc.main_entry_id) {
        headIds.add(doc.main_entry_id.toString());
      } else {
        headIds.add(doc._id.toString());
      }
    }

    const objectIds = [...headIds].map(toObjectId).filter(Boolean);
    const stringIds = [...headIds];
    const related =
      objectIds.length > 0 || stringIds.length > 0
        ? await collection
            .find({
              $or: [
                { _id: { $in: objectIds } },
                { main_entry_id: { $in: objectIds } },
                { main_entry_id: { $in: stringIds } },
              ],
            })
            .sort({ romanisation: 1 })
            .toArray()
        : [];

    const byId = new Map();
    for (const doc of [...matches, ...related]) {
      byId.set(doc._id.toString(), serializeEntry(doc));
    }

    const entries = [...byId.values()].sort((a, b) =>
      a.romanisation.localeCompare(b.romanisation, "en", { sensitivity: "base" }),
    );

    return NextResponse.json({ entries, query, count: entries.length });
  } catch (error) {
    console.error("Failed to load entries", error);
    return NextResponse.json(
      {
        error:
          "Could not load dictionary entries. Check MongoDB is running and MONGODB_URI in .env.local.",
        entries: [],
        count: 0,
      },
      { status: 500 },
    );
  }
}
