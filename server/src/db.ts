import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, '../../data/tax-cockpit.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  initSchema(db);
  return db;
}

export function initSchema(d: Database.Database): void {
  d.exec(`
    CREATE TABLE IF NOT EXISTS risk_categories (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      weight REAL NOT NULL,
      color TEXT NOT NULL,
      base_score REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subsidiaries (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      industry TEXT NOT NULL,
      vat_rate TEXT NOT NULL,
      revenue REAL NOT NULL,
      tax_burden REAL NOT NULL,
      gross_margin REAL NOT NULL,
      expense_ratio REAL NOT NULL,
      income_gap REAL NOT NULL,
      score_invoice REAL NOT NULL,
      score_income REAL NOT NULL,
      score_prefer REAL NOT NULL,
      score_related REAL NOT NULL,
      score_payroll REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS issues (
      id INTEGER PRIMARY KEY,
      sub_id TEXT NOT NULL,
      cat_code TEXT NOT NULL,
      level TEXT NOT NULL,
      desc TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL,
      owner TEXT NOT NULL,
      counterparty TEXT NOT NULL,
      date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS evidence_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      issue_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      columns TEXT NOT NULL,
      rows TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS monthly_metrics (
      sub_id TEXT NOT NULL,
      month TEXT NOT NULL,
      tax REAL NOT NULL,
      gross_margin REAL NOT NULL,
      expense REAL NOT NULL,
      gap REAL NOT NULL,
      PRIMARY KEY (sub_id, month)
    );

    CREATE INDEX IF NOT EXISTS idx_issues_sub ON issues(sub_id);
    CREATE INDEX IF NOT EXISTS idx_issues_cat ON issues(cat_code);
    CREATE INDEX IF NOT EXISTS idx_evidence_issue ON evidence_items(issue_id);
  `);
}
