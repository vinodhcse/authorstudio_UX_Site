import { create } from 'zustand';

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'canceled';
export type JobType = 'import_docx' | 'export' | 'ai' | 'other';

export interface JobRecord {
  id: string;
  type: JobType;
  status: JobStatus;
  progress: number; // 0-100
  totalSteps?: number;
  currentStep?: number;
  meta?: Record<string, any>;
  startedAt: number;
  endedAt?: number;
  error?: string;
}

interface JobsState {
  jobs: JobRecord[];
  add: (job: JobRecord) => void;
  update: (id: string, update: Partial<JobRecord>) => void;
  complete: (id: string) => void;
  fail: (id: string, error?: string) => void;
  clearOld: (maxCount?: number) => void;
}

export const useJobsStore = create<JobsState>((set) => ({
  jobs: [],
  add: (job) => set((s) => ({ jobs: [job, ...s.jobs].slice(0, 100) })),
  update: (id, update) => set((s) => ({
    jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...update } : j)),
  })),
  complete: (id) => set((s) => ({
    jobs: s.jobs.map((j) => (j.id === id ? { ...j, status: 'completed', progress: 100, endedAt: Date.now() } : j)),
  })),
  fail: (id, error) => set((s) => ({
    jobs: s.jobs.map((j) => (j.id === id ? { ...j, status: 'failed', error: error || j.error, endedAt: Date.now() } : j)),
  })),
  clearOld: (maxCount = 50) => set((s) => ({ jobs: s.jobs.slice(0, maxCount) })),
}));

// Helper selectors
export const selectRunningJobs = (state: JobsState) => state.jobs.filter(j => j.status === 'running' || j.status === 'queued');
export const selectRecentJobs = (state: JobsState, limit = 10) => state.jobs.slice(0, limit);
