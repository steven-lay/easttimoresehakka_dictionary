import styles from "./Pagination.module.css";

export default function Pagination({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null;

  const prevDisabled = page <= 1;
  const nextDisabled = page >= pageCount;

  return (
    <nav className={styles.nav} aria-label="Table pages">
      <button
        type="button"
        className={styles.button}
        onClick={() => onChange(page - 1)}
        disabled={prevDisabled}
      >
        Previous
      </button>
      <p className={styles.status}>
        Page {page} of {pageCount}
      </p>
      <button
        type="button"
        className={styles.button}
        onClick={() => onChange(page + 1)}
        disabled={nextDisabled}
      >
        Next
      </button>
    </nav>
  );
}
