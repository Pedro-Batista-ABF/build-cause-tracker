
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
  saldoAExecutar?: number; 
  daily_progress?: any[];
}
