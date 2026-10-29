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

function scoreEntryWithMatchers(entry, wholeWord, partial) {
  const defs = definitionStrings(entry);
  const fields = fieldStrings(entry);

  if (defs.some((text) => wholeWord.test(text))) return 0;
  if (fields.some((text) => wholeWord.test(text))) return 1;
  if (defs.some((text) => partial.test(text))) return 2;
  if (fields.some((text) => partial.test(text))) return 3;
  return null;
}

export function entryMatchesQuery(entry, query) {
  const q = query.trim();
  if (!q) return true;

  const partial = new RegExp(escapeRegex(q), "i");
  return [...definitionStrings(entry), ...fieldStrings(entry)].some((text) =>
    partial.test(text),
  );
}

export function scoreEntry(entry, query) {
  const q = query.trim();
  if (!q) return 100;

  const escaped = escapeRegex(q);
  const wholeWord = new RegExp(`\\b${escaped}\\b`, "i");
  const partial = new RegExp(escaped, "i");
  const score = scoreEntryWithMatchers(entry, wholeWord, partial);
  return score == null ? 4 : score;
}

function groupEntriesList(group) {
  return [
    ...(group.head ? [group.head] : []),
    ...(group.variants || []),
  ];
}

function groupScoreWithMatchers(group, wholeWord, partial) {
  let best = null;
  for (const entry of groupEntriesList(group)) {
    const score = scoreEntryWithMatchers(entry, wholeWord, partial);
    if (score == null) continue;
    if (best == null || score < best) best = score;
    if (best === 0) break;
  }
  return best;
}

function groupLabel(group) {
  return group.head?.romanisation || group.variants[0]?.romanisation || "";
}

export function groupFirstLetter(group) {
  const match = groupLabel(group).trim().match(/[A-Za-z]/);
  return match ? match[0].toUpperCase() : "#";
}

export function availableLetters(groups) {
  const letters = new Set();
  for (const group of groups) {
    letters.add(groupFirstLetter(group));
  }
  return letters;
}

export function groupMatchesQuery(group, query) {
  if (!query?.trim()) return true;
  return groupEntriesList(group).some((entry) =>
    entryMatchesQuery(entry, query),
  );
}

function compareLabels(a, b) {
  return a.localeCompare(b, "en", { sensitivity: "base" });
}

export function sortGroupsByRelevance(groups, query) {
  if (!query?.trim()) {
    return [...groups].sort((a, b) => compareLabels(groupLabel(a), groupLabel(b)));
  }

  const escaped = escapeRegex(query.trim());
  const wholeWord = new RegExp(`\\b${escaped}\\b`, "i");
  const partial = new RegExp(escaped, "i");

  return groups
    .map((group) => ({
      group,
      score: groupScoreWithMatchers(group, wholeWord, partial) ?? 4,
      label: groupLabel(group),
    }))
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return compareLabels(a.label, b.label);
    })
    .map((item) => item.group);
}

export function filterAndSortGroups(groups, query, letter = "") {
  let matched = groups;

  if (letter) {
    matched = matched.filter((group) => groupFirstLetter(group) === letter);
  }

  const q = query?.trim() || "";
  if (!q) {
    return [...matched].sort((a, b) =>
      compareLabels(groupLabel(a), groupLabel(b)),
    );
  }

  const escaped = escapeRegex(q);
  const wholeWord = new RegExp(`\\b${escaped}\\b`, "i");
  const partial = new RegExp(escaped, "i");
  const scored = [];

  for (const group of matched) {
    const score = groupScoreWithMatchers(group, wholeWord, partial);
    if (score == null) continue;
    scored.push({ group, score, label: groupLabel(group) });
  }

  scored.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    return compareLabels(a.label, b.label);
  });

  return scored.map((item) => item.group);
}
