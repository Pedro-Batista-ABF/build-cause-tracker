
import { supabase } from "@/integrations/supabase/client";
import { getRiskClassification } from "./ppcCalculation";
import { calculateDelayRisk } from "./riskCalculation";
import { getWeekLabel } from "./dateUtils";
import { toast } from "sonner";

export const updateRiskAnalysis = async (): Promise<{ success: boolean; error?: any }> => {
  try {
    console.log('Iniciando atualização da análise de risco');
    
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

    if (activitiesError) {
      console.error('Erro ao buscar atividades:', activitiesError);
      throw activitiesError;
    }

    const currentWeek = getWeekLabel(new Date());
    const riskUpdates = [];

    for (const activity of activities || []) {
      if (!activity.daily_progress || activity.daily_progress.length === 0) continue;
      
      let totalPlanned = 0;
      let totalActual = 0;
      const varianceHistory = [];
      
      activity.daily_progress.forEach((progress: any) => {
        if (progress.planned_qty !== null && progress.actual_qty !== null) {
          // Garantir que os valores são numéricos
          const plannedQty = Number(progress.planned_qty);
          const actualQty = Number(progress.actual_qty);
          
          totalPlanned += plannedQty;
          totalActual += actualQty;
          
          // Evitar divisão por zero ao calcular variação
          if (plannedQty > 0) {
            const dailyVariance = (actualQty / plannedQty) * 100 - 100;
            varianceHistory.push(dailyVariance);
          } else if (actualQty > 0) {
            varianceHistory.push(100); // Variação positiva se realizado > 0 mas planejado = 0
          } else {
            varianceHistory.push(0); // Sem variação se ambos são 0
          }
        }
      });
      
      // Cálculo do PPC com verificação de divisão por zero
      const ppc = totalPlanned > 0 ? Math.min(100, Math.round((totalActual / totalPlanned) * 100)) : 0;
      const riskPct = calculateDelayRisk(ppc, varianceHistory);
      const classification = getRiskClassification(ppc);
      
      console.log(`Atividade: ${activity.name}, PPC: ${ppc}%, Risco: ${riskPct}%`);
      
      try {
        // Verificar se já existe um registro para esta atividade e semana
        const { data: existingRisk, error: existingRiskError } = await supabase
          .from('risco_atraso')
          .select('id')
          .eq('atividade_id', activity.id)
          .eq('semana', currentWeek)
          .maybeSingle();
          
        if (existingRiskError) {
          console.error(`Erro ao verificar risco existente para ${activity.name}:`, existingRiskError);
          continue;
        }
        
        // Atualizar ou inserir o registro de risco
        if (existingRisk) {
          riskUpdates.push(
            supabase
              .from('risco_atraso')
              .update({
                risco_atraso_pct: riskPct,
                classificacao: classification
              })
              .eq('id', existingRisk.id)
          );
        } else {
          riskUpdates.push(
            supabase
              .from('risco_atraso')
              .insert({
                atividade_id: activity.id,
                risco_atraso_pct: riskPct,
                classificacao: classification,
                semana: currentWeek
              })
          );
        }
      } catch (activityError) {
        console.error(`Erro ao processar risco para atividade ${activity.name}:`, activityError);
        continue;
      }
    }
    
    if (riskUpdates.length > 0) {
      try {
        await Promise.all(riskUpdates.map(promise => promise));
        console.log(`Atualizados riscos para ${riskUpdates.length} atividades`);
      } catch (updateError) {
        console.error("Erro ao atualizar registros de risco:", updateError);
        return { success: false, error: updateError };
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error("Erro detalhado na análise de risco:", error);
    return { success: false, error };
  }
};
