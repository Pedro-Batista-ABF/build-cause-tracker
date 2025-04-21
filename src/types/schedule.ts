
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
  predecessor_id: string | null;
  created_at?: string;
}

export interface Activity {
  id: string;
  name: string;
  discipline: string | null;
}

export interface LinkedActivity {
  id: string;
  atividade_lps_id: string | null;
  activities?: {
    id: string;
    name: string;
  } | null;
}
