export function groupEntries(entries) {
  const byId = new Map(entries.map((entry) => [entry._id, entry]));
  const groups = new Map();

  function ensureGroup(id) {
    if (!groups.has(id)) {
      groups.set(id, { head: byId.get(id) ?? null, variants: [] });
    }
    return groups.get(id);
  }

  for (const entry of entries) {
    if (entry.is_head) {
      const group = ensureGroup(entry._id);
      group.head = entry;
    } else {
      const parentId = entry.main_entry_id || entry._id;
      ensureGroup(parentId).variants.push(entry);
    }
  }

  return [...groups.values()].filter(
    (group) => group.head || group.variants.length,
  );
}
