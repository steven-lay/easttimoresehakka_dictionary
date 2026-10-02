"use client";

import { useEffect, useMemo, useState } from "react";
import SearchBox from "../components/SearchBox";
import LetterBrowse from "../components/LetterBrowse";
import EntryList from "../components/EntryList";
import Pagination from "../components/Pagination";
import ThemeToggle from "../components/ThemeToggle";
import { groupEntries } from "../lib/groupEntries";
import { availableLetters, filterAndSortGroups } from "../lib/searchRank";
import styles from "./page.module.css";

const PAGE_SIZE = 25;

export default function DictionaryApp() {
  const [query, setQuery] = useState("");
  const [letter, setLetter] = useState("");
  const [allGroups, setAllGroups] = useState([]);
  const [recordCount, setRecordCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [error, setError] = useState("");
  const [errorDetail, setErrorDetail] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setCheckingUpdates(false);
      setError("");
      setErrorDetail("");

      let hasSnapshot = false;

      try {
        const snapshot = await fetch("/entries.json", {
          signal: controller.signal,
          cache: "force-cache",
        });
        if (snapshot.ok) {
          const data = await snapshot.json();
          if (Array.isArray(data.entries) && data.entries.length > 0) {
            setAllGroups(groupEntries(data.entries));
            setRecordCount(data.count ?? data.entries.length);
            setPage(1);
            setLoading(false);
            hasSnapshot = true;
          }
        }
      } catch (err) {
        if (err.name === "AbortError") return;
      }

      setCheckingUpdates(true);

      try {
        const response = await fetch("/api/entries", {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          if (hasSnapshot) {
            console.warn("Live dictionary refresh failed:", data.error || data.detail);
            return;
          }
          setErrorDetail(data.detail || "");
          throw new Error(data.error || "Could not load entries");
        }

        setAllGroups(groupEntries(data.entries));
        setRecordCount(data.count);
        setPage(1);
        setError("");
        setErrorDetail("");
      } catch (err) {
        if (err.name === "AbortError") return;
        if (hasSnapshot) return;
        setAllGroups([]);
        setRecordCount(0);
        setPage(1);
        setError(err.message);
      } finally {
        if (!controller.signal.aborted) {
          setCheckingUpdates(false);
          setLoading(false);
        }
      }
    }

    load();
    return () => controller.abort();
  }, []);

  const letters = useMemo(() => availableLetters(allGroups), [allGroups]);

  const groups = useMemo(
    () => filterAndSortGroups(allGroups, query, letter),
    [allGroups, query, letter],
  );

  useEffect(() => {
    setPage(1);
  }, [query, letter]);

  const pageCount = Math.max(1, Math.ceil(groups.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);

  const pageGroups = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return groups.slice(start, start + PAGE_SIZE);
  }, [groups, currentPage]);

  const rangeLabel = useMemo(() => {
    if (groups.length === 0) return "0 entries";
    const start = (currentPage - 1) * PAGE_SIZE + 1;
    const end = Math.min(currentPage * PAGE_SIZE, groups.length);
    const letterNote = letter ? ` · letter ${letter}` : "";
    const updateNote = checkingUpdates
      ? " · Checking database for new entries…"
      : "";
    return `Showing ${start}–${end} of ${groups.length} entries (${recordCount} records)${letterNote}${updateNote}`;
  }, [groups.length, currentPage, recordCount, letter, checkingUpdates]);

  function goToPage(nextPage) {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearSearch() {
    setQuery("");
  }

  function handleLetterChange(nextLetter) {
    setLetter(nextLetter);
  }

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.intro}>
          <div className={styles.titleRow}>
            <div>
              <h1 className={styles.title}>
                East Timorese Hakka-English word list
              </h1>
              <p className={styles.blurb}>
                This is a word list of East Timorese Hakka words and their English
                translations as spoken by my family. I can&apos;t guarantee the
                accuracy of the translations, but I&apos;ve tried to make them as
                accurate as possible.
              </p>
              <p className={styles.blurb}>
                This list is a work in progress and will be updated regularly.
              </p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
      <header className={styles.header}>
        <div className={styles.shell}>
          <SearchBox
            value={query}
            onChange={setQuery}
            onClear={clearSearch}
          />
          {!loading && !error ? (
            <LetterBrowse
              value={letter}
              available={letters}
              onChange={handleLetterChange}
            />
          ) : null}
          <p className={styles.meta}>
            {loading ? "Loading entries…" : error ? error : rangeLabel}
          </p>
          {error && errorDetail ? (
            <p className={styles.metaDetail}>{errorDetail}</p>
          ) : null}
        </div>
      </header>
      <main className={`${styles.main} ${styles.shell}`}>
        {error ? (
          <p className={styles.empty}>
            Add your connection string to <code>.env.local</code>, then restart{" "}
            <code>npm run dev</code>.
          </p>
        ) : (
          <>
            {!loading ? (
              <Pagination
                page={currentPage}
                pageCount={pageCount}
                onChange={goToPage}
              />
            ) : null}
            <EntryList
              groups={pageGroups}
              loading={loading}
              query={query || letter}
            />
          </>
        )}
      </main>
    </div>
  );
}
