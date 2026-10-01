import { NextResponse } from "next/server";
import { isAdminRequest, unauthorized } from "../../../../../lib/adminAuth";
import {
  buildEntryDocument,
  serializeEntry,
  toObjectId,
} from "../../../../../lib/adminEntries";
import { getCollection } from "../../../../../lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  if (!isAdminRequest(request)) return unauthorized();

  const { id } = await params;
  const objectId = toObjectId(id);
  if (!objectId) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const collection = await getCollection();
    const doc = await collection.findOne({ _id: objectId });
    if (!doc) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }
    return NextResponse.json({ entry: serializeEntry(doc) });
  } catch (error) {
    console.error("Admin entry GET failed", error);
    return NextResponse.json(
      { error: error.message || "Failed to load entry" },
      { status: 500 },
    );
  }
}

export async function PATCH(request, { params }) {
  if (!isAdminRequest(request)) return unauthorized();

  const { id } = await params;
  const objectId = toObjectId(id);
  if (!objectId) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const collection = await getCollection();
    const existing = await collection.findOne({ _id: objectId });
    if (!existing) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const { doc, unset } = buildEntryDocument(body, { existing });
    const update = { $set: doc };
    if (Object.keys(unset).length > 0) {
      update.$unset = unset;
    }
    await collection.updateOne({ _id: objectId }, update);
    const updated = await collection.findOne({ _id: objectId });
    return NextResponse.json({ entry: serializeEntry(updated) });
  } catch (error) {
    console.error("Admin entry PATCH failed", error);
    const message =
      error.code === 121
        ? "Document failed MongoDB validation. Check chinese is non-empty, there is at least one definition, and notes are saved as a list."
        : error.message || "Failed to update entry";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
