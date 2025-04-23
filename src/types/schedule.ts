export interface ScheduleTask {
  id: string;
  projeto_id: string;
  tarefa_id: string;
  nome: string;
  data_inicio: string | null;
  data_termino: string | null;
  duracao_dias: number | null;
  wbs: string | null;
  percentual_previsto: number | null;
  percentual_real: number | null;
  nivel_hierarquia: number | null;
  atividade_lps_id: string | null;
  inicio_linha_base: string | null;
  termino_linha_base: string | null;
  predecessores: string | null;
  predecessor_id?: string | null; // Keep for backward compatibility
  created_at?: string;
}

export interface Activity {
  id: string;
  name: string;
  discipline: string | null;
  schedule?: ActivitySchedule | null;
}

export interface ActivitySchedule {
  start_date: string | null;
  end_date: string | null;
  predecessor_id: string | null;
  duration_days: number | null;
  percent_complete: number | null;
}

export interface LinkedActivity {
  id: string;
  atividade_lps_id: string | null;
  activities?: {
    id: string;
    name: string;
  } | null;
}

export interface ScheduleAnalysis {
  projeto: string;
  semana: string;
  analise_geral: string;
  atividades_em_alerta: {
    atividade: string;
    desvio_dias: number;
    impacto: string;
  }[];
  acoes_recomendadas: string[];
}
