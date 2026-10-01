"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./admin.module.css";

const emptyForm = {
  romanisation: "",
  chinese: "",
  definitions: "",
  alt_romanisation: "",
  notes: "",
  is_head: true,
  main_entry_id: "",
};

function entryToForm(entry) {
  return {
    romanisation: entry.romanisation || "",
    chinese: entry.chinese || "",
    definitions: (entry.definitions || []).join("\n"),
    alt_romanisation: (entry.alt_romanisation || []).join(", "),
    notes: entry.notes || "",
    is_head: entry.is_head !== false,
    main_entry_id: entry.main_entry_id || "",
  };
}

function EntryHit({ entry, onSelect, actionLabel }) {
  return (
    <button type="button" className={styles.hit} onClick={() => onSelect(entry)}>
      <span className={styles.hitMain}>
        <strong>{entry.romanisation}</strong>
        <span>{entry.chinese}</span>
      </span>
      <span className={styles.hitMeta}>
        {entry.is_head ? "head" : "synonym"} · {(entry.definitions || [])[0] || "No definition"}
      </span>
      <span className={styles.hitAction}>{actionLabel}</span>
    </button>
  );
}

export default function AdminApp() {
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [duplicates, setDuplicates] = useState([]);
  const [findQuery, setFindQuery] = useState("");
  const [findResults, setFindResults] = useState([]);
  const [headQuery, setHeadQuery] = useState("");
  const [headResults, setHeadResults] = useState([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch("/api/admin/session");
        const data = await response.json();
        setConfigured(data.configured !== false);
        setAuthenticated(Boolean(data.authenticated));
      } catch {
        setConfigured(false);
      } finally {
        setAuthChecked(true);
      }
    }
    checkSession();
  }, []);

  useEffect(() => {
    if (!authenticated) return undefined;

    const romanisation = form.romanisation.trim();
    const chinese = form.chinese.trim();
    if (!romanisation && !chinese) return undefined;

    const timer = setTimeout(async () => {
      const params = new URLSearchParams({ mode: "duplicates" });
      if (romanisation) params.set("romanisation", romanisation);
      if (chinese) params.set("chinese", chinese);
      if (editingId) params.set("excludeId", editingId);

      try {
        const response = await fetch(`/api/admin/entries?${params}`);
        const data = await response.json();
        if (response.ok) setDuplicates(data.entries || []);
      } catch {
        // ignore duplicate-check network blips
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [form.romanisation, form.chinese, editingId, authenticated]);

  useEffect(() => {
    if (!authenticated || !findQuery.trim()) return undefined;

    const timer = setTimeout(async () => {
      const params = new URLSearchParams({ q: findQuery.trim() });
      try {
        const response = await fetch(`/api/admin/entries?${params}`);
        const data = await response.json();
        if (response.ok) setFindResults(data.entries || []);
      } catch {
        setFindResults([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [findQuery, authenticated]);

  useEffect(() => {
    if (!authenticated || form.is_head || !headQuery.trim()) return undefined;

    const timer = setTimeout(async () => {
      const params = new URLSearchParams({
        q: headQuery.trim(),
        heads: "1",
      });
      try {
        const response = await fetch(`/api/admin/entries?${params}`);
        const data = await response.json();
        if (response.ok) setHeadResults(data.entries || []);
      } catch {
        setHeadResults([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [headQuery, form.is_head, authenticated]);

  const activeDuplicates = useMemo(
    () =>
      form.romanisation.trim() || form.chinese.trim() ? duplicates : [],
    [form.romanisation, form.chinese, duplicates],
  );
  const activeFindResults = findQuery.trim() ? findResults : [];
  const activeHeadResults =
    !form.is_head && headQuery.trim() ? headResults : [];

  const exactDuplicate = useMemo(() => {
    const roman = form.romanisation.trim().toLowerCase();
    const chinese = form.chinese.trim();
    return activeDuplicates.find(
      (entry) =>
        entry.romanisation.toLowerCase() === roman ||
        (chinese && entry.chinese === chinese),
    );
  }, [activeDuplicates, form.romanisation, form.chinese]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setStatus("");
    setError("");
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoginError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }
      setAuthenticated(true);
      setPassword("");
    } catch (err) {
      setLoginError(err.message);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
    resetForm();
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setDuplicates([]);
    setHeadQuery("");
    setStatus("");
    setError("");
  }

  function loadEntry(entry) {
    setEditingId(entry._id);
    setForm(entryToForm(entry));
    setFindQuery("");
    setFindResults([]);
    setStatus(`Editing ${entry.romanisation}`);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setStatus("");

    const payload = {
      romanisation: form.romanisation,
      chinese: form.chinese,
      definitions: form.definitions,
      alt_romanisation: form.alt_romanisation,
      notes: form.notes,
      is_head: Boolean(form.is_head),
      main_entry_id: form.is_head ? null : form.main_entry_id,
    };

    try {
      const response = await fetch(
        editingId ? `/api/admin/entries/${editingId}` : "/api/admin/entries",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Save failed");
      }

      setStatus(
        editingId
          ? `Updated “${data.entry.romanisation}”.`
          : `Added “${data.entry.romanisation}”.`,
      );
      if (!editingId) {
        resetForm();
        setStatus(`Added “${data.entry.romanisation}”. Ready for the next entry.`);
      } else {
        setForm(entryToForm(data.entry));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!authChecked) {
    return (
      <div className={styles.page}>
        <p className={styles.muted}>Checking admin session…</p>
      </div>
    );
  }

  if (!configured) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Admin</h1>
        <p className={styles.error}>
          Set <code>ADMIN_PASSWORD</code> in <code>.env.local</code> (and Vercel),
          then restart the server.
        </p>
        <Link href="/" className={styles.link}>
          Back to dictionary
        </Link>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Admin login</h1>
        <form className={styles.loginCard} onSubmit={handleLogin}>
          <label className={styles.field}>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {loginError ? <p className={styles.error}>{loginError}</p> : null}
          <button type="submit" className={styles.primary}>
            Log in
          </button>
        </form>
        <Link href="/" className={styles.link}>
          Back to dictionary
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Dictionary admin</p>
          <h1 className={styles.title}>
            {editingId ? "Edit entry" : "Add entry"}
          </h1>
        </div>
        <div className={styles.headerActions}>
          <Link href="/" className={styles.link}>
            View site
          </Link>
          <button type="button" className={styles.secondary} onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      <section className={styles.panel}>
        <h2 className={styles.sectionTitle}>Find existing entry</h2>
        <p className={styles.help}>
          Search before adding from your spreadsheet so you don&apos;t create duplicates.
        </p>
        <input
          className={styles.input}
          value={findQuery}
          onChange={(event) => setFindQuery(event.target.value)}
          placeholder="Search romanisation, Chinese, or definitions"
        />
        {activeFindResults.length > 0 ? (
          <div className={styles.hitList}>
            {activeFindResults.map((entry) => (
              <EntryHit
                key={entry._id}
                entry={entry}
                onSelect={loadEntry}
                actionLabel="Edit"
              />
            ))}
          </div>
        ) : findQuery.trim() ? (
          <p className={styles.muted}>No matching entries.</p>
        ) : null}
      </section>

      <form className={styles.panel} onSubmit={handleSave}>
        <div className={styles.formHeader}>
          <h2 className={styles.sectionTitle}>
            {editingId ? `Editing ${editingId}` : "New entry"}
          </h2>
          {editingId ? (
            <button type="button" className={styles.secondary} onClick={resetForm}>
              New entry
            </button>
          ) : null}
        </div>

        <div className={styles.grid}>
          <label className={styles.field}>
            <span>Romanisation *</span>
            <input
              className={styles.input}
              value={form.romanisation}
              onChange={(event) => updateField("romanisation", event.target.value)}
              required
            />
          </label>
          <label className={styles.field}>
            <span>Chinese *</span>
            <input
              className={styles.input}
              value={form.chinese}
              onChange={(event) => updateField("chinese", event.target.value)}
              required
            />
          </label>
        </div>

        <label className={styles.field}>
          <span>
            Definitions{form.is_head ? " *" : " (optional for synonyms)"} — one
            line = one array item; semicolons are kept
          </span>
          <textarea
            className={styles.textarea}
            rows={5}
            value={form.definitions}
            onChange={(event) => updateField("definitions", event.target.value)}
            placeholder={"dad; father\nto eat"}
            required={form.is_head}
          />
        </label>

        <label className={styles.field}>
          <span>Alt romanisation (comma-separated)</span>
          <input
            className={styles.input}
            value={form.alt_romanisation}
            onChange={(event) => updateField("alt_romanisation", event.target.value)}
          />
        </label>

        <label className={styles.field}>
          <span>Notes (one per line)</span>
          <textarea
            className={styles.textarea}
            rows={3}
            value={form.notes}
            onChange={(event) => updateField("notes", event.target.value)}
          />
        </label>

        <label className={styles.check}>
          <input
            type="checkbox"
            checked={form.is_head}
            onChange={(event) => updateField("is_head", event.target.checked)}
          />
          <span>This is a headword (`is_head`)</span>
        </label>

        {!form.is_head ? (
          <div className={styles.subPanel}>
            <label className={styles.field}>
              <span>Headword ObjectId (`main_entry_id`) *</span>
              <input
                className={styles.input}
                value={form.main_entry_id}
                onChange={(event) => updateField("main_entry_id", event.target.value)}
                required={!form.is_head}
                placeholder="Paste headword _id or search below"
              />
            </label>
            <label className={styles.field}>
              <span>Find headword</span>
              <input
                className={styles.input}
                value={headQuery}
                onChange={(event) => setHeadQuery(event.target.value)}
                placeholder="Search headwords only"
              />
            </label>
            {activeHeadResults.length > 0 ? (
              <div className={styles.hitList}>
                {activeHeadResults.map((entry) => (
                  <EntryHit
                    key={entry._id}
                    entry={entry}
                    onSelect={(head) => {
                      updateField("main_entry_id", head._id);
                      setHeadQuery(head.romanisation);
                      setHeadResults([]);
                    }}
                    actionLabel="Use as parent"
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className={styles.duplicateBox}>
          <h3 className={styles.sectionTitle}>Duplicate check</h3>
          {!form.romanisation.trim() && !form.chinese.trim() ? (
            <p className={styles.muted}>
              Type a romanisation or Chinese characters to check existing entries.
            </p>
          ) : activeDuplicates.length === 0 ? (
            <p className={styles.ok}>No exact romanisation/Chinese matches found.</p>
          ) : (
            <>
              {exactDuplicate ? (
                <p className={styles.muted}>
                  Same romanisation/Chinese already exists — you can still add
                  another entry, or open one below to edit it.
                </p>
              ) : (
                <p className={styles.muted}>Nearby matches:</p>
              )}
              <div className={styles.hitList}>
                {activeDuplicates.map((entry) => (
                  <EntryHit
                    key={entry._id}
                    entry={entry}
                    onSelect={loadEntry}
                    actionLabel="Edit this"
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {error ? <p className={styles.error}>{error}</p> : null}
        {status ? <p className={styles.ok}>{status}</p> : null}

        <div className={styles.actions}>
          <button type="submit" className={styles.primary} disabled={saving}>
            {saving ? "Saving…" : editingId ? "Update entry" : "Add entry"}
          </button>
          <button type="button" className={styles.secondary} onClick={resetForm}>
            Reset form
          </button>
        </div>
      </form>
    </div>
  );
}
