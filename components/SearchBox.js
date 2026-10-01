import styles from "./SearchBox.module.css";

export default function SearchBox({ value, onChange, onClear }) {
  return (
    <div className={styles.wrap}>
      <label className={styles.label}>
        <span className={styles.srOnly}>Search the dictionary</span>
        <input
          className={styles.input}
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search romanisation, Chinese, or English definitions"
          autoComplete="off"
          spellCheck="false"
        />
      </label>
      {value ? (
        <button
          type="button"
          className={styles.clear}
          onClick={onClear}
          aria-label="Clear search"
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}
