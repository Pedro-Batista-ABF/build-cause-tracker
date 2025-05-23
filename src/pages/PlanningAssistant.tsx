import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlanningAssistantMessage } from '@/components/planning/PlanningAssistantMessage';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RiskAnalysisCard, RiskItem } from '@/components/risk/RiskAnalysisCard';
import { PlanningReport } from '@/types/database';
import { updateRiskAnalysis } from '@/utils/riskAnalysis';
import { calculatePPCForPeriod } from '@/utils/ppcCalculation';

interface RiscoAtrasoRow {
  id: string;
  atividade_id: string;
  risco_atraso_pct: number;
  classificacao: 'BAIXO' | 'MÉDIO' | 'ALTO';
  semana: string;
  activities?: {
    name: string;
    discipline?: string;
    responsible?: string;
  };
}

export default function PlanningAssistant() {
  const queryClient = useQueryClient();
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportMetrics, setReportMetrics] = useState<{
    overallPPC: number;
    totalPlanned: number;
    totalActual: number;
  } | null>(null);

  // Analisar riscos ao carregar a página
  useEffect(() => {
    const analyzeRisks = async () => {
      try {
        await updateRiskAnalysis();
        queryClient.invalidateQueries({ queryKey: ['risk-analysis'] });
      } catch (error) {
        console.error("Erro ao analisar riscos:", error);
      }
    };
    
    analyzeRisks();
  }, [queryClient]);
  
  // Query for fetching the latest planning report
  const { 
    data: latestReport, 
    isLoading: isLoadingReport,
    refetch: refetchReport,
    error: reportError
  } = useQuery({
    queryKey: ['planning-report'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-current-report');
          
        if (error) {
          console.error("Erro na função edge:", error);
          toast.error(`Erro ao buscar relatório: ${error.message || 'Erro desconhecido'}`);
          return null;
        }
        
        if (!data.success) {
          console.error("Erro na resposta:", data.error);
          toast.error(`Erro na resposta: ${data.error || 'Erro desconhecido'}`);
          return null;
        }
        
        return data.report as PlanningReport;
      } catch (error) {
        console.error('Error fetching planning report:', error);
        toast.error(`Erro ao carregar relatório: ${(error as Error).message || 'Erro desconhecido'}`);
        return null;
      }
    },
    retry: 1
  });
  
  // Query for fetching risk analysis data
  const { 
    data: riskData = [],
    isLoading: isLoadingRisks,
    refetch: refetchRisks
  } = useQuery({
    queryKey: ['risk-analysis'],
    queryFn: async () => {
      try {
        // Checar se a tabela existe primeiro
        const { error: checkError } = await supabase
          .from('risco_atraso')
          .select('id')
          .limit(1);
          
        if (checkError) {
          console.log("A tabela risco_atraso não existe ainda ou não tem permissões:", checkError.message);
          return [];
        }
        
        // Se a tabela existir, buscar os dados
        const { data, error } = await supabase
          .from('risco_atraso')
          .select(`
            id,
            atividade_id,
            semana,
            risco_atraso_pct,
            classificacao,
            activities (
              name,
              discipline,
              responsible
            )
          `)
          .order('risco_atraso_pct', { ascending: false })
          .limit(10);
          
        if (error) {
          console.error("Erro ao buscar dados de risco:", error);
          throw error;
        }
        
        return (data as RiscoAtrasoRow[]).map(item => ({
          id: item.id,
          atividade_id: item.atividade_id,
          atividade_nome: item.activities?.name || 'Atividade sem nome',
          risco_atraso_pct: item.risco_atraso_pct,
          classificacao: item.classificacao,
          semana: item.semana,
          responsible: item.activities?.responsible,
          discipline: item.activities?.discipline,
        } as RiskItem));
      } catch (error) {
        console.error('Error fetching risk analysis data:', error);
        toast.error(`Erro ao carregar análise de risco: ${(error as Error).message || 'Erro desconhecido'}`);
        return [];
      }
    }
  });

  // Novo cálculo para métricas do relatório, usando a função utilitária de PPC
  useEffect(() => {
    // Quando carregamos um novo relatório, sugerimos buscar os dados brutos e calcular o PPC conforme intervalo de datas
    const fetchMetrics = async () => {
      // Você pode ajustar aqui para buscar datas do relatório, se disponíveis
      // Caso o relatório tenha um período, utilize-o. Do contrário, use as últimas semanas (exemplo: últimos 30 dias)
      const periodEnd = new Date();
      const periodStart = new Date();
      periodStart.setDate(periodEnd.getDate() - 30);

      try {
        // Buscar dados de progresso no período
        const { data: progressData, error } = await supabase
          .from('daily_progress')
          .select('actual_qty, planned_qty, date')
          .gte('date', periodStart.toISOString().split('T')[0])
          .lte('date', periodEnd.toISOString().split('T')[0]);

        if (error) throw error;

        const ppc = calculatePPCForPeriod(progressData || [], periodStart, periodEnd);

        // Calcular totais também
        let totalPlanned = 0;
        let totalActual = 0;
        (progressData || []).forEach((item: any) => {
          if (
            item.planned_qty != null &&
            item.actual_qty != null &&
            !isNaN(item.planned_qty) &&
            !isNaN(item.actual_qty)
          ) {
            totalPlanned += Number(item.planned_qty);
            totalActual += Number(item.actual_qty);
          }
        });

        setReportMetrics({
          overallPPC: ppc,
          totalPlanned,
          totalActual,
        });
      } catch (err) {
        setReportMetrics(null);
      }
    };

    fetchMetrics();
  }, [latestReport]);

  // Handle generating a new report
  const handleGenerateReport = async () => {
    if (isGeneratingReport) return;
    
    try {
      setIsGeneratingReport(true);
      toast.info('Analisando riscos e gerando relatório...');
      
      // Primeiro atualizar a análise de risco
      const riskResult = await updateRiskAnalysis();
      if (!riskResult.success) {
        console.error("Erro ao atualizar análise de risco:", riskResult.error);
        toast.warning("Houve um problema ao atualizar a análise de risco, mas tentaremos gerar o relatório mesmo assim.");
      }
      
      // Atualizar os dados de risco
      await refetchRisks();
      
      // Agora gerar o relatório
      const { data, error } = await supabase.functions.invoke('generate-planning-report');
      
      if (error) {
        console.error('Error generating report:', error);
        toast.error(`Erro ao gerar relatório: ${error.message || 'Erro desconhecido'}`);
        throw error;
      }
      
      if (!data.success) {
        const errorMsg = data.error || 'Erro ao gerar relatório';
        console.error('Error in report generation response:', errorMsg);
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      // Armazenar as métricas do relatório
      if (data.metrics) {
        setReportMetrics(data.metrics);
      }
      
      await refetchReport();
      
      if (data.warning) {
        toast.warning(data.warning);
      } else {
        toast.success('Novo relatório gerado com sucesso!');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error(`Erro ao gerar novo relatório: ${(error as Error).message || 'Erro desconhecido'}`);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Mostrar mensagem de erro se as tabelas não existirem
  useEffect(() => {
    if (reportError) {
      toast.error('Erro ao carregar relatório. Verifique se as tabelas foram criadas no banco de dados.');
    }
  }, [reportError]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">
          Assistente de Planejamento Semanal
        </h1>
        <Button 
          onClick={handleGenerateReport} 
          disabled={isGeneratingReport || isLoadingReport}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isGeneratingReport ? 'animate-spin' : ''}`} />
          {isGeneratingReport ? 'Gerando...' : 'Gerar Novo Resumo'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-card-bg border-border-subtle shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Resumo do Planejamento Semanal</CardTitle>
              {reportMetrics && (
                <div className="text-sm text-muted-foreground">
                  PPC Geral: {reportMetrics.overallPPC}% 
                  {reportMetrics.totalPlanned > 0 && (
                    <span> (Planejado: {reportMetrics.totalPlanned.toFixed(2)}, Realizado: {reportMetrics.totalActual.toFixed(2)})</span>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent>
              {latestReport ? (
                <PlanningAssistantMessage 
                  content={latestReport.content} 
                  timestamp={latestReport.created_at}
                  isLoading={isLoadingReport}
                />
              ) : isLoadingReport || isGeneratingReport ? (
                <PlanningAssistantMessage 
                  content="" 
                  timestamp={new Date().toISOString()}
                  isLoading={true}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Nenhum relatório de planejamento encontrado.
                  </p>
                  <Button onClick={handleGenerateReport}>
                    Gerar Primeiro Relatório
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div>
          <RiskAnalysisCard 
            risks={riskData}
            isLoading={isLoadingRisks}
          />
        </div>
      </div>
    </div>
  );
}
