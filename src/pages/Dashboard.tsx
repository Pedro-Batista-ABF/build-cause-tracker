import React, { useState, useEffect } from 'react';
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { PeriodFilter } from "@/components/dashboard/PeriodFilter";
import { PPCChart } from "@/components/dashboard/PPCChart";
import { CausesAnalysis } from "@/components/dashboard/CausesAnalysis";
import { RecentProjects } from "@/components/dashboard/RecentProjects";
import { BarChart2, Calendar, FileText, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { RiskAnalysisDashboard } from '@/components/dashboard/RiskAnalysisDashboard';
import { calculateAveragePPC } from '@/utils/ppcCalculation';
import { updateRiskAnalysis } from '@/utils/riskAnalysis';

const periodFilters = ["Dia", "Semana", "Mês", "Trimestre", "6M"];

// Helper function to calculate date range based on selected period
const getDateRange = (period: string) => {
  const today = new Date();
  let startDate = new Date();
  
  switch (period) {
    case "2weeks":
      startDate.setDate(today.getDate() - 14);
      break;
    case "4weeks":
      startDate.setDate(today.getDate() - 28);
      break;
    case "1month":
      startDate.setDate(today.getDate() - 30);
      break;
    case "3months":
      startDate.setMonth(today.getMonth() - 3);
      break;
    default:
      startDate.setDate(today.getDate() - 28); // Default to 4 weeks
  }
  
  return { startDate, endDate: today };
};

export default function Dashboard() {
  const [activePeriod, setActivePeriod] = useState("4weeks");
  const { session } = useAuth();
  const userName = session?.user?.user_metadata?.full_name?.split(' ')[0];
  
  const dateRange = getDateRange(activePeriod);
  
  // Função para atualizar análise de risco
  const updateRisk = async () => {
    try {
      const result = await updateRiskAnalysis();
      if (!result.success) {
        console.error("Falha ao atualizar análise de risco:", result.error);
      }
    } catch (error) {
      console.error("Erro ao atualizar análise de risco:", error);
    }
  };

  // Atualizar análise de risco quando o componente montar
  useEffect(() => {
    if (session?.user) {
      updateRisk();
    }
  }, [session?.user]);
  
  // Fetch dashboard stats
  const { data: stats = { avgPPC: 0, adherence: 0, totalActivities: 0, delayedActivities: 0 }, 
    isLoading: isStatsLoading,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['dashboard-stats', activePeriod],
    queryFn: async () => {
      try {
        const { count: totalActivities, error: activitiesError } = await supabase
          .from('activities')
          .select('*', { count: 'exact', head: true });
          
        if (activitiesError) throw activitiesError;
        
        // Get progress data for PPC calculation within the selected date range
        const { data: progressData, error: progressError } = await supabase
          .from('daily_progress')
          .select('actual_qty, planned_qty, date')
          .gte('date', dateRange.startDate.toISOString().split('T')[0])
          .lte('date', dateRange.endDate.toISOString().split('T')[0]);
          
        if (progressError) throw progressError;
        
        // Calculate average PPC using our utility function
        const avgPPC = calculateAveragePPC(progressData || []);
          
        let compliantActivities = 0;
        let totalProgressItems = 0;
        
        // Calculate adherence
        progressData?.forEach(item => {
          if (item.planned_qty && item.actual_qty) {
            totalProgressItems++;
            if (item.actual_qty >= item.planned_qty) {
              compliantActivities++;
            }
          }
        });
        
        const adherence = totalProgressItems > 0
          ? Math.round((compliantActivities / totalProgressItems) * 100)
          : 0;
          
        // Count delayed activities (PPC < 90%)
        let delayedActivities = 0;
        progressData?.forEach(item => {
          if (item.planned_qty && item.actual_qty) {
            const itemPPC = (Number(item.actual_qty) / Number(item.planned_qty)) * 100;
            if (itemPPC < 90) {
              delayedActivities++;
            }
          }
        });

        // Atualizar análise de risco quando houver atividades atrasadas
        if (delayedActivities > 0) {
          updateRisk();
        }
        
        return {
          avgPPC,
          adherence,
          totalActivities: totalActivities || 0,
          delayedActivities
        };
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        toast.error('Erro ao carregar indicadores do dashboard');
        return {
          avgPPC: 0,
          adherence: 0,
          totalActivities: 0,
          delayedActivities: 0
        };
      }
    },
    enabled: !!session?.user
  });
  
  // Quando o período mudar, atualizar a análise de risco
  useEffect(() => {
    if (session?.user) {
      refetchStats().then(() => {
        updateRisk();
      });
    }
  }, [activePeriod]);

  // Fetch chart data
  const { data: chartData = [], isLoading: isChartLoading } = useQuery({
    queryKey: ['ppc-chart', activePeriod],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('daily_progress')
          .select('date, actual_qty, planned_qty')
          .gte('date', dateRange.startDate.toISOString().split('T')[0])
          .lte('date', dateRange.endDate.toISOString().split('T')[0])
          .order('date');
          
        if (error) throw error;
        
        // Process data for chart - group by week
        const weeklyData = new Map();
        
        data?.forEach(item => {
          const date = new Date(item.date);
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay() + 1); // Start of week (Monday)
          
          const weekKey = `Semana ${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
          
          if (!weeklyData.has(weekKey)) {
            weeklyData.set(weekKey, {
              week: weekKey,
              totalPlanned: 0,
              totalActual: 0
            });
          }
          
          const weekData = weeklyData.get(weekKey);
          weekData.totalPlanned += Number(item.planned_qty || 0);
          weekData.totalActual += Number(item.actual_qty || 0);
        });
        
        // Convert map to array and calculate PPC
        return Array.from(weeklyData.values()).map(week => ({
          week: week.week,
          ppc: week.totalPlanned > 0 
            ? Math.round((week.totalActual / week.totalPlanned) * 100)
            : 0
        }));
      } catch (error) {
        console.error('Error fetching chart data:', error);
        toast.error('Erro ao carregar dados do gráfico');
        return [];
      }
    },
    enabled: !!session?.user
  });

  return (
    <div className="space-y-6">
      <DashboardHeader userName={userName} />
      
      <PeriodFilter 
        activePeriod={activePeriod}
        onPeriodChange={setActivePeriod}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="PPC Médio"
          value={`${stats.avgPPC}%`}
          icon={<BarChart2 className="h-4 w-4" />}
          description={`${activePeriod === '2weeks' ? 'Últimas 2 semanas' : 
            activePeriod === '4weeks' ? 'Últimas 4 semanas' : 
            activePeriod === '1month' ? 'Último mês' : 'Últimos 3 meses'}`}
          className="border border-border-subtle shadow-md"
          isLoading={isStatsLoading}
        />
        <DashboardCard
          title="Aderência"
          value={`${stats.adherence}%`}
          icon={<Calendar className="h-4 w-4" />}
          description="Planejado vs. Executado"
          className="border border-border-subtle shadow-md"
          isLoading={isStatsLoading}
        />
        <DashboardCard
          title="Atividades"
          value={stats.totalActivities.toString()}
          icon={<FileText className="h-4 w-4" />}
          description="Em projetos ativos"
          className="border border-border-subtle shadow-md"
          isLoading={isStatsLoading}
        />
        <DashboardCard
          title="Atrasos"
          value={stats.delayedActivities.toString()}
          icon={<AlertTriangle className="h-4 w-4 text-accent-red" />}
          description="Atividades com PPC < 90%"
          className="border-l-4 border-l-accent-red border border-border-subtle shadow-md"
          isLoading={isStatsLoading}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <PPCChart 
          data={chartData} 
          isLoading={isChartLoading} 
          className="md:col-span-2"
        />
        <RiskAnalysisDashboard />
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <CausesAnalysis 
          period={activePeriod}
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          className="md:col-span-2"
        />
        <RecentProjects />
      </div>
    </div>
  );
}
