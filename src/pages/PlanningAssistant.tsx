
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlanningAssistantMessage } from '@/components/planning/PlanningAssistantMessage';
import { Refresh } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RiskAnalysisCard, RiskItem } from '@/components/risk/RiskAnalysisCard';

interface PlanningReport {
  id: string;
  content: string;
  created_at: string;
  is_current: boolean;
}

export default function PlanningAssistant() {
  // Query for fetching the latest planning report
  const { 
    data: latestReport, 
    isLoading: isLoadingReport,
    refetch: refetchReport
  } = useQuery({
    queryKey: ['planning-report'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('planning_reports')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (error) throw error;
        return data[0] as PlanningReport;
      } catch (error) {
        console.error('Error fetching planning report:', error);
        toast.error('Erro ao carregar o relatório de planejamento');
        return null;
      }
    }
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
        // Fetch risk data from the database
        const { data, error } = await supabase
          .from('risco_atraso')
          .select(`
            id,
            atividade_id,
            semana,
            risco_atraso_pct,
            classificacao,
            created_at,
            activities (
              name,
              discipline,
              responsible
            )
          `)
          .order('risco_atraso_pct', { ascending: false })
          .limit(10);
          
        if (error) throw error;
        
        // Format the data
        return data.map(item => ({
          id: item.id,
          atividade_id: item.atividade_id,
          atividade_nome: item.activities?.name || 'Atividade sem nome',
          risco_atraso_pct: item.risco_atraso_pct,
          classificacao: item.classificacao as 'BAIXO' | 'MÉDIO' | 'ALTO',
          semana: item.semana,
          responsible: item.activities?.responsible || '',
          discipline: item.activities?.discipline || '',
        })) as RiskItem[];
      } catch (error) {
        console.error('Error fetching risk analysis data:', error);
        toast.error('Erro ao carregar os dados de análise de risco');
        return [];
      }
    }
  });

  // Handle generating a new report
  const handleGenerateReport = async () => {
    toast.info('Gerando novo relatório de planejamento...');
    
    try {
      // In a real implementation, this would call your backend
      // For now, let's simulate the API call with a timeout
      setTimeout(() => {
        refetchReport();
        refetchRisks();
        toast.success('Novo relatório gerado com sucesso!');
      }, 2000);
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Erro ao gerar novo relatório');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">
          Assistente de Planejamento Semanal
        </h1>
        <Button onClick={handleGenerateReport} disabled={isLoadingReport}>
          <Refresh className="mr-2 h-4 w-4" />
          Gerar Novo Resumo
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-card-bg border-border-subtle shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Resumo do Planejamento Semanal</CardTitle>
            </CardHeader>
            <CardContent>
              {latestReport ? (
                <PlanningAssistantMessage 
                  content={latestReport.content} 
                  timestamp={latestReport.created_at}
                  isLoading={isLoadingReport}
                />
              ) : isLoadingReport ? (
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
