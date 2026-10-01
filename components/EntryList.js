import Romanisation from "./Romanisation";
import styles from "./EntryList.module.css";

function formatDefinition(definition) {
  if (definition == null) return "";
  if (typeof definition === "string") return definition;
  if (typeof definition === "object") {
    return (
      definition.text ||
      definition.english ||
      definition.definition ||
      JSON.stringify(definition)
    );
  }
  return String(definition);
}

function definitionItems(definitions) {
  return (definitions || [])
    .map(formatDefinition)
    .map((item) => item.trim())
    .filter(Boolean);
}

function DefinitionList({ definitions }) {
  const items = definitionItems(definitions);
  if (items.length === 0) return null;

  return (
    <ol className={styles.definitionList}>
      {items.map((item, index) => (
        <li key={`${index}-${item}`}>{item}</li>
      ))}
    </ol>
  );
}

function formatAlts(alts) {
  if (!Array.isArray(alts) || alts.length === 0 || alts[0] === "") return "";
  return alts.filter(Boolean).join(" · ");
}

function EntryRow({ entry, isVariant }) {
  const alts = formatAlts(entry.alt_romanisation);

  return (
    <tr className={isVariant ? styles.variantRow : styles.headRow}>
      <td className={styles.romanisation}>
        {isVariant ? <span className={styles.also}>also</span> : null}
        <span>
          <Romanisation value={entry.romanisation} />
        </span>
        {alts ? (
          <span className={styles.alts}>
            <Romanisation value={alts} />
          </span>
        ) : null}
      </td>
      <td className={styles.chinese}>{entry.chinese}</td>
      <td className={styles.definitions}>
        <DefinitionList definitions={entry.definitions} />
      </td>
      <td className={styles.notes}>{entry.notes || ""}</td>
    </tr>
  );
}

export default function EntryList({ groups, loading, query }) {
  if (!loading && groups.length === 0) {
    return (
      <p className={styles.empty}>
        {query
          ? `No entries match “${query}”.`
          : "No entries found in the englishhakka collection."}
      </p>
    );
  }

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Romanisation</th>
            <th>Chinese</th>
            <th>Definitions</th>
            <th>Notes</th>
          </tr>
        </thead>
        {groups.map((group) => {
          const key = group.head?._id || group.variants[0]?._id;

          return (
            <tbody key={key} className={styles.group}>
              {group.head ? (
                <EntryRow key={group.head._id} entry={group.head} />
              ) : null}
              {group.variants.map((variant) => (
                <EntryRow key={variant._id} entry={variant} isVariant />
              ))}
            </tbody>
          );
        })}
      </table>
    </div>
  );
}
