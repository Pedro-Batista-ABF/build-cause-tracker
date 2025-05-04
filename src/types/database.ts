
export interface Activity {
  id: string;
  name: string;
  discipline: string | null;
  responsible: string | null;
  team: string | null;
  unit: string | null;
  total_qty: number | null;
  progress: number;
  ppc: number;
  adherence: number;
  start_date?: string | null;
  end_date?: string | null;
  schedule_start_date?: string | null;
  schedule_end_date?: string | null;
  schedule_predecessor_id?: string | null;
  schedule_duration_days?: number | null;
  schedule_percent_complete?: number | null;
  has_detailed_schedule?: boolean;
  saldoAExecutar?: number;
  daily_progress?: any[];
  project_id?: string | null;
  description?: string | null;
}

export interface PlanningReport {
  id: string;
  content: string;
  created_at: string;
  is_current: boolean;
  created_by: string | null;
}

export interface ActivityScheduleItem {
  id: string;
  activity_id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  duration_days: number | null;
  predecessor_item_id: string | null;
  percent_complete: number;
  order_index: number;
}

export interface DailyProgress {
  id: string;
  activity_id: string;
  date: string;
  actual_qty: number;
  planned_qty: number;
  created_at?: string;
  updated_at?: string;
}
