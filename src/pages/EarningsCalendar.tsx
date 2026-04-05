import { CalendarDays } from 'lucide-react';

const EarningsCalendar = () => (
  <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
    <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)]">
      <CalendarDays size={32} className="text-[var(--accent-blue)]" />
    </div>
    <h2 className="text-sm font-black uppercase tracking-[0.3em] text-[var(--text-primary)]">Earnings Calendar</h2>
    <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest">Coming Soon</p>
  </div>
);

export default EarningsCalendar;
