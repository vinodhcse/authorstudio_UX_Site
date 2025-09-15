// jsx runtime handles React import
import { motion, AnimatePresence } from 'framer-motion';
import { useJobsStore, selectRunningJobs, selectRecentJobs, JobRecord } from '../stores/jobs';

export interface JobsPopupProps {
  open: boolean;
  onClose: () => void;
}

function JobRow({ job }: { job: JobRecord }) {
  const statusColor = job.status === 'completed' ? 'text-green-500' : job.status === 'failed' ? 'text-red-500' : 'text-yellow-400';
  const title = job.type === 'import_docx' ? 'Import DOCX' : job.type === 'export' ? 'Export' : job.type === 'ai' ? 'AI Task' : 'Job';
  return (
    <div className="p-2 rounded-md hover:bg-white/5 dark:hover:bg-black/5 border border-transparent hover:border-white/10 dark:hover:border-black/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${statusColor}`}>{job.status.toUpperCase()}</span>
          <span className="text-xs text-white/80 dark:text-black/80">{title}</span>
        </div>
        <span className="text-xs text-white/50 dark:text-black/50">{Math.round(job.progress)}%</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-white/10 dark:bg-black/10 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-sky-400 to-green-500" style={{ width: `${Math.min(job.progress || 0, 100)}%` }} />
      </div>
      {job.meta?.fileName && (
        <div className="mt-1 text-[11px] text-white/60 dark:text-black/60 truncate">{job.meta.fileName}</div>
      )}
      {job.error && job.status === 'failed' && (
        <div className="mt-1 text-[11px] text-red-400 truncate">{job.error}</div>
      )}
    </div>
  );
}

export function JobsPopup({ open, onClose }: JobsPopupProps) {
  const jobs = useJobsStore(s => s.jobs);
  const running = selectRunningJobs({ jobs } as any);
  const recent = selectRecentJobs({ jobs } as any, 8);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed bottom-14 left-1/2 -translate-x-1/2 z-[60]"
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="w-96 max-h-[60vh] overflow-y-auto rounded-xl shadow-2xl border border-white/10 dark:border-black/10 bg-gradient-to-br from-gray-800 to-black dark:from-slate-100 dark:to-white p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white dark:text-black">Jobs</h3>
              <button onClick={onClose} className="text-xs text-white/60 dark:text-black/60 hover:underline">Close</button>
            </div>
            {running.length > 0 && (
              <div className="mb-3">
                <div className="text-[11px] uppercase tracking-wide text-white/50 dark:text-black/50 mb-1">Running</div>
                <div className="flex flex-col gap-2">
                  {running.map(j => <JobRow key={j.id} job={j} />)}
                </div>
              </div>
            )}
            <div>
              <div className="text-[11px] uppercase tracking-wide text-white/50 dark:text-black/50 mb-1">Recent</div>
              <div className="flex flex-col gap-2">
                {recent.map(j => <JobRow key={j.id} job={j} />)}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default JobsPopup;
