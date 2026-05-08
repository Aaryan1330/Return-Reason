export type ReviewStatus =
  | 'pending'
  | 'sample_ordered'
  | 'sample_at_hq'
  | 'under_qc'
  | 'qc_done'
  | 'under_catalog'
  | 'catalog_done'
  | 'size_chart_revision'
  | 'complete';

export type SkuType = 'weekly' | 'repeat';

export const TEAM_STATUSES = {
  warehouse: ['pending', 'sample_ordered', 'sample_at_hq'] as ReviewStatus[],
  qc:        ['under_qc', 'qc_done'] as ReviewStatus[],
  catalog:   ['under_catalog', 'catalog_done'] as ReviewStatus[],
  tech:      ['size_chart_revision', 'complete'] as ReviewStatus[],
};

export const STATUS_LABELS: Record<ReviewStatus, string> = {
  pending:             'Not Started',
  sample_ordered:      'Sample Order Created',
  sample_at_hq:        'Sample at HQ',
  under_qc:            'Under QC',
  qc_done:             'QC Done',
  under_catalog:       'Under Catalog Review',
  catalog_done:        'Catalog Done',
  size_chart_revision: 'Size Chart Revision',
  complete:            'Complete',
};

export const STATUS_COLORS: Record<ReviewStatus, string> = {
  pending:             'bg-gray-100 text-gray-500',
  sample_ordered:      'bg-orange-100 text-orange-700',
  sample_at_hq:        'bg-amber-100 text-amber-700',
  under_qc:            'bg-blue-100 text-blue-700',
  qc_done:             'bg-cyan-100 text-cyan-700',
  under_catalog:       'bg-violet-100 text-violet-700',
  catalog_done:        'bg-purple-100 text-purple-700',
  size_chart_revision: 'bg-pink-100 text-pink-700',
  complete:            'bg-green-100 text-green-700',
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

  // Production team fills these
  size_check: boolean | null;
  fit_trial_done: boolean | null;
  size_issue_found: boolean | null;
  size_chart_update: SizeChartData | null;
  debit_note_raised: boolean | null;
  remarks: string | null;
  description_updated: boolean | null;
  description_update_notes: string | null;

  review_status: ReviewStatus;

  last_updated_by: number | null;
  last_updated_by_name: string | null;
  last_updated_at: string | null;
  created_at: string;
}

export interface SummaryStats {
  total: number;
  warehouse: number;
  qc: number;
  catalog: number;
  tech: number;
  complete: number;
}
