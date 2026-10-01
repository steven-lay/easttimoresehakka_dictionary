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

    const message = String(error?.message || error);
    const detail = `${error?.name || "Error"}: ${message.split("\n")[0]}`;
    let hint =
      "Could not load dictionary entries. Check MONGODB_URI and that Atlas allows Vercel connections.";

    if (/bad auth|authentication failed/i.test(message)) {
      hint =
        "MongoDB authentication failed. Check the username/password in MONGODB_URI (URL-encode special characters).";
    } else if (/ENOTFOUND|querySrv|DNS|getaddrinfo/i.test(message)) {
      hint =
        "Could not reach MongoDB. Check the Atlas hostname in MONGODB_URI.";
    } else if (
      /timed out|Server selection timed out|MongoServerSelectionError|MongoNetworkError|ECONNREFUSED|not authorized|IP|whitelist|firewall/i.test(
        message,
      )
    ) {
      hint =
        "MongoDB connection blocked or timed out. In Atlas → Network Access, add 0.0.0.0/0 so Vercel can connect, then wait a minute and retry.";
    } else if (/Missing MONGODB_URI/i.test(message)) {
      hint = message;
    }

    return NextResponse.json(
      {
        error: hint,
        detail,
        entries: [],
        count: 0,
      },
      { status: 500 },
    );
  }
}
