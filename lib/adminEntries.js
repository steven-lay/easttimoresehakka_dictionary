import { escapeRegex, serializeEntry, toObjectId } from "./entries";

export function parseDefinitions(value) {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }

  return String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseStringArray(value, { allowEmptyPlaceholder = false } = {}) {
  let items;
  if (Array.isArray(value)) {
    items = value.map(String).map((item) => item.trim()).filter(Boolean);
  } else {
    items = String(value || "")
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (items.length === 0 && allowEmptyPlaceholder) {
    return [""];
  }
  return items;
}

export function parseNotes(value) {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }

  return String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function buildEntryDocument(body, { existing } = {}) {
  const romanisation = String(body.romanisation || "").trim();
  const chinese = String(body.chinese || "").trim();
  const definitions = parseDefinitions(body.definitions);
  const notes = parseNotes(body.notes);
  const altRomanisation = parseStringArray(body.alt_romanisation, {
    allowEmptyPlaceholder: true,
  });

  if (!romanisation) {
    throw new Error("romanisation is required");
  }
  if (!chinese) {
    throw new Error("chinese is required (MongoDB schema requires a non-empty string)");
  }

  const isHead = body.is_head !== false && body.is_head !== "false";
  let mainEntryId = null;

  if (!isHead) {
    const objectId = toObjectId(String(body.main_entry_id || ""));
    if (!objectId) {
      throw new Error("Synonyms need a valid main_entry_id (headword ObjectId)");
    }
    mainEntryId = objectId;
  }

  if (isHead && definitions.length === 0) {
    throw new Error("Headwords need at least one definition");
  }

  const tags = Array.isArray(body.tags)
    ? parseStringArray(body.tags, { allowEmptyPlaceholder: true })
    : Array.isArray(existing?.tags)
      ? existing.tags.map(String)
      : [""];

  const doc = {
    romanisation,
    chinese,
    alt_romanisation: altRomanisation,
    notes,
    tags,
    is_head: isHead,
    main_entry_id: mainEntryId,
  };

  const unset = {};

  // Schema: definitions is optional, but if present must have minItems: 1.
  if (definitions.length > 0) {
    doc.definitions = definitions;
  } else {
    unset.definitions = "";
  }

  return { doc, unset };
}

export function duplicateFilter({ romanisation, chinese, excludeId } = {}) {
  const clauses = [];

  if (romanisation?.trim()) {
    const pattern = `^${escapeRegex(romanisation.trim())}$`;
    clauses.push(
      { romanisation: { $regex: pattern, $options: "i" } },
      { alt_romanisation: { $regex: pattern, $options: "i" } },
    );
  }

  if (chinese?.trim()) {
    clauses.push({ chinese: chinese.trim() });
  }

  if (clauses.length === 0) return null;

  const filter = { $or: clauses };
  if (excludeId) {
    const objectId = toObjectId(excludeId);
    if (objectId) {
      filter._id = { $ne: objectId };
    }
  }
  return filter;
}

export { serializeEntry, toObjectId };
