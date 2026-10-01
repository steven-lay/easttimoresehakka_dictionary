import { ObjectId } from "mongodb";

export function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function serializeEntry(doc) {
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
    notes: doc.notes ?? "",
  };
}

export function searchFilter(query) {
  const pattern = escapeRegex(query.trim());
  const regex = { $regex: pattern, $options: "i" };

  return {
    $or: [
      { romanisation: regex },
      { chinese: regex },
      { definitions: regex },
      { "definitions.text": regex },
      { "definitions.english": regex },
      { "definitions.definition": regex },
      { alt_romanisation: regex },
    ],
  };
}

export function toObjectId(id) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}
