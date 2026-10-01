import { NextResponse } from "next/server";
import { isAdminRequest, unauthorized } from "../../../../lib/adminAuth";
import {
  buildEntryDocument,
  duplicateFilter,
  serializeEntry,
} from "../../../../lib/adminEntries";
import { searchFilter } from "../../../../lib/entries";
import { getCollection } from "../../../../lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!isAdminRequest(request)) return unauthorized();

  const { searchParams } = request.nextUrl;
  const query = searchParams.get("q")?.trim() ?? "";
  const romanisation = searchParams.get("romanisation")?.trim() ?? "";
  const chinese = searchParams.get("chinese")?.trim() ?? "";
  const excludeId = searchParams.get("excludeId")?.trim() ?? "";
  const mode = searchParams.get("mode") || "search";
  const headsOnly = searchParams.get("heads") === "1";

  try {
    const collection = await getCollection();

    if (mode === "duplicates") {
      const filter = duplicateFilter({ romanisation, chinese, excludeId });
      if (!filter) {
        return NextResponse.json({ entries: [], count: 0 });
      }

      const docs = await collection.find(filter).limit(30).toArray();
      const entries = docs.map(serializeEntry);
      return NextResponse.json({ entries, count: entries.length });
    }

    let filter = {};
    if (query) {
      filter = searchFilter(query);
    }
    if (headsOnly) {
      filter = Object.keys(filter).length
        ? { $and: [filter, { is_head: { $ne: false } }] }
        : { is_head: { $ne: false } };
    }

    const docs = await collection
      .find(filter)
      .sort({ romanisation: 1 })
      .limit(50)
      .toArray();

    return NextResponse.json({
      entries: docs.map(serializeEntry),
      count: docs.length,
    });
  } catch (error) {
    console.error("Admin entries GET failed", error);
    return NextResponse.json(
      { error: error.message || "Failed to search entries" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  if (!isAdminRequest(request)) return unauthorized();

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const collection = await getCollection();
    const { doc } = buildEntryDocument(body);

    const result = await collection.insertOne(doc);
    const created = await collection.findOne({ _id: result.insertedId });
    return NextResponse.json(
      { entry: serializeEntry(created) },
      { status: 201 },
    );
  } catch (error) {
    console.error("Admin entries POST failed", error);
    return NextResponse.json(
      { error: error.message || "Failed to create entry" },
      { status: 400 },
    );
  }
}
