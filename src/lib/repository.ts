import "server-only";

import { randomBytes, randomUUID } from "node:crypto";

import { getDatabase } from "@/lib/db";
import type { Pack, PackAccent, Submission } from "@/lib/types";

type SubmissionRow = { id: string; pack_id: string; name: string; question_text: string; receipt_code: string; is_queued: number; position: number | null; created_at: string; updated_at: string };
type PackRow = { id: string; name: string; slug: string; description: string; accent: PackAccent; is_published: number; created_at: string; updated_at: string; submission_count?: number };

function mapSubmission(row: SubmissionRow): Submission {
  return { id: row.id, packId: row.pack_id, name: row.name, question: row.question_text, receiptCode: row.receipt_code, isQueued: Boolean(row.is_queued), position: row.position === null ? null : Number(row.position), createdAt: row.created_at, updatedAt: row.updated_at || row.created_at };
}

export function listSubmissions(packId: string) {
  const rows = getDatabase().prepare("SELECT * FROM submissions WHERE pack_id = ? ORDER BY created_at DESC").all(packId) as unknown as SubmissionRow[];
  return rows.map(mapSubmission);
}

function getQueue(packId: string) {
  const rows = getDatabase().prepare("SELECT * FROM submissions WHERE pack_id = ? AND is_queued = 1 ORDER BY position ASC, created_at ASC").all(packId) as unknown as SubmissionRow[];
  return rows.map(mapSubmission);
}

function mapPack(row: PackRow): Pack {
  return { id: row.id, name: row.name, slug: row.slug, description: row.description, accent: row.accent, isPublished: Boolean(row.is_published), queue: getQueue(row.id), submissionCount: Number(row.submission_count ?? 0), createdAt: row.created_at, updatedAt: row.updated_at };
}

export function listPacks(options?: { publishedOnly?: boolean }) {
  const where = options?.publishedOnly ? "WHERE p.is_published = 1" : "";
  const rows = getDatabase().prepare(`SELECT p.*, COUNT(s.id) AS submission_count FROM packs p LEFT JOIN submissions s ON s.pack_id = p.id ${where} GROUP BY p.id ORDER BY p.updated_at DESC`).all() as unknown as PackRow[];
  return rows.map(mapPack);
}

export function getPackById(id: string) {
  const row = getDatabase().prepare("SELECT p.*, COUNT(s.id) AS submission_count FROM packs p LEFT JOIN submissions s ON s.pack_id = p.id WHERE p.id = ? GROUP BY p.id").get(id) as PackRow | undefined;
  return row ? mapPack(row) : null;
}

export function getPackBySlug(slug: string) {
  const row = getDatabase().prepare("SELECT p.*, COUNT(s.id) AS submission_count FROM packs p LEFT JOIN submissions s ON s.pack_id = p.id WHERE p.slug = ? GROUP BY p.id").get(slug) as PackRow | undefined;
  return row ? mapPack(row) : null;
}

type PackInput = { name: string; slug: string; description: string; accent: PackAccent; isPublished: boolean };
export function createPack(input: PackInput) {
  const id = randomUUID(); const now = new Date().toISOString();
  getDatabase().prepare("INSERT INTO packs (id,name,slug,description,accent,is_published,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)").run(id, input.name, input.slug, input.description, input.accent, input.isPublished ? 1 : 0, now, now);
  return getPackById(id)!;
}

export function updatePack(id: string, input: PackInput) {
  const result = getDatabase().prepare("UPDATE packs SET name=?,slug=?,description=?,accent=?,is_published=?,updated_at=? WHERE id=?").run(input.name, input.slug, input.description, input.accent, input.isPublished ? 1 : 0, new Date().toISOString(), id);
  return Number(result.changes) ? getPackById(id) : null;
}

export function deletePack(id: string) { return Number(getDatabase().prepare("DELETE FROM packs WHERE id=?").run(id).changes) > 0; }

export function createSubmission(packId: string, token: string, name: string, question: string) {
  const database = getDatabase();
  const existing = database.prepare("SELECT * FROM submissions WHERE pack_id=? AND submission_token=?").get(packId, token) as SubmissionRow | undefined;
  if (existing) return { submission: mapSubmission(existing), duplicate: true };
  const id = randomUUID(); const now = new Date().toISOString(); const receiptCode = `Q-${randomBytes(3).toString("hex").toUpperCase()}`;
  database.prepare("INSERT INTO submissions (id,pack_id,submission_token,receipt_code,answers_json,name,question_text,is_queued,position,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
    .run(id, packId, token, receiptCode, "{}", name, question, 0, null, now, now);
  return { submission: mapSubmission(database.prepare("SELECT * FROM submissions WHERE id=?").get(id) as SubmissionRow), duplicate: false };
}

export function updateSubmission(id: string, input: { name: string; question: string }) {
  const now = new Date().toISOString();
  const result = getDatabase().prepare("UPDATE submissions SET name=?,question_text=?,updated_at=? WHERE id=?").run(input.name, input.question, now, id);
  if (!Number(result.changes)) return null;
  return mapSubmission(getDatabase().prepare("SELECT * FROM submissions WHERE id=?").get(id) as SubmissionRow);
}

export function deleteSubmission(id: string) { return Number(getDatabase().prepare("DELETE FROM submissions WHERE id=?").run(id).changes) > 0; }

export function setQueue(packId: string, submissionIds: string[]) {
  const database = getDatabase(); const now = new Date().toISOString(); database.exec("BEGIN IMMEDIATE");
  try {
    database.prepare("UPDATE submissions SET is_queued=0,position=NULL,updated_at=? WHERE pack_id=?").run(now, packId);
    const set = database.prepare("UPDATE submissions SET is_queued=1,position=?,updated_at=? WHERE id=? AND pack_id=?");
    submissionIds.forEach((id, position) => set.run(position, now, id, packId));
    database.prepare("UPDATE packs SET updated_at=? WHERE id=?").run(now, packId); database.exec("COMMIT");
  } catch (error) { database.exec("ROLLBACK"); throw error; }
  return getPackById(packId);
}

export function getStudioStats() {
  const row = getDatabase().prepare("SELECT (SELECT COUNT(*) FROM packs) AS packs,(SELECT COUNT(*) FROM submissions) AS submissions,(SELECT COUNT(*) FROM submissions WHERE is_queued=1) AS queued").get() as { packs: number; submissions: number; queued: number };
  return { packs: Number(row.packs), submissions: Number(row.submissions), queued: Number(row.queued) };
}
