"use client";

import {
  ArrowDown, ArrowUp, Check, ChevronRight, Edit3, Eye, GripVertical, Inbox,
  MonitorPlay, Plus, Radio, RotateCcw, Save, Trash2, X,
} from "lucide-react";
import Link from "next/link";
import { type DragEvent, useEffect, useMemo, useState } from "react";
import type { Pack, PackAccent, Submission } from "@/lib/types";

const accents: PackAccent[] = ["plum", "cobalt", "coral", "forest", "sand"];

function formatSubmittedTime(value: string) {
  const date = new Date(value);
  return `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")} UTC`;
}

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...options?.headers } });
  const result = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(result.error || "Could not save.");
  return result;
}

export function AdminStudio({ initialPacks, initialSubmissions, initialStats }: {
  initialPacks: Pack[];
  initialSubmissions: Submission[];
  initialStats: { packs: number; submissions: number; queued: number };
}) {
  const [packs, setPacks] = useState(initialPacks);
  const [selectedId, setSelectedId] = useState(initialPacks[0]?.id ?? "");
  const [draft, setDraft] = useState<Pack | null>(initialPacks[0] ?? null);
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<Submission | null>(null);
  const [busy, setBusy] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropZone, setDropZone] = useState<"queue" | "incoming" | null>(null);

  const queuedIds = draft?.queue.map((item) => item.id) ?? [];
  const incoming = useMemo(
    () => submissions.filter((item) => !queuedIds.includes(item.id)),
    [queuedIds, submissions],
  );

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    const load = async () => {
      try {
        const result = await api<{ submissions: Submission[] }>(`/api/packs/${selectedId}/submissions`);
        if (active) setSubmissions(result.submissions);
      } catch { /* Keep the last local list during brief disconnects. */ }
    };
    void load();
    const timer = window.setInterval(() => void load(), 1500);
    return () => { active = false; window.clearInterval(timer); };
  }, [selectedId]);

  function flash(text: string) {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 2200);
  }

  async function choose(pack: Pack) {
    setSelectedId(pack.id); setDraft(pack);
    const result = await api<{ submissions: Submission[] }>(`/api/packs/${pack.id}/submissions`);
    setSubmissions(result.submissions);
  }

  async function persistQueue(ids: string[]) {
    if (!draft) return;
    const prior = draft.queue;
    const nextQueue = ids
      .map((id) => submissions.find((item) => item.id === id) ?? prior.find((item) => item.id === id))
      .filter(Boolean)
      .map((item, position) => ({ ...item!, isQueued: true, position }));
    setDraft({ ...draft, queue: nextQueue });
    try {
      const saved = await api<Pack>(`/api/packs/${draft.id}/queue`, {
        method: "PUT", body: JSON.stringify({ submissionIds: ids }),
      });
      setDraft(saved);
      setPacks((items) => items.map((item) => item.id === saved.id ? saved : item));
    } catch (error) {
      setDraft({ ...draft, queue: prior });
      flash(error instanceof Error ? error.message : "Queue update failed");
    }
  }

  async function saveDetails() {
    if (!draft) return;
    setBusy(true);
    try {
      const saved = await api<Pack>(`/api/packs/${draft.id}`, {
        method: "PUT",
        body: JSON.stringify({ name: draft.name, slug: draft.slug, description: draft.description, accent: draft.accent, isPublished: draft.isPublished }),
      });
      setDraft(saved); setPacks((items) => items.map((item) => item.id === saved.id ? saved : item)); flash("Saved");
    } catch (error) { flash(error instanceof Error ? error.message : "Save failed"); }
    finally { setBusy(false); }
  }

  async function newPack() {
    const created = await api<Pack>("/api/packs", {
      method: "POST",
      body: JSON.stringify({ name: "Untitled board", slug: `board-${Date.now().toString().slice(-6)}`, description: "", accent: "plum", isPublished: false }),
    });
    setPacks((items) => [created, ...items]); setSubmissions([]); setSelectedId(created.id); setDraft(created);
  }

  async function saveEdit() {
    if (!editing) return;
    const saved = await api<Submission>(`/api/submissions/${editing.id}`, {
      method: "PUT", body: JSON.stringify({ name: editing.name, question: editing.question }),
    });
    setSubmissions((items) => items.map((item) => item.id === saved.id ? saved : item));
    if (draft) setDraft({ ...draft, queue: draft.queue.map((item) => item.id === saved.id ? saved : item) });
    setEditing(null); flash("Question updated live");
  }

  async function removeSubmission(item: Submission) {
    if (!window.confirm("Delete this submission?")) return;
    await api(`/api/submissions/${item.id}`, { method: "DELETE" });
    setSubmissions((items) => items.filter((entry) => entry.id !== item.id));
    if (draft) setDraft({ ...draft, queue: draft.queue.filter((entry) => entry.id !== item.id) });
  }

  function move(id: string, delta: number) {
    const ids = [...queuedIds]; const from = ids.indexOf(id);
    const to = Math.max(0, Math.min(ids.length - 1, from + delta));
    ids.splice(from, 1); ids.splice(to, 0, id); void persistQueue(ids);
  }

  function startDrag(event: DragEvent<HTMLElement>, id: string) {
    setDraggingId(id); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", id);
  }
  function endDrag() { setDraggingId(null); setDropZone(null); }
  function dropIntoQueue(event: DragEvent<HTMLElement>, insertionIndex = queuedIds.length) {
    event.preventDefault(); event.stopPropagation();
    const id = event.dataTransfer.getData("text/plain") || draggingId;
    if (!id) return;
    const sourceIndex = queuedIds.indexOf(id);
    const next = queuedIds.filter((itemId) => itemId !== id);
    let target = insertionIndex;
    if (sourceIndex >= 0 && sourceIndex < insertionIndex) target -= 1;
    next.splice(Math.max(0, Math.min(target, next.length)), 0, id);
    endDrag(); void persistQueue(next);
  }
  function dropIntoIncoming(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain") || draggingId;
    endDrag();
    if (id && queuedIds.includes(id)) void persistQueue(queuedIds.filter((itemId) => itemId !== id));
  }

  return <main className="studio-shell queue-admin">
    <section className="studio-workspace">
      <header className="studio-toolbar">
        <div className="studio-title"><Link href="/">Questions</Link><span>/</span><h1>Live queue</h1></div>
        <div>
          {notice && <span className="save-notice"><Check />{notice}</span>}
          <span className="toolbar-count">{initialStats.submissions} received</span>
          <button className="button button-quiet" onClick={newPack}><Plus /> New board</button>
          <button className="button button-primary" disabled={busy} onClick={saveDetails}><Save /> Save</button>
        </div>
      </header>

      <div className="queue-studio">
        <aside className="pack-list">
          <div className="pack-list-heading"><span>Boards</span><span>{packs.length}</span></div>
          {packs.map((pack) => <button className={pack.id === selectedId ? "active" : ""} key={pack.id} onClick={() => void choose(pack)}>
            <span className={`accent-swatch accent-${pack.accent}`} />
            <span><strong>{pack.name}</strong><small>{pack.submissionCount} received · {pack.queue.length} queued</small></span>
            <ChevronRight />
          </button>)}
        </aside>

        {draft && <section className="queue-workspace">
          <div className="queue-title">
            <div><span className={`status-badge ${draft.isPublished ? "live" : ""}`}>{draft.isPublished ? "Accepting questions" : "Closed"}</span><h2>{draft.name}</h2></div>
            <div><Link className="icon-link" href={`/f/${draft.slug}`} target="_blank"><Eye /> Form</Link><Link className="button button-primary" href={`/present/${draft.slug}`} target="_blank"><MonitorPlay /> Present</Link></div>
          </div>

          <div className="board-settings-row">
            <label>Name<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
            <label>URL<input value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} /></label>
            <label className="publish-compact"><span>Open</span><input type="checkbox" checked={draft.isPublished} onChange={(event) => setDraft({ ...draft, isPublished: event.target.checked })} /></label>
            <div className="accent-picker">{accents.map((accent) => <button aria-label={accent} className={`accent-${accent} ${draft.accent === accent ? "selected" : ""}`} key={accent} onClick={() => setDraft({ ...draft, accent })}><span />{draft.accent === accent && <Check />}</button>)}</div>
          </div>

          <div className="queue-columns">
            <section className={dropZone === "queue" ? "drop-active" : ""} onDragOver={(event) => { event.preventDefault(); setDropZone("queue"); }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDropZone(null); }} onDrop={(event) => dropIntoQueue(event)}>
              <header><div><Radio /> On screen</div><span>{draft.queue.length}</span></header>
              <div className="queue-list">
                {draft.queue.length ? draft.queue.map((item, index) => <article className={draggingId === item.id ? "dragging" : ""} draggable key={item.id} onDragStart={(event) => startDrag(event, item.id)} onDragEnd={endDrag} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropIntoQueue(event, index)}>
                  <GripVertical className="drag-handle" /><span className="queue-position">{String(index + 1).padStart(2, "0")}</span>
                  <div><strong>{item.question}</strong><small>{item.name}</small></div>
                  <div className="queue-actions">
                    <button aria-label="Move up" disabled={index === 0} onClick={() => move(item.id, -1)}><ArrowUp /></button>
                    <button aria-label="Move down" disabled={index === draft.queue.length - 1} onClick={() => move(item.id, 1)}><ArrowDown /></button>
                    <button aria-label="Edit queued question" onClick={() => setEditing(item)}><Edit3 /></button>
                    <button aria-label="Return to incoming" onClick={() => void persistQueue(queuedIds.filter((id) => id !== item.id))}><RotateCcw /></button>
                  </div>
                </article>) : <div className="queue-empty">Drag questions here or use +.</div>}
              </div>
            </section>

            <section className={dropZone === "incoming" ? "drop-active" : ""} onDragOver={(event) => { event.preventDefault(); setDropZone("incoming"); }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDropZone(null); }} onDrop={dropIntoIncoming}>
              <header><div><Inbox /> Incoming</div><span>{incoming.length}</span></header>
              <div className="queue-list incoming-list">
                {incoming.map((item) => <article className={draggingId === item.id ? "dragging" : ""} draggable key={item.id} onDragStart={(event) => startDrag(event, item.id)} onDragEnd={endDrag}>
                  <GripVertical className="drag-handle" />
                  <div><strong>{item.question}</strong><small>{item.name} · {formatSubmittedTime(item.createdAt)}</small></div>
                  <div className="queue-actions">
                    <button aria-label="Edit" onClick={() => setEditing(item)}><Edit3 /></button>
                    <button aria-label="Add to queue" className="queue-add" onClick={() => void persistQueue([...queuedIds, item.id])}><Plus /></button>
                    <button aria-label="Delete" onClick={() => void removeSubmission(item)}><Trash2 /></button>
                  </div>
                </article>)}
                {!incoming.length && <div className="queue-empty">Drop a queued question here to return it.</div>}
              </div>
            </section>
          </div>
        </section>}
      </div>
    </section>

    {editing && <div className="modal-backdrop"><section className="question-modal">
      <header><h2>Edit question</h2><button onClick={() => setEditing(null)}><X /></button></header>
      <label>Name<input value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} /></label>
      <label>Question<textarea rows={6} value={editing.question} onChange={(event) => setEditing({ ...editing, question: event.target.value })} /></label>
      <footer><button className="button button-quiet" onClick={() => setEditing(null)}>Cancel</button><button className="button button-primary" onClick={() => void saveEdit()}>Update live</button></footer>
    </section></div>}
  </main>;
}
