import { SummaryStats } from '@/types';

const CARDS = [
  {
    key: 'total' as const,
    label: 'Total SKUs',
    bg: 'bg-white border-gray-200',
    num: 'text-gray-900',
    bar: '',
  },
  {
    key: 'warehouse' as const,
    label: 'Warehouse',
    sub: 'Pending → Sample at HQ',
    bg: 'bg-orange-50 border-orange-200',
    num: 'text-orange-700',
    bar: 'bg-orange-400',
  },
  {
    key: 'qc' as const,
    label: 'QC',
    sub: 'Under QC → QC Done',
    bg: 'bg-blue-50 border-blue-200',
    num: 'text-blue-700',
    bar: 'bg-blue-500',
  },
  {
    key: 'catalog' as const,
    label: 'Catalog',
    sub: 'Under Catalog → Done',
    bg: 'bg-violet-50 border-violet-200',
    num: 'text-violet-700',
    bar: 'bg-violet-500',
  },
  {
    key: 'tech' as const,
    label: 'Tech',
    sub: 'Size Chart Revision',
    bg: 'bg-pink-50 border-pink-200',
    num: 'text-pink-700',
    bar: 'bg-pink-500',
  },
  {
    key: 'complete' as const,
    label: 'Complete',
    sub: 'All stages done',
    bg: 'bg-green-50 border-green-200',
    num: 'text-green-700',
    bar: 'bg-green-500',
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
            <div className="text-xs text-gray-700 mt-1 font-semibold leading-tight">{card.label}</div>
            {'sub' in card && (
              <div className="text-xs text-gray-400 mt-0.5 leading-tight">{(card as any).sub}</div>
            )}
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
