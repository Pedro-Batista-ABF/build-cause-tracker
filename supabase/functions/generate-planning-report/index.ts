
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

    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    // 1. Obter dados para análise
    // Atividades com PPC baixo
    const { data: lowPpcActivities, error: lowPpcError } = await supabase
      .from('daily_progress')
      .select(`
        id,
        activity_id,
        planned_qty,
        actual_qty,
        activities (
          name,
          discipline,
          responsible
        )
      `)
      .lt('actual_qty', supabase.raw('planned_qty * 0.9'))
      .order('date', { ascending: false })
      .limit(10);

    if (lowPpcError) throw lowPpcError;

    // Riscos de atraso
    const { data: risks, error: risksError } = await supabase
      .from('risco_atraso')
      .select(`
        id,
        atividade_id,
        risco_atraso_pct,
        classificacao,
        activities (
          name,
          discipline,
          responsible
        )
      `)
      .eq('classificacao', 'ALTO')
      .order('risco_atraso_pct', { ascending: false })
      .limit(10);
    
    if (risksError) throw risksError;
    
    // Causas mais frequentes
    const { data: causes, error: causesError } = await supabase.rpc('get_common_causes', { limit_count: 5 });
    if (causesError) throw causesError;

    // Disciplinas críticas
    const { data: disciplines, error: disciplinesError } = await supabase.rpc('get_critical_disciplines', { limit_count: 5 });
    if (disciplinesError) throw disciplinesError;

    // 2. Construir o prompt para GPT
    const riskActivitiesText = risks.map(risk => (
      `- Atividade "${risk.activities?.name || 'Sem nome'}" com ${Math.round(risk.risco_atraso_pct)}% de risco de atraso (${risk.classificacao}), ` +
      `responsável: ${risk.activities?.responsible || 'Não definido'}, disciplina: ${risk.activities?.discipline || 'Não definida'}`
    )).join('\n');

    const lowPpcText = lowPpcActivities.map(act => {
      const ppc = act.planned_qty > 0 ? Math.round((act.actual_qty / act.planned_qty) * 100) : 0;
      return `- Atividade "${act.activities?.name || 'Sem nome'}" com PPC de ${ppc}%, ` +
        `responsável: ${act.activities?.responsible || 'Não definido'}, disciplina: ${act.activities?.discipline || 'Não definida'}`
    }).join('\n');

    const causesText = causes?.map(cause => 
      `- ${cause.name}: ${cause.count} ocorrências (${cause.percentage}%)`
    ).join('\n') || 'Nenhuma causa registrada';

    const disciplinesText = disciplines?.map(disc => 
      `- ${disc.discipline || 'Sem disciplina'}: ${disc.count} atividades atrasadas`
    ).join('\n') || 'Nenhuma disciplina crítica identificada';

    const prompt = `
    Você é um especialista em gerenciamento de projetos e planejamento usando o Last Planner System (LPS).
    Com base nos dados a seguir, crie um resumo de planejamento semanal com tom conversacional, 
    orientado à ação e focado em melhorias para a próxima semana.
    
    DADOS DISPONÍVEIS:
    
    1. RISCOS DE ATRASO IDENTIFICADOS:
    ${riskActivitiesText || 'Nenhum risco de atraso alto identificado.'}
    
    2. ATIVIDADES COM PPC ABAIXO DE 90%:
    ${lowPpcText || 'Nenhuma atividade com PPC baixo.'}
    
    3. CAUSAS MAIS FREQUENTES DE ATRASO:
    ${causesText}
    
    4. DISCIPLINAS CRÍTICAS:
    ${disciplinesText}
    
    ORIENTAÇÕES PARA O RELATÓRIO:
    - Use um tom conversacional mas profissional
    - Estruture em seções: resumo geral, alertas críticos, ações recomendadas
    - Sugira ações específicas para mitigar os riscos identificados
    - Recomende realocação de recursos quando necessário
    - Mencione tendências e padrões nas causas de atraso
    - Linguagem deve ser em Português do Brasil
    - Limite de 500-700 palavras
    - Foco principal nas ações para a próxima semana
    `;

    console.log("Enviando prompt para OpenAI");
    
    // 3. Gerar o relatório com OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system", 
        content: "Você é um assistente especializado em gerenciamento de projetos de construção civil usando Last Planner System."
      }, {
        role: "user", 
        content: prompt
      }],
      max_tokens: 1200,
      temperature: 0.7,
    });

    const generatedText = completion.choices[0]?.message?.content || 'Não foi possível gerar o relatório';

    console.log("Relatório gerado com sucesso");
    
    // 4. Salvar o relatório no banco
    const { data: reportData, error: reportError } = await supabase
      .from('planning_reports')
      .insert([
        { content: generatedText, is_current: true }
      ])
      .select();
    
    if (reportError) throw reportError;

    // 5. Retornar o novo relatório
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
