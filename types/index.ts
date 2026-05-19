export type ReviewStatus = 'warehouse' | 'qc' | 'catalog' | 'tech' | 'completed';
export type SkuType = 'weekly' | 'repeat';
export type UserRole = 'admin' | 'warehouse' | 'qc' | 'catalog' | 'tech';

export const TEAM_STATUSES = {
  warehouse: ['warehouse'] as ReviewStatus[],
  qc:        ['qc']        as ReviewStatus[],
  catalog:   ['catalog']   as ReviewStatus[],
  tech:      ['tech']      as ReviewStatus[],
};

export const STATUS_LABELS: Record<ReviewStatus, string> = {
  warehouse: 'Warehouse',
  qc:        'QC',
  catalog:   'Catalog',
  tech:      'Tech',
  completed: 'Completed',
};

export const STATUS_COLORS: Record<ReviewStatus, string> = {
  warehouse: 'bg-orange-100 text-orange-700',
  qc:        'bg-blue-100 text-blue-700',
  catalog:   'bg-violet-100 text-violet-700',
  tech:      'bg-pink-100 text-pink-700',
  completed: 'bg-green-100 text-green-700',
};

export type SizeChartData = Record<string, Record<string, string>>;

export interface SkuReview {
  id: number;
  sku_group: string;
  category: string | null;
  l1_category: string | null;
  vendor: string | null;
  return_pct: number | null;
  online_inventory: number | null;
  total_inventory: number | null;
  image_url: string | null;
  week_date: string;
  type: SkuType;

  // Size-wise returns
  xs_return: number | null;
  s_return: number | null;
  m_return: number | null;
  l_return: number | null;
  xl_return: number | null;
  xxl_return: number | null;
  xl3_return: number | null;
  xl4_return: number | null;
  xl5_return: number | null;
  xl6_return: number | null;

  // SKU-level fit metrics (from CSV)
  size_too_big: number | null;
  size_too_small: number | null;

  // Per-size fit metrics (from CSV)
  xs_too_big: number | null;  xs_too_small: number | null;
  s_too_big: number | null;   s_too_small: number | null;
  m_too_big: number | null;   m_too_small: number | null;
  l_too_big: number | null;   l_too_small: number | null;
  xl_too_big: number | null;  xl_too_small: number | null;
  xxl_too_big: number | null; xxl_too_small: number | null;
  xl3_too_big: number | null; xl3_too_small: number | null;
  xl4_too_big: number | null; xl4_too_small: number | null;
  xl5_too_big: number | null; xl5_too_small: number | null;
  xl6_too_big: number | null; xl6_too_small: number | null;

  // Warehouse
  sample_at_hq: boolean | null;

  // QC
  sample_required: boolean | null;
  sizes_to_order: Record<string, boolean> | null;
  sample_order_created: boolean | null;
  size_check: boolean | null;
  fit_trial_done: boolean | null;
  size_issue_found: boolean | null;
  need_size_chart_updation: boolean | null;
  size_chart_update: SizeChartData | null;
  debit_note_raised: boolean | null;
  remarks: string | null;

  // Catalog
  description_updated: boolean | null;
  description_update_notes: string | null;

  // Tech
  size_chart_updated: boolean | null;

  review_status: ReviewStatus;

  last_updated_by: number | null;
  last_updated_by_name: string | null;
  last_updated_at: string | null;
  created_at: string;
}

export interface SummaryStats {
  total:     number;
  warehouse: number;
  qc:        number;
  catalog:   number;
  tech:      number;
  completed: number;
}
