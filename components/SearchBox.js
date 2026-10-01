import styles from "./SearchBox.module.css";

export default function SearchBox({ value, onChange }) {
  return (
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
  );
}
