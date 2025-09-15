import Dexie, { Table } from 'dexie';

export interface AIUsageRow {
  id: string;
  ts: number;
  featureId: string;
  providerId: string;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  costUsd: number | null;
  durationMs: number;
  status: 'ok' | 'error' | 'aborted';
  errorMessage: string | null;
  projectId?: string;
  bookId?: string;
  meta?: any;
  synced?: 0 | 1;
}

class UsageDB extends Dexie {
  ai_usage!: Table<AIUsageRow, string>;
  constructor() {
    super('authorstudio_usage');
    this.version(1).stores({ ai_usage: 'id, ts, featureId, providerId, model, status, synced' });
  }
}

const db = new UsageDB();

export async function logUsage(row: Omit<AIUsageRow, 'synced' | 'ts' | 'id'> & Partial<Pick<AIUsageRow, 'synced' | 'ts' | 'id'>>) {
  const id = row.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  await db.ai_usage.add({
    id,
    ts: row.ts || Date.now(),
    synced: row.synced ?? 0,
    featureId: row.featureId,
    providerId: row.providerId,
    model: row.model,
    inputTokens: row.inputTokens ?? null,
    outputTokens: row.outputTokens ?? null,
    costUsd: row.costUsd ?? null,
    durationMs: row.durationMs ?? 0,
    status: row.status,
    errorMessage: row.errorMessage ?? null,
    projectId: row.projectId,
    bookId: row.bookId,
    meta: row.meta,
  });
}
