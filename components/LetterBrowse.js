import styles from "./LetterBrowse.module.css";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  .split("")
  .filter((letter) => !["I", "R", "U", "W"].includes(letter));

export default function LetterBrowse({ value, available, onChange }) {
  return (
    <div className={styles.wrap} role="group" aria-label="Browse by letter">
      <button
        type="button"
        className={!value ? `${styles.chip} ${styles.active}` : styles.chip}
        aria-pressed={!value}
        onClick={() => onChange("")}
      >
        All
      </button>
      {LETTERS.map((letter) => {
        const enabled = available.has(letter);
        const active = value === letter;

        return (
          <button
            key={letter}
            type="button"
            className={active ? `${styles.chip} ${styles.active}` : styles.chip}
            aria-pressed={active}
            disabled={!enabled}
            onClick={() => onChange(active ? "" : letter)}
          >
            {letter}
          </button>
        );
      })}
      {available.has("#") ? (
        <button
          type="button"
          className={value === "#" ? `${styles.chip} ${styles.active}` : styles.chip}
          aria-pressed={value === "#"}
          onClick={() => onChange(value === "#" ? "" : "#")}
        >
          #
        </button>
      ) : null}
    </div>
  );
}
