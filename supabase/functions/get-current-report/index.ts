
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
    }
    
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey
    );

    // Buscar o relatório atual
    const { data: report, error: reportError } = await supabase
      .from('planning_reports')
      .select('*')
      .eq('is_current', true)
      .order('created_at', { ascending: false })  // Ordenar por data de criação para casos onde existam múltiplos "current"
      .limit(1)
      .maybeSingle();
    
    if (reportError) {
      console.error("Erro ao buscar relatório:", reportError);
      throw reportError;
    }

    // Se não existir um relatório, criar um relatório padrão provisório
    if (!report) {
      console.log("Nenhum relatório encontrado, criando relatório provisório");
      const defaultContent = "Nenhum relatório de planejamento foi gerado ainda. Por favor, clique no botão 'Gerar Novo Resumo' para criar o primeiro relatório.";
      
      const { data: newReport, error: insertError } = await supabase
        .from('planning_reports')
        .insert({
          content: defaultContent,
          is_current: true
        })
        .select()
        .single();
      
      if (insertError) {
        console.error("Erro ao criar relatório provisório:", insertError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Erro ao criar relatório provisório"
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
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          report: newReport
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          }
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        report
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
