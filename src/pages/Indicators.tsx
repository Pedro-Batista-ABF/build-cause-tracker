
import { useState, useEffect } from "react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AreaChart, BarChart, Calendar, Clock } from "lucide-react";
import { CartesianGrid, Legend, Bar, BarChart as ReBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CausesAnalysis } from "@/components/dashboard/CausesAnalysis";
import { format, subDays, startOfWeek, endOfWeek, eachWeekOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface WeeklyData {
  semana: string;
  previsto: number;
  realizado: number;
  aderencia: number;
  startDate: Date;
  endDate: Date;
}

export default function Indicators() {
  const [period, setPeriod] = useState<string>("4weeks");
  
  // Calculate date range based on selected period
  const getPeriodDates = () => {
    const today = new Date();
    
    switch(period) {
      case "2weeks":
        return { startDate: subDays(today, 14), endDate: today };
      case "1month":
        return { startDate: subDays(today, 30), endDate: today };
      case "3months":
        return { startDate: subDays(today, 90), endDate: today };
      case "4weeks":
      default:
        return { startDate: subDays(today, 28), endDate: today };
    }
  };
  
  const { startDate, endDate } = getPeriodDates();

  // Fetch weekly data for PPC
  const { data: weeklyData = [], isLoading: isLoadingWeekly } = useQuery({
    queryKey: ['weekly-ppc-data', period],
    queryFn: async () => {
      try {
        // Generate weeks in the period
        const weeks = eachWeekOfInterval(
          { start: startDate, end: endDate }
        );
        
        const weeklyStats: WeeklyData[] = [];
        
        for (const weekStart of weeks) {
          const weekStartDate = startOfWeek(weekStart, { weekStartsOn: 1 }); // Start on Monday
          const weekEndDate = endOfWeek(weekStart, { weekStartsOn: 1 }); // End on Sunday
          
          // Fetch planned and actual progress for this week
          const { data: progressData, error } = await supabase
            .from('daily_progress')
            .select('date, planned_qty, actual_qty')
            .gte('date', weekStartDate.toISOString().split('T')[0])
            .lte('date', weekEndDate.toISOString().split('T')[0]);
          
          if (error) {
            console.error("Error fetching progress data:", error);
            continue;
          }
          
          // Calculate weekly totals
          const weekPlanned = progressData?.reduce((sum, item) => sum + (Number(item.planned_qty) || 0), 0) || 0;
          const weekActual = progressData?.reduce((sum, item) => sum + (Number(item.actual_qty) || 0), 0) || 0;
          
          // Calculate adherence (avoid division by zero)
          const adherence = weekPlanned > 0 
            ? Math.round((weekActual / weekPlanned) * 100) 
            : 0;
          
          weeklyStats.push({
            semana: `Sem ${format(weekStartDate, 'dd/MM', { locale: ptBR })}`,
            previsto: weekPlanned,
            realizado: weekActual,
            aderencia: adherence,
            startDate: weekStartDate,
            endDate: weekEndDate
          });
        }
        
        return weeklyStats;
      } catch (err) {
        console.error("Error calculating weekly data:", err);
        toast.error("Erro ao carregar dados semanais");
        return [];
      }
    }
  });
  
  // Calculate summary metrics
  const { data: metrics = { ppcAverage: 0, adherence: 0, activeActivities: 0, causesCount: 0 }, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['indicator-metrics', period],
    queryFn: async () => {
      try {
        // Calculate PPC average from weekly data
        const ppcValues = weeklyData.map(week => week.aderencia).filter(val => val > 0);
        const ppcAverage = ppcValues.length > 0 
          ? Math.round(ppcValues.reduce((sum, val) => sum + val, 0) / ppcValues.length) 
          : 0;
          
        // Get active activities count
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('activities')
          .select('id', { count: 'exact' })
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
          
        if (activitiesError) {
          console.error("Error fetching activities count:", activitiesError);
        }
        
        const activeActivities = activitiesData?.length || 0;
        
        // Get causes count
        const { data: causesData, error: causesError } = await supabase
          .from('progress_causes')
          .select('id', { count: 'exact' })
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
          
        if (causesError) {
          console.error("Error fetching causes count:", causesError);
        }
        
        const causesCount = causesData?.length || 0;
        
        // Calculate overall adherence
        const totalPlanned = weeklyData.reduce((sum, week) => sum + week.previsto, 0);
        const totalActual = weeklyData.reduce((sum, week) => sum + week.realizado, 0);
        const adherence = totalPlanned > 0 
          ? Math.round((totalActual / totalPlanned) * 100) 
          : 0;
        
        return {
          ppcAverage,
          adherence,
          activeActivities,
          causesCount
        };
      } catch (err) {
        console.error("Error calculating metrics:", err);
        toast.error("Erro ao calcular métricas");
        return { 
          ppcAverage: 0, 
          adherence: 0, 
          activeActivities: 0, 
          causesCount: 0 
        };
      }
    },
    enabled: weeklyData.length > 0
  });
  
  // Fetch top causes
  const { data: causesData = [], isLoading: isLoadingCauses } = useQuery({
    queryKey: ['top-causes-data', period],
    queryFn: async () => {
      try {
        // Fetch causes joined with progress_causes
        const { data, error } = await supabase
          .from('progress_causes')
          .select(`
            id,
            cause_id,
            created_at,
            causes:cause_id(id, name, category)
          `)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
          
        if (error) {
          console.error("Error fetching causes:", error);
          return [];
        }
        
        // Process and count causes
        const causesMap = new Map();
        
        data.forEach(item => {
          if (item.causes) {
            const causeId = item.causes.id;
            const causeName = item.causes.name;
            const category = item.causes.category || 'Não categorizado';
            
            if (causesMap.has(causeId)) {
              const currentCount = causesMap.get(causeId).count;
              causesMap.set(causeId, { 
                cause: causeName, 
                category: category, 
                count: currentCount + 1 
              });
            } else {
              causesMap.set(causeId, { 
                cause: causeName, 
                category: category, 
                count: 1 
              });
            }
          }
        });
        
        // Convert to array and sort by count
        return Array.from(causesMap.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 6)
          .map(cause => ({ name: cause.cause, valor: cause.count }));
          
      } catch (err) {
        console.error("Error processing causes data:", err);
        toast.error("Erro ao processar dados de causas");
        return [];
      }
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Indicadores</h1>
        <div className="flex space-x-2">
          <Button 
            variant={period === "2weeks" ? "default" : "outline"} 
            onClick={() => setPeriod("2weeks")}
          >
            2 Semanas
          </Button>
          <Button 
            variant={period === "4weeks" ? "default" : "outline"} 
            onClick={() => setPeriod("4weeks")}
          >
            4 Semanas
          </Button>
          <Button 
            variant={period === "1month" ? "default" : "outline"} 
            onClick={() => setPeriod("1month")}
          >
            1 Mês
          </Button>
          <Button 
            variant={period === "3months" ? "default" : "outline"} 
            onClick={() => setPeriod("3months")}
          >
            3 Meses
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <DashboardCard
          title="PPC Médio"
          value={isLoadingMetrics ? "Carregando..." : `${metrics.ppcAverage}%`}
          icon={<BarChart className="h-4 w-4" />}
          description="Média do período selecionado"
        />
        <DashboardCard
          title="Aderência"
          value={isLoadingMetrics ? "Carregando..." : `${metrics.adherence}%`}
          icon={<Calendar className="h-4 w-4" />}
          description="Planejado vs. Executado"
        />
        <DashboardCard
          title="Atividades"
          value={isLoadingMetrics ? "Carregando..." : `${metrics.activeActivities}`}
          icon={<AreaChart className="h-4 w-4" />}
          description="No período selecionado"
        />
        <DashboardCard
          title="Causas"
          value={isLoadingMetrics ? "Carregando..." : `${metrics.causesCount}`}
          icon={<Clock className="h-4 w-4" />}
          description="Registradas no período"
          className="border-l-4 border-l-rust"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>PPC Semanal</CardTitle>
            <CardDescription>
              Percentual de atividades completadas por semana
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {isLoadingWeekly ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-text-secondary">Carregando dados...</p>
              </div>
            ) : weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="semana" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="previsto"
                    name="Previsto"
                    fill="#8E9196"
                    maxBarSize={40}
                  />
                  <Bar
                    dataKey="realizado"
                    name="Realizado"
                    fill="#4D6A6D"
                    maxBarSize={40}
                  />
                </ReBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-text-secondary">Não há dados disponíveis para o período selecionado</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Principais Causas</CardTitle>
            <CardDescription>
              Causas mais frequentes de baixo PPC
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {isLoadingCauses ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-text-secondary">Carregando dados...</p>
              </div>
            ) : causesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={causesData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="valor"
                    name="Ocorrências"
                    fill="#A63446"
                    maxBarSize={30}
                  />
                </ReBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-text-secondary">Não há dados de causas disponíveis para o período selecionado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
