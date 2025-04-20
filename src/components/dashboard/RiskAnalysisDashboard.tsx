
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface RiskItem {
  id: string;
  atividade_id: string;
  atividade_nome: string;
  risco_atraso_pct: number;
  classificacao: 'BAIXO' | 'MÉDIO' | 'ALTO';
  discipline?: string;
  responsible?: string;
}

interface RiscoAtrasoRow {
  id: string;
  atividade_id: string;
  risco_atraso_pct: number;
  classificacao: string;
  activities?: {
    name: string;
    discipline?: string;
    responsible?: string;
  };
}

export function RiskAnalysisDashboard() {
  const { data: risks = [], isLoading } = useQuery({
    queryKey: ['dashboard-risks'],
    queryFn: async () => {
      try {
        // Checar se a tabela existe primeiro
        const { error: checkError } = await supabase
          .from('risco_atraso')
          .select('id')
          .limit(1);
          
        if (checkError) {
          console.log("A tabela risco_atraso pode não existir ainda:", checkError.message);
          return [];
        }
        
        // Se a tabela existir, buscar os dados
        const { data, error } = await supabase
          .from('risco_atraso')
          .select(`
            id,
            atividade_id,
            risco_atraso_pct,
            classificacao,
            activities (
              name,
              discipline,
              responsible
            )
          `)
          .eq('classificacao', 'ALTO')
          .order('risco_atraso_pct', { ascending: false })
          .limit(5);
        
        if (error) {
          console.error("Erro ao buscar análise de risco:", error);
          toast.error("Erro ao carregar dados de risco");
          throw error;
        }
        
        return (data as RiscoAtrasoRow[]).map(risk => ({
          id: risk.id,
          atividade_id: risk.atividade_id,
          atividade_nome: risk.activities?.name || 'Atividade sem nome',
          risco_atraso_pct: risk.risco_atraso_pct,
          classificacao: risk.classificacao as 'BAIXO' | 'MÉDIO' | 'ALTO',
          discipline: risk.activities?.discipline,
          responsible: risk.activities?.responsible
        }));
      } catch (error) {
        console.error('Error fetching risk analysis:', error);
        return [];
      }
    },
  });

  const getRiskColor = (riskPct: number): string => {
    if (riskPct >= 80) return "bg-accent-red text-white";
    if (riskPct >= 50) return "bg-orange-500 text-white";
    return "bg-amber-500 text-white";
  }; 

  return (
    <Card className="md:col-span-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-accent-red" />
          Risco de Atraso
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-8 bg-muted/20 animate-pulse rounded" />
            ))}
          </div>
        ) : risks.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            Nenhuma atividade com alto risco de atraso.
          </p>
        ) : (
          <div className="space-y-2">
            {risks.map(risk => (
              <div 
                key={risk.id} 
                className="flex justify-between items-center p-2 bg-card hover:bg-muted/20 rounded transition-colors"
              >
                <div className="truncate flex-1 mr-2">
                  <p className="text-sm font-medium">{risk.atividade_nome}</p>
                  {(risk.responsible || risk.discipline) && (
                    <p className="text-xs text-muted-foreground">
                      {risk.discipline && `${risk.discipline} · `}
                      {risk.responsible}
                    </p>
                  )}
                </div>
                <Badge className={`${getRiskColor(risk.risco_atraso_pct)} shrink-0`}>
                  {Math.round(risk.risco_atraso_pct)}%
                </Badge>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" size="sm" asChild className="flex items-center gap-1">
            <Link to="/planning">
              Ver todos os riscos
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
