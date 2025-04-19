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

const periodFilters = ["Dia", "Semana", "Mês", "Trimestre", "6M"];

const chartData = [
  { week: "Semana 1", ppc: 85 },
  { week: "Semana 2", ppc: 92 },
  { week: "Semana 3", ppc: 78 },
  { week: "Semana 4", ppc: 88 },
  { week: "Semana 5", ppc: 95 },
  { week: "Semana 6", ppc: 89 },
];

const mockCauses = [
  { cause: "Mão de obra", count: 12, category: "Método" },
  { cause: "Material", count: 8, category: "Material" },
  { cause: "Equipamento", count: 7, category: "Máquina" },
  { cause: "Planejamento", count: 5, category: "Método" },
];

export default function Dashboard() {
  const [activePeriod, setActivePeriod] = useState("Semana");
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    avgPPC: 0,
    adherence: 0,
    totalActivities: 0,
    delayedActivities: 0
  });
  const { session } = useAuth();

  useEffect(() => {
    if (session) {
      fetchProjects();
      fetchDashboardStats();
    }
  }, [session]);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (data) setProjects(data);
  };

  const fetchDashboardStats = async () => {
    const { count: totalActivities } = await supabase
      .from('activities')
      .select('*', { count: 'exact', head: true });

    setStats({
      avgPPC: 85,
      adherence: 92,
      totalActivities: totalActivities || 0,
      delayedActivities: 7
    });
  };

  const userName = session?.user?.user_metadata?.full_name?.split(' ')[0];

  return (
    <div className="space-y-6">
      <DashboardHeader userName={userName} />
      
      <PeriodFilter 
        activePeriod={activePeriod}
        onPeriodChange={setActivePeriod}
        periods={periodFilters}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="PPC Médio"
          value={`${stats.avgPPC}%`}
          icon={<BarChart2 className="h-4 w-4" />}
          description="Últimas 4 semanas"
          className="border border-border-subtle shadow-md"
        />
        <DashboardCard
          title="Aderência"
          value={`${stats.adherence}%`}
          icon={<Calendar className="h-4 w-4" />}
          description="Planejado vs. Executado"
          className="border border-border-subtle shadow-md"
        />
        <DashboardCard
          title="Atividades"
          value={stats.totalActivities.toString()}
          icon={<FileText className="h-4 w-4" />}
          description="Em projetos ativos"
          className="border border-border-subtle shadow-md"
        />
        <DashboardCard
          title="Atrasos"
          value={stats.delayedActivities.toString()}
          icon={<AlertTriangle className="h-4 w-4 text-accent-red" />}
          description="Atividades com PPC < 90%"
          className="border-l-4 border-l-accent-red border border-border-subtle shadow-md"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <PPCChart data={chartData} />
        <CausesAnalysis causes={mockCauses} />
      </div>
      
      <RecentProjects projects={projects} />
    </div>
  );
}
