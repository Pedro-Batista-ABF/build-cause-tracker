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
import { AlertTriangle, BarChart } from "lucide-react";
import { CartesianGrid, Legend, Bar, BarChart as ReBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CausesAnalysis } from "@/components/dashboard/CausesAnalysis";
import { toast } from "sonner";

interface CauseData {
  name: string;
  categoria: string;
  quantidade: number;
}

interface WeeklyCauseData {
  semana: string;
  quantidade: number;
  _startDate?: string; // Internal use only
  _endDate?: string; // Internal use only
}

export default function Causes() {
  const [period, setPeriod] = useState("4-weeks");

  // Fetch causes data
  const { data: causesData = [], isLoading: isLoadingCauses } = useQuery({
    queryKey: ['causes-analysis', period],
    queryFn: async () => {
      // Fetch last 4 weeks of progress causes
      const today = new Date();
      const pastDate = new Date();
      
      if (period === "4-weeks") {
        pastDate.setDate(today.getDate() - 28); // 4 weeks ago
      } else if (period === "2-weeks") {
        pastDate.setDate(today.getDate() - 14); // 2 weeks ago
      } else if (period === "1-week") {
        pastDate.setDate(today.getDate() - 7); // 1 week ago
      }

      const { data: progressCauses, error } = await supabase
        .from('progress_causes')
        .select(`
          id,
          notes,
          created_at,
          causes:cause_id(id, name, category)
        `)
        .gte('created_at', pastDate.toISOString())
        .lte('created_at', today.toISOString());

      if (error) {
        console.error("Error fetching causes:", error);
        toast.error("Erro ao carregar dados de causas");
        return [];
      }

      // Process and group data by cause
      const causeMap = new Map<string, { name: string, categoria: string, quantidade: number }>();

      progressCauses?.forEach(item => {
        if (item.causes) {
          const causeId = item.causes.id;
          const causeName = item.causes.name;
          const category = item.causes.category || 'Não categorizado';

          if (causeMap.has(causeId)) {
            const currentCause = causeMap.get(causeId)!;
            causeMap.set(causeId, { 
              ...currentCause, 
              quantidade: currentCause.quantidade + 1 
            });
          } else {
            causeMap.set(causeId, { 
              name: causeName, 
              categoria: category, 
              quantidade: 1 
            });
          }
        }
      });

      // Convert map to array and sort by count
      const causesArray = Array.from(causeMap.values())
        .sort((a, b) => b.quantidade - a.quantidade);

      return causesArray;
    }
  });

  // Fetch weekly causes data
  const { data: weeklyCausesData = [], isLoading: isLoadingWeekly } = useQuery({
    queryKey: ['weekly-causes', period],
    queryFn: async () => {
      // Calculate date range based on period
      const today = new Date();
      const pastDate = new Date();
      let numberOfWeeks = 4;
      
      if (period === "2-weeks") {
        numberOfWeeks = 2;
      } else if (period === "1-week") {
        numberOfWeeks = 1;
      }
      
      pastDate.setDate(today.getDate() - (numberOfWeeks * 7));

      // Prepare weekly data structure
      const weeklyData: WeeklyCauseData[] = [];
      
      for (let i = 0; i < numberOfWeeks; i++) {
        const weekStart = new Date(pastDate);
        weekStart.setDate(weekStart.getDate() + (i * 7));
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        weeklyData.push({
          semana: `Sem ${i + 1}`,
          quantidade: 0,
          _startDate: weekStart.toISOString(),
          _endDate: weekEnd.toISOString()
        });
      }

      // Fetch causes data for each week
      const { data: progressCauses, error } = await supabase
        .from('progress_causes')
        .select('id, created_at')
        .gte('created_at', pastDate.toISOString())
        .lte('created_at', today.toISOString());

      if (error) {
        console.error("Error fetching weekly causes:", error);
        toast.error("Erro ao carregar dados semanais de causas");
        return weeklyData.map(({ startDate, endDate, ...rest }) => rest);
      }

      // Count causes for each week
      progressCauses?.forEach(item => {
        const createdDate = new Date(item.created_at);
        
        for (let i = 0; i < weeklyData.length; i++) {
          const weekStart = new Date(weeklyData[i]._startDate!);
          const weekEnd = new Date(weeklyData[i]._endDate!);
          
          if (createdDate >= weekStart && createdDate <= weekEnd) {
            weeklyData[i].quantidade++;
            break;
          }
        }
      });

      return weeklyData.map(({ _startDate, _endDate, ...rest }) => rest);
    }
  });

  // Calculate summary metrics
  const totalCauses = weeklyCausesData.reduce((sum, week) => sum + week.quantidade, 0);
  
  const mainCause = causesData.length > 0 ? {
    name: causesData[0].name,
    count: causesData[0].quantidade
  } : { name: "N/A", count: 0 };
  
  const weeklyAverage = totalCauses / (weeklyCausesData.length || 1);

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
  };

  const isLoading = isLoadingCauses || isLoadingWeekly;

  const causesForAnalysis = causesData.slice(0, 5).map(cause => ({
    cause: cause.name,
    category: cause.categoria,
    count: cause.quantidade
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Causas</h1>
        <div className="flex space-x-2">
          <Button 
            variant={period === "1-week" ? "default" : "outline"} 
            onClick={() => handlePeriodChange("1-week")}
          >
            Última semana
          </Button>
          <Button 
            variant={period === "2-weeks" ? "default" : "outline"} 
            onClick={() => handlePeriodChange("2-weeks")}
          >
            Últimas 2 semanas
          </Button>
          <Button 
            variant={period === "4-weeks" ? "default" : "outline"} 
            onClick={() => handlePeriodChange("4-weeks")}
          >
            Últimas 4 semanas
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <DashboardCard
          title="Total de Causas"
          value={isLoading ? "..." : totalCauses.toString()}
          icon={<AlertTriangle className="h-4 w-4" />}
          description={`Últimas ${period === "1-week" ? "semana" : period === "2-weeks" ? "2 semanas" : "4 semanas"}`}
        />
        <DashboardCard
          title="Principal Causa"
          value={isLoading ? "..." : mainCause.name}
          icon={<AlertTriangle className="h-4 w-4" />}
          description={`${mainCause.count} ocorrências`}
        />
        <DashboardCard
          title="Média Semanal"
          value={isLoading ? "..." : weeklyAverage.toFixed(1)}
          icon={<BarChart className="h-4 w-4" />}
          description="Causas por semana"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Causas por Semana</CardTitle>
            <CardDescription>
              Número de causas registradas por semana
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {isLoadingWeekly ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground">Carregando dados...</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={weeklyCausesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="semana" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="quantidade"
                    name="Quantidade"
                    fill="#A63446"
                    maxBarSize={40}
                  />
                </ReBarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Principais Causas</CardTitle>
            <CardDescription>
              Distribuição das causas por categoria
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {isLoadingCauses ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground">Carregando dados...</p>
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
                    dataKey="quantidade"
                    name="Ocorrências"
                    fill="#4D6A6D"
                    maxBarSize={30}
                  />
                </ReBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground">Nenhuma causa registrada no período</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CausesAnalysis causes={causesForAnalysis} />
    </div>
  );
}
