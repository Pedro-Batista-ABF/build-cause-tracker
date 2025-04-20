export interface RiscoAtraso {
  id: string;
  atividade_id: string;
  semana: string;
  risco_atraso_pct: number;
  classificacao: 'BAIXO' | 'MÉDIO' | 'ALTO';
  created_at: string;
  activities?: {
    name: string;
    discipline?: string;
    responsible?: string;
  };
}

export interface PlanningReport {
  id: string;
  content: string;
  created_at: string;
  is_current: boolean;
  created_by: string | null;
}
