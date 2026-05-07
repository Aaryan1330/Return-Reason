export type ReviewStatus =
  | 'pending'
  | 'in_review'
  | 'action_taken'
  | 'resolved'
  | 'escalated';

export interface SkuReview {
  id: number;
  sku_group: string;
  category: string | null;
  return_pct: number | null;
  online_inventory: number | null;
  image_url: string | null;
  week_date: string;

  // Production team fills these
  size_check: boolean | null;
  size_issue_found: boolean | null;
  fit_trial_done: boolean | null;
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
  pending: number;
  in_review: number;
  action_taken: number;
  resolved: number;
  escalated: number;
}

export const STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: 'Not Started',
  in_review: 'Under Review',
  action_taken: 'Action Taken',
  resolved: 'Resolved',
  escalated: 'Escalated',
};

export const STATUS_COLORS: Record<ReviewStatus, string> = {
  pending: 'bg-gray-100 text-gray-600',
  in_review: 'bg-blue-100 text-blue-700',
  action_taken: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
  escalated: 'bg-red-100 text-red-700',
};
