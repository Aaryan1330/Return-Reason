import { SummaryStats } from '@/types';

const CARDS = [
  {
    key: 'total' as const,
    label: 'Total SKUs This Week',
    bg: 'bg-white border-gray-200',
    num: 'text-gray-900',
    bar: '',
  },
  {
    key: 'pending' as const,
    label: 'Not Started',
    bg: 'bg-gray-50 border-gray-200',
    num: 'text-gray-500',
    bar: 'bg-gray-400',
  },
  {
    key: 'in_review' as const,
    label: 'Under Review',
    bg: 'bg-blue-50 border-blue-200',
    num: 'text-blue-700',
    bar: 'bg-blue-500',
  },
  {
    key: 'action_taken' as const,
    label: 'Action Taken',
    bg: 'bg-yellow-50 border-yellow-200',
    num: 'text-yellow-700',
    bar: 'bg-yellow-500',
  },
  {
    key: 'resolved' as const,
    label: 'Resolved',
    bg: 'bg-green-50 border-green-200',
    num: 'text-green-700',
    bar: 'bg-green-500',
  },
  {
    key: 'escalated' as const,
    label: 'Escalated',
    bg: 'bg-red-50 border-red-200',
    num: 'text-red-700',
    bar: 'bg-red-500',
  },
] as const;

export default function SummaryCards({ stats }: { stats: SummaryStats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {CARDS.map((card) => {
        const count = stats[card.key];
        const pct = stats.total > 0 && card.key !== 'total' ? (count / stats.total) * 100 : 0;
        return (
          <div key={card.key} className={`rounded-xl border p-4 ${card.bg}`}>
            <div className={`text-3xl font-bold tabular-nums ${card.num}`}>{count}</div>
            <div className="text-xs text-gray-500 mt-1 font-medium leading-tight">{card.label}</div>
            {card.key !== 'total' && (
              <div className="mt-3 h-1 bg-white rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${card.bar}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
