
import { supabase } from "@/integrations/supabase/client";
import { getRiskClassification } from "./ppcCalculation";

/**
 * Calcula o risco de atraso com base no PPC atual e histórico de progresso
 * @param ppc - Percentual de plano concluído atual
 * @param varianceHistory - Histórico de variações (opcional)
 * @returns Percentual de risco de atraso (0-100)
 */
export const calculateDelayRisk = (ppc: number, varianceHistory?: number[]): number => {
  // Base risk from PPC - lower PPC means higher risk
  let baseRisk = Math.max(0, 100 - ppc);
  
  // Adjust based on variance trend if available
  if (varianceHistory && varianceHistory.length >= 2) {
    // Check if trend is negative (getting worse over time)
    let isWorseningTrend = true;
    for (let i = 1; i < varianceHistory.length; i++) {
      if (varianceHistory[i] >= varianceHistory[i-1]) {
        isWorseningTrend = false;
        break;
      }
    }
    
    // Increase risk for worsening trend
    if (isWorseningTrend) {
      baseRisk = Math.min(100, baseRisk + 15);
    }
  }
  
  return Math.round(baseRisk);
};

/**
 * Atualiza a tabela de riscos de atraso com base nos dados de progresso atual
 * @returns Promise que resolve quando a atualização for concluída
 */
export const updateRiskAnalysis = async (): Promise<{ success: boolean; error?: any }> => {
  try {
    // Buscar atividades com seus dados de progresso
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select(`
        id, 
        name,
        discipline,
        responsible,
        daily_progress (
          date,
          planned_qty,
          actual_qty
        )
      `);

    if (activitiesError) throw activitiesError;

    // Para cada atividade, calcular o PPC e o risco
    const currentWeek = getWeekLabel(new Date());
    const riskUpdates = [];

    for (const activity of activities || []) {
      if (!activity.daily_progress || activity.daily_progress.length === 0) continue;
      
      // Calcular PPC
      let totalPlanned = 0;
      let totalActual = 0;
      const varianceHistory = [];
      
      activity.daily_progress.forEach((progress: any) => {
        if (progress.planned_qty && progress.actual_qty) {
          totalPlanned += Number(progress.planned_qty);
          totalActual += Number(progress.actual_qty);
          // Calcular variância diária para análise de tendência
          const dailyVariance = (Number(progress.actual_qty) / Number(progress.planned_qty)) * 100 - 100;
          varianceHistory.push(dailyVariance);
        }
      });
      
      const ppc = totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0;
      
      // Calcular risco de atraso apenas para atividades com PPC < 90
      if (ppc < 90) {
        const riskPct = calculateDelayRisk(ppc, varianceHistory);
        const classification = getRiskClassification(ppc);
        
        // Verificar se já existe um registro para esta atividade/semana
        const { data: existingRisk } = await supabase
          .from('risco_atraso')
          .select('id')
          .eq('atividade_id', activity.id)
          .eq('semana', currentWeek)
          .maybeSingle();
          
        if (existingRisk) {
          // Atualizar risco existente
          riskUpdates.push(supabase
            .from('risco_atraso')
            .update({
              risco_atraso_pct: riskPct,
              classificacao: classification
            })
            .eq('id', existingRisk.id)
          );
        } else {
          // Inserir novo risco
          riskUpdates.push(supabase
            .from('risco_atraso')
            .insert({
              atividade_id: activity.id,
              risco_atraso_pct: riskPct,
              classificacao: classification,
              semana: currentWeek
            })
          );
        }
      }
    }
    
    // Executar todas as atualizações
    if (riskUpdates.length > 0) {
      await Promise.all(riskUpdates);
    }
    
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar análise de risco:", error);
    return { success: false, error };
  }
};

/**
 * Gera um rótulo para a semana atual no formato "YYYY-WW"
 * @param date - Data para extrair a semana
 * @returns String identificando a semana do ano
 */
export const getWeekLabel = (date: Date): string => {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  
  return `${date.getFullYear()}-${weekNumber.toString().padStart(2, '0')}`;
};
