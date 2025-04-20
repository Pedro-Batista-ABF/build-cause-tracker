import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Cause {
  cause: string;
  count: number;
  category: string;
}

export interface CausesAnalysisProps {
  causes?: Cause[];
  period?: string;
  startDate?: Date;
  endDate?: Date;
  className?: string;
}

export function CausesAnalysis({ causes = [], period, startDate, endDate, className }: CausesAnalysisProps) {
  const { data: dbCauses = [], isLoading } = useQuery({
    queryKey: ['causes-dashboard', period, startDate, endDate],
    queryFn: async () => {
      // Use the passed causes prop if available, otherwise fetch from database
      if (causes && causes.length > 0) {
        return causes;
      }

      // Fetch causes within the specified date range if provided, otherwise last 4 weeks
      const today = new Date();
      const pastDate = startDate || new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000); // 4 weeks ago by default

      const { data: progressCauses, error } = await supabase
        .from('progress_causes')
        .select(`
          id,
          notes,
          created_at,
          causes:cause_id(id, name, category)
        `)
        .gte('created_at', pastDate.toISOString())
        .lte('created_at', (endDate || today).toISOString());

      if (error) {
        console.error("Error fetching causes for dashboard:", error);
        toast.error("Erro ao carregar dados de causas");
        return [];
      }

      // Process and group data by cause
      const causeMap = new Map<string, { cause: string, category: string, count: number }>();

      progressCauses?.forEach(item => {
        if (item.causes) {
          const causeId = item.causes.id;
          const causeName = item.causes.name;
          const category = item.causes.category || 'Não categorizado';

          if (causeMap.has(causeId)) {
            const currentCause = causeMap.get(causeId)!;
            causeMap.set(causeId, { 
              ...currentCause, 
              count: currentCause.count + 1 
            });
          } else {
            causeMap.set(causeId, { 
              cause: causeName, 
              category: category, 
              count: 1 
            });
          }
        }
      });

      // Convert map to array and sort by count
      const causesArray = Array.from(causeMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return causesArray;
    }
  });

  const displayCauses = causes.length > 0 ? causes : dbCauses;
  
  // Find maximum count for percentage calculation
  const maxCount = Math.max(...displayCauses.map(cause => cause.count), 1);

  return (
    <Card className={`bg-card-bg border-border-subtle ${className}`}>
      <CardHeader>
        <CardTitle className="text-text-primary">Principais Causas</CardTitle>
        <CardDescription className="text-text-secondary">
          Causas mais frequentes de baixo PPC
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center">
            <p className="text-text-secondary">Carregando causas...</p>
          </div>
        ) : displayCauses.length > 0 ? (
          <div className="space-y-4">
            {displayCauses.map((cause, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-text-primary">{cause.cause}</div>
                  <div className="text-sm text-text-secondary">
                    {cause.category}
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-32 h-2 bg-border rounded-full overflow-hidden mr-2">
                    <div
                      className="h-full bg-accent-red"
                      style={{ width: `${(cause.count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-text-primary">{cause.count}</span>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full border-border-subtle text-text-primary hover:bg-hover-bg" asChild>
              <Link to="/causes">Ver análise detalhada</Link>
            </Button>
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-text-secondary">Nenhuma causa registrada no período selecionado</p>
            <Button variant="outline" className="mt-4 border-border-subtle text-text-primary hover:bg-hover-bg" asChild>
              <Link to="/causes">Ver análise detalhada</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
