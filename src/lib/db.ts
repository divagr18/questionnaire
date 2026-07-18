import "server-only";

import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const databasePath = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.join(process.cwd(), "data", "event-studio.db");

type DatabaseGlobal = typeof globalThis & { __eventStudioDatabase?: DatabaseSync };

function addColumn(database: DatabaseSync, name: string, definition: string) {
  const columns = database.prepare("PRAGMA table_info(submissions)").all() as unknown as Array<{ name: string }>;
  if (!columns.some((column) => column.name === name)) database.exec(`ALTER TABLE submissions ADD COLUMN ${definition}`);
}

function initialiseDatabase(database: DatabaseSync) {
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = FULL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;

    CREATE TABLE IF NOT EXISTS packs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      accent TEXT NOT NULL DEFAULT 'plum',
      is_published INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      pack_id TEXT NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
      submission_token TEXT NOT NULL,
      receipt_code TEXT NOT NULL UNIQUE,
      answers_json TEXT NOT NULL DEFAULT '{}',
      name TEXT NOT NULL DEFAULT '',
      question_text TEXT NOT NULL DEFAULT '',
      is_queued INTEGER NOT NULL DEFAULT 0,
      position INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT '',
      UNIQUE(pack_id, submission_token)
    );

    CREATE INDEX IF NOT EXISTS idx_submissions_pack ON submissions(pack_id, created_at);
  `);

  addColumn(database, "name", "name TEXT NOT NULL DEFAULT ''");
  addColumn(database, "question_text", "question_text TEXT NOT NULL DEFAULT ''");
  addColumn(database, "is_queued", "is_queued INTEGER NOT NULL DEFAULT 0");
  addColumn(database, "position", "position INTEGER");
  addColumn(database, "updated_at", "updated_at TEXT NOT NULL DEFAULT ''");
  database.exec("CREATE INDEX IF NOT EXISTS idx_submissions_queue ON submissions(pack_id, is_queued, position)");

  const packs = database.prepare("SELECT COUNT(*) AS count FROM packs").get() as { count: number };
  if (Number(packs.count) === 0) {
    const now = new Date().toISOString();
    database.prepare(`INSERT INTO packs
      (id, name, slug, description, accent, is_published, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(randomUUID(), "Opening questions", "opening-questions", "Questions from the room, curated live.", "plum", 1, now, now);
  }
}

export function getDatabase() {
  const globalDatabase = globalThis as DatabaseGlobal;
  if (!globalDatabase.__eventStudioDatabase) {
    mkdirSync(path.dirname(databasePath), { recursive: true });
    const database = new DatabaseSync(databasePath);
    initialiseDatabase(database);
    globalDatabase.__eventStudioDatabase = database;
  }
  return globalDatabase.__eventStudioDatabase;
}
