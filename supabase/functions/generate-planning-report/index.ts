
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { OpenAI } from 'https://esm.sh/openai@4.19.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extrair os parâmetros da solicitação (se houver)
    const requestData = await req.json().catch(() => ({}));
    const { scheduleData } = requestData;
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
    }
    
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey
    );

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY is required');
    }

    // Buscar dados de atividades e progressos para análise geral (não específica do cronograma)
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
      console.error("Erro ao buscar atividades:", activitiesError);
      throw activitiesError;
    }

    // Processar dados de progressos para análise
    const progressData = [];
    const delayedActivities = [];
    
    // Calcular métricas de desempenho
    let totalPlanned = 0;
    let totalActual = 0;
    
    activities.forEach(activity => {
      if (activity.daily_progress && activity.daily_progress.length > 0) {
        let activityPlanned = 0;
        let activityActual = 0;
        
        activity.daily_progress.forEach(progress => {
          if (progress.planned_qty && progress.actual_qty) {
            // Garantir que os valores são numéricos
            const plannedQty = Number(progress.planned_qty);
            const actualQty = Number(progress.actual_qty);
            
            activityPlanned += plannedQty;
            activityActual += actualQty;
            totalPlanned += plannedQty;
            totalActual += actualQty;
          }
        });
        
        // Evitar divisão por zero ao calcular PPC
        const ppc = activityPlanned > 0 ? (activityActual / activityPlanned) * 100 : 100;
        
        progressData.push({
          activity: activity.name,
          discipline: activity.discipline || 'Não especificada',
          responsible: activity.responsible || 'Não especificado',
          ppc: Math.round(ppc)
        });
        
        // Identificar atividades com atraso
        if (ppc < 80) {
          delayedActivities.push({
            name: activity.name,
            discipline: activity.discipline || 'Não especificada',
            responsible: activity.responsible || 'Não especificado',
            ppc: Math.round(ppc)
          });
        }
      }
    });
    
    // Calcular PPC geral
    const overallPPC = totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0;
    
    const today = new Date();
    const weekId = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Consultar causas de atrasos mais comuns
    let causes = [];
    try {
      const { data: causesData, error: causesError } = await supabase.rpc('get_common_causes', { limit_count: 3 });
      if (causesError) {
        console.error("Erro ao buscar causas comuns:", causesError);
      } else {
        causes = causesData || [];
      }
    } catch (error) {
      console.error("Erro ao processar causas comuns:", error);
    }
    
    // Consultar disciplinas críticas
    let criticalDisciplines = [];
    try {
      const { data: disciplinesData, error: disciplinesError } = await supabase.rpc('get_critical_disciplines', { limit_count: 3 });
      if (disciplinesError) {
        console.error("Erro ao buscar disciplinas críticas:", disciplinesError);
      } else {
        criticalDisciplines = disciplinesData || [];
      }
    } catch (error) {
      console.error("Erro ao processar disciplinas críticas:", error);
    }

    // Construir o prompt para o GPT
    const prompt = `
    Você é um especialista em gerenciamento de projetos.
    
    DADOS DO PROJETO:
    Data da análise: ${weekId}
    PPC Geral: ${overallPPC}%
    Atividades com atraso (PPC < 80%): ${delayedActivities.length}
    
    PRINCIPAIS CAUSAS DE ATRASO:
    ${causes && causes.length > 0 
      ? causes.map(c => `- ${c.name}: ${c.percentage}%`).join('\n')
      : 'Dados insuficientes para análise de causas.'}
    
    DISCIPLINAS COM MAIOR INCIDÊNCIA DE ATRASOS:
    ${criticalDisciplines && criticalDisciplines.length > 0 
      ? criticalDisciplines.map(d => `- ${d.discipline}: ${d.count} ocorrências`).join('\n')
      : 'Dados insuficientes para análise de disciplinas críticas.'}
    
    ATIVIDADES ATRASADAS:
    ${delayedActivities.length > 0 
      ? delayedActivities.map(a => `- ${a.name} (${a.discipline}): PPC ${a.ppc}%`).join('\n')
      : 'Nenhuma atividade com atraso significativo.'}
    
    Com base nesses dados, gere um relatório semanal de planejamento com:
    1. Um resumo da situação atual do projeto (2-3 parágrafos)
    2. Análise das principais causas de atraso
    3. Recomendações práticas para melhorar o PPC nas próximas semanas
    
    O relatório deve ser bem estruturado, profissional e prático. Use termos técnicos de gerenciamento de projetos mas mantenha a linguagem acessível. Limite a 600 palavras no total.
    `;

    console.log("Enviando prompt para OpenAI");
    
    try {
      const openai = new OpenAI({
        apiKey: openaiApiKey,
      });
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "system", 
          content: "Você é um assistente especializado em gerenciamento de projetos e análise de indicadores de desempenho."
        }, {
          role: "user", 
          content: prompt
        }],
        max_tokens: 1000,
        temperature: 0.7,
      });

      const generatedText = completion.choices[0]?.message?.content || 'Não foi possível gerar o relatório devido a um erro.';
      console.log("Relatório gerado com sucesso");
      
      // Salvar o relatório no banco
      try {
        // Primeiro, atualizar todos os relatórios existentes para não serem "current"
        await supabase
          .from('planning_reports')
          .update({ is_current: false })
          .eq('is_current', true);
          
        // Depois, inserir o novo relatório como "current"
        const { data: reportData, error: reportError } = await supabase
          .from('planning_reports')
          .insert([
            { content: generatedText, is_current: true }
          ])
          .select();
        
        if (reportError) {
          console.error("Erro ao salvar relatório:", reportError);
          throw reportError;
        }

        // Retornar o novo relatório
        return new Response(
          JSON.stringify({ 
            success: true, 
            report: reportData?.[0] || null
          }),
          { 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json'
            }
          }
        );
      } catch (dbError) {
        console.error("Erro ao salvar no banco de dados:", dbError);
        throw dbError;
      }
    } catch (openAiError) {
      console.error("Erro ao chamar OpenAI:", openAiError.message);
      
      // Criar um relatório de fallback se ocorrer erro com OpenAI
      const fallbackReport = "Não foi possível gerar o relatório semanal de planejamento devido a um problema técnico. Por favor, tente novamente mais tarde ou contate o suporte técnico.";
      
      try {
        await supabase
          .from('planning_reports')
          .update({ is_current: false })
          .eq('is_current', true);
          
        const { data: reportData, error: reportError } = await supabase
          .from('planning_reports')
          .insert([
            { content: fallbackReport, is_current: true }
          ])
          .select();
        
        if (reportError) {
          console.error("Erro ao salvar relatório de fallback:", reportError);
          throw reportError;
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            report: reportData?.[0] || null,
            warning: "Relatório gerado em modo de contingência devido a erro na API OpenAI."
          }),
          { 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json'
            }
          }
        );
      } catch (error) {
        console.error("Erro ao salvar relatório de fallback:", error);
        throw error;
      }
    }
  } catch (error) {
    console.error("Erro na edge function:", error.message);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    );
  }
});
