
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
    const { projectId, scheduleData } = await req.json();
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey
    );

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY is required');
    }

    // Get project info
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single();

    if (projectError) {
      throw projectError;
    }

    // Analyze schedule data
    const tasksWithDelay = [];
    const tasksWithRisk = [];
    
    for (const task of scheduleData) {
      if (task.data_termino && task.termino_linha_base) {
        const termino = new Date(task.data_termino);
        const terminoBase = new Date(task.termino_linha_base);
        const diffTime = termino.getTime() - terminoBase.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Tasks with more than 5 days of delay
        if (diffDays > 5) {
          tasksWithDelay.push({
            nome: task.nome,
            desvio_dias: diffDays,
            percentual_real: task.percentual_real || 0,
            percentual_previsto: task.percentual_previsto || 0,
            wbs: task.wbs
          });
        } 
        // Tasks with small delay (1-5 days) or those behind planned progress
        else if (diffDays > 0 || 
                ((task.percentual_real || 0) < (task.percentual_previsto || 0) && 
                (task.percentual_previsto || 0) - (task.percentual_real || 0) > 10)) {
          tasksWithRisk.push({
            nome: task.nome,
            desvio_dias: diffDays,
            percentual_real: task.percentual_real || 0,
            percentual_previsto: task.percentual_previsto || 0,
            wbs: task.wbs
          });
        }
      }
    }

    // Create dependencies map to analyze impact
    const dependencyMap = {};
    for (const task of scheduleData) {
      if (task.predecessor_id) {
        if (!dependencyMap[task.predecessor_id]) {
          dependencyMap[task.predecessor_id] = [];
        }
        dependencyMap[task.predecessor_id].push(task.id);
      }
    }

    // Find critical path and impacted activities
    const criticalTasks = new Set();
    const impactedTasks = {};
    
    for (const task of tasksWithDelay) {
      const taskObj = scheduleData.find(t => t.nome === task.nome);
      if (taskObj && dependencyMap[taskObj.id]) {
        criticalTasks.add(taskObj.id);
        
        // Find all impacted tasks
        const findImpacted = (taskId, deviationSource) => {
          if (dependencyMap[taskId]) {
            for (const dependentId of dependencyMap[taskId]) {
              const dependent = scheduleData.find(t => t.id === dependentId);
              if (dependent) {
                if (!impactedTasks[dependent.id]) {
                  impactedTasks[dependent.id] = {
                    nome: dependent.nome,
                    impactedBy: deviationSource
                  };
                }
                findImpacted(dependent.id, deviationSource);
              }
            }
          }
        };
        
        findImpacted(taskObj.id, task.nome);
      }
    }

    // 2. Construir o prompt para GPT
    const delaysText = tasksWithDelay.map(task => 
      `- Atividade "${task.nome}" (WBS: ${task.wbs}) com ${task.desvio_dias} dias de atraso. ` + 
      `Percentual previsto: ${task.percentual_previsto || 0}%, ` +
      `percentual real: ${task.percentual_real || 0}%`
    ).join('\n');

    const risksText = tasksWithRisk.map(task => 
      `- Atividade "${task.nome}" (WBS: ${task.wbs}) com ${task.desvio_dias} dias de desvio. ` + 
      `Percentual previsto: ${task.percentual_previsto || 0}%, ` +
      `percentual real: ${task.percentual_real || 0}%`
    ).join('\n');

    const impactsText = Object.values(impactedTasks).map((task: any) => 
      `- Atividade "${task.nome}" impactada por: ${task.impactedBy}`
    ).join('\n');

    const today = new Date();
    const weekId = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const prompt = `
    Você é um especialista em gerenciamento de projetos e planejamento.
    Com base nos dados de cronograma abaixo, crie uma análise crítica semanal no formato JSON com os campos conforme modelo abaixo.
    
    DADOS DO PROJETO:
    Nome do projeto: ${projectData.name}
    Data da análise: ${weekId}
    
    TAREFAS COM ATRASO SIGNIFICATIVO (>5 dias):
    ${delaysText || 'Nenhuma tarefa com atraso significativo identificada.'}
    
    TAREFAS EM RISCO OU COM PEQUENOS DESVIOS (1-5 dias ou com % realizado < previsto):
    ${risksText || 'Nenhuma tarefa em risco identificada.'}
    
    IMPACTOS IDENTIFICADOS NAS DEPENDÊNCIAS:
    ${impactsText || 'Nenhum impacto em dependências identificado.'}
    
    FORMATO ESPERADO DA RESPOSTA:
    {
      "projeto": "${projectData.name}",
      "semana": "${weekId}",
      "analise_geral": "Análise geral da situação do cronograma, tendências, principais preocupações e recomendações gerais.",
      "atividades_em_alerta": [
        {
          "atividade": "Nome da atividade em atraso/risco",
          "desvio_dias": XX,
          "impacto": "Descrição do impacto nas outras atividades"
        }
      ],
      "acoes_recomendadas": [
        "Ação recomendada 1",
        "Ação recomendada 2",
        "Ação recomendada 3"
      ]
    }
    
    ORIENTAÇÕES PARA A ANÁLISE:
    - Use um tom profissional e orientado a ações
    - Identifique as atividades mais críticas e seus impactos
    - Sugira ações corretivas específicas
    - Limite a no máximo 5 atividades em alerta (as mais críticas)
    - Limite a no máximo 5 ações recomendadas
    - Responda APENAS com o JSON, sem texto adicional
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
          content: "Você é um assistente especializado em gerenciamento de projetos e análise de cronogramas."
        }, {
          role: "user", 
          content: prompt
        }],
        max_tokens: 1200,
        temperature: 0.7,
      });

      const generatedText = completion.choices[0]?.message?.content || '{"erro": "Não foi possível gerar o relatório"}';
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
      const fallbackReport = `
      {
        "projeto": "${projectData.name}",
        "semana": "${weekId}",
        "analise_geral": "Não foi possível gerar uma análise completa devido a um erro técnico. Por favor, tente novamente mais tarde ou contate o suporte.",
        "atividades_em_alerta": [],
        "acoes_recomendadas": ["Verificar manualmente as atividades com percentual realizado abaixo do previsto", "Analisar impactos das atividades atrasadas"]
      }`;
      
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
