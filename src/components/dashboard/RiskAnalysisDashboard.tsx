
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RiscoAtraso } from "@/types/database";

export function RiskAnalysisDashboard() {
  const { data: risks = [], isLoading } = useQuery({
    queryKey: ['dashboard-risks'],
    queryFn: async () => {
      try {
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
        
        if (error) throw error;
        
        return data.map((risk: RiscoAtraso) => ({
          id: risk.id,
          atividade_id: risk.atividade_id,
          atividade_nome: risk.activities?.name || 'Atividade sem nome',
          risco_atraso_pct: risk.risco_atraso_pct,
          classificacao: risk.classificacao,
          discipline: risk.activities?.discipline,
          responsible: risk.activities?.responsible
        }));
      } catch (error) {
        console.error('Error fetching risk analysis:', error);
        return [];
      }
    },
  });

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
                className="flex justify-between items-center p-2 bg-card hover:bg-muted/20 rounded"
              >
                <div className="truncate flex-1 mr-2">
                  <p className="text-sm">{risk.atividade_nome}</p>
                  {(risk.responsible || risk.discipline) && (
                    <p className="text-xs text-muted-foreground">
                      {risk.discipline && `${risk.discipline} · `}
                      {risk.responsible}
                    </p>
                  )}
                </div>
                <Badge className="bg-accent-red text-white shrink-0">
                  {Math.round(risk.risco_atraso_pct)}%
                </Badge>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/planning">Ver todos os riscos</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
