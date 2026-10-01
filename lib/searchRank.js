function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function definitionStrings(entry) {
  return (entry.definitions || []).flatMap((definition) => {
    if (definition == null) return [];
    if (typeof definition === "string") return [definition];
    if (typeof definition === "object") {
      return [definition.text, definition.english, definition.definition]
        .filter(Boolean)
        .map(String);
    }
    return [String(definition)];
  });
}

function fieldStrings(entry) {
  return [
    entry.romanisation,
    entry.chinese,
    entry.notes,
    ...(Array.isArray(entry.alt_romanisation) ? entry.alt_romanisation : []),
  ]
    .filter(Boolean)
    .map(String);
}

function searchableTexts(entry) {
  return [...definitionStrings(entry), ...fieldStrings(entry)];
}

export function entryMatchesQuery(entry, query) {
  const q = query.trim();
  if (!q) return true;

  const partial = new RegExp(escapeRegex(q), "i");
  return searchableTexts(entry).some((text) => partial.test(text));
}

export function scoreEntry(entry, query) {
  const q = query.trim();
  if (!q) return 100;

  const escaped = escapeRegex(q);
  const wholeWord = new RegExp(`\\b${escaped}\\b`, "i");
  const partial = new RegExp(escaped, "i");
  const defs = definitionStrings(entry);
  const fields = fieldStrings(entry);

  if (defs.some((text) => wholeWord.test(text))) return 0;
  if (fields.some((text) => wholeWord.test(text))) return 1;
  if (defs.some((text) => partial.test(text))) return 2;
  if (fields.some((text) => partial.test(text))) return 3;
  return 4;
}

function groupEntriesList(group) {
  return [
    ...(group.head ? [group.head] : []),
    ...(group.variants || []),
  ];
}

function groupScore(group, query) {
  return Math.min(
    ...groupEntriesList(group).map((entry) => scoreEntry(entry, query)),
  );
}

function groupLabel(group) {
  return group.head?.romanisation || group.variants[0]?.romanisation || "";
}

export function groupMatchesQuery(group, query) {
  if (!query?.trim()) return true;
  return groupEntriesList(group).some((entry) =>
    entryMatchesQuery(entry, query),
  );
}

export function sortGroupsByRelevance(groups, query) {
  if (!query?.trim()) {
    return [...groups].sort((a, b) =>
      groupLabel(a).localeCompare(groupLabel(b), "en", { sensitivity: "base" }),
    );
  }

  return [...groups].sort((a, b) => {
    const scoreDiff = groupScore(a, query) - groupScore(b, query);
    if (scoreDiff !== 0) return scoreDiff;
    return groupLabel(a).localeCompare(groupLabel(b), "en", {
      sensitivity: "base",
    });
  });
}

export function filterAndSortGroups(groups, query) {
  const matched = query?.trim()
    ? groups.filter((group) => groupMatchesQuery(group, query))
    : groups;

  return sortGroupsByRelevance(matched, query);
}
