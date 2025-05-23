
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";

interface ActivityData {
  id: string;
  name: string;
  discipline: string | null;
  responsible: string;
  team: string | null;
  unit: string | null;
  total_qty: number | null;
  progress: number;
  ppc: number;
  start_date?: string;
  end_date?: string;
  status?: string;
  planned_progress?: number;
}

interface ReportRequest {
  week?: string;
  responsibleName?: string;
  fromDate?: string;
  toDate?: string;
  projectId?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Utility function to calculate PPC consistently
function calculatePPC(actualQty: number, plannedQty: number): number {
  // Avoid division by zero or negative values
  if (!plannedQty || plannedQty <= 0) return 0;
  
  // Ensure we don't have negative actual quantities
  const normalizedActualQty = Math.max(0, actualQty || 0);
  
  // Calculate percentage and round to nearest integer
  // Cap at 100% to avoid PPC values over 100%
  return Math.min(100, Math.round((normalizedActualQty / plannedQty) * 100));
}

async function getStatusClass(ppc: number, startDate?: string): Promise<string> {
  // Verificar se a atividade já deveria ter começado
  const now = new Date();
  const hasStarted = startDate ? new Date(startDate) <= now : true;
  
  // Se a atividade não começou ainda, não deve ser considerada atrasada
  if (!hasStarted) {
    return "⚪️ Não iniciada";
  }
  
  // Para atividades que já começaram, aplicar a lógica normal de status
  if (ppc >= 90) return "✅ OK";
  if (ppc >= 70) return "⚠️ Risco";
  return "❌ Atrasado";
}

async function fetchResponsibleActivities(
  supabase: any,
  responsibleName: string | null,
  projectId?: string,
  fromDate?: string,
  toDate?: string
): Promise<{activities: ActivityData[], contacts: any}> {
  // Query to get activities for the specific responsible
  let activitiesQuery = supabase
    .from("activities")
    .select("*, daily_progress(date, planned_qty, actual_qty)");

  if (responsibleName) {
    activitiesQuery = activitiesQuery.eq("responsible", responsibleName);
  }
  
  if (projectId) {
    activitiesQuery = activitiesQuery.eq("project_id", projectId);
  }

  // Get activities data
  const { data: activitiesData, error } = await activitiesQuery;
  if (error) throw error;

  console.log(`Fetched ${activitiesData.length} activities for responsible ${responsibleName}`);

  // Process activities data using the same logic as in ProjectActivities.tsx
  const processedActivities = activitiesData.map((activity: any) => {
    const progressData = activity.daily_progress || [];
    let filteredProgressData = progressData;
    
    // Filter progress data by date range if provided
    if (fromDate && toDate) {
      filteredProgressData = progressData.filter((p: any) => {
        const date = new Date(p.date);
        return date >= new Date(fromDate) && date <= new Date(toDate);
      });
    }

    console.log(`Activity: ${activity.name} - Progress data items: ${filteredProgressData.length}`);

    const totalActual = filteredProgressData.reduce(
      (sum: number, p: any) => sum + (p.actual_qty || 0),
      0
    );
    
    const totalPlanned = filteredProgressData.reduce(
      (sum: number, p: any) => sum + (p.planned_qty || 0),
      0
    );

    console.log(`${activity.name}: Total Actual: ${totalActual}, Total Planned: ${totalPlanned}, Total Qty: ${activity.total_qty}`);

    // CRITICAL: Ensure we use the exact same calculation as in the UI for progress
    const progress = activity.total_qty && activity.total_qty > 0
      ? Math.round((totalActual / Number(activity.total_qty)) * 100)
      : 0;
      
    // Use utility function for PPC calculation
    const ppc = calculatePPC(totalActual, totalPlanned);
    
    const planned_progress = activity.total_qty && activity.total_qty > 0 && totalPlanned
      ? Math.round((totalPlanned / Number(activity.total_qty)) * 100)
      : 0;

    console.log(`${activity.name}: Progress: ${progress}%, PPC: ${ppc}%, Planned Progress: ${planned_progress}%`);

    return {
      ...activity,
      progress,
      planned_progress,
      ppc,
    };
  });

  // Get responsible contact information
  const { data: contacts } = await supabase
    .from("responsible_contacts")
    .select("*")
    .eq("name", responsibleName || "")
    .maybeSingle();

  return { activities: processedActivities, contacts };
}

async function generateAIAnalysis(activities: ActivityData[], responsible: string): Promise<string> {
  try {
    // Check if OPENAI_API_KEY is available
    if (!OPENAI_API_KEY) {
      return "Análise não disponível (API key não configurada)";
    }

    // Calculate average metrics
    const totalActivities = activities.length;
    if (totalActivities === 0) {
      return "Não há atividades para análise no período selecionado.";
    }
    
    const averagePlanned = activities.reduce((sum, activity) => sum + (activity.planned_progress || 0), 0) / totalActivities;
    const averageActual = activities.reduce((sum, activity) => sum + activity.progress, 0) / totalActivities;
    const averagePPC = activities.reduce((sum, activity) => sum + activity.ppc, 0) / totalActivities;
    const variance = averageActual - averagePlanned;
    
    // Count activities by status (respeitando data de início)
    const now = new Date();
    const atRisk = activities.filter(a => {
      const hasStarted = a.start_date ? new Date(a.start_date) <= now : true;
      return hasStarted && a.ppc < 90 && a.ppc >= 70;
    }).length;
    
    const delayed = activities.filter(a => {
      const hasStarted = a.start_date ? new Date(a.start_date) <= now : true;
      return hasStarted && a.ppc < 70;
    }).length;
    
    const notStarted = activities.filter(a => {
      return a.start_date && new Date(a.start_date) > now;
    }).length;
    
    // Most delayed activity
    let mostDelayedActivity = null;
    let biggestVariance = 0;
    
    activities.forEach(activity => {
      const hasStarted = activity.start_date ? new Date(activity.start_date) <= now : true;
      if (!hasStarted) return; // Ignorar atividades não iniciadas
      
      const activityVariance = (activity.planned_progress || 0) - activity.progress;
      if (activityVariance > biggestVariance) {
        biggestVariance = activityVariance;
        mostDelayedActivity = activity;
      }
    });

    console.log("Generating AI analysis with the following data:");
    console.log(`Average Planned: ${averagePlanned.toFixed(1)}%`);
    console.log(`Average Actual: ${averageActual.toFixed(1)}%`);
    console.log(`Average PPC: ${averagePPC.toFixed(1)}%`);
    console.log(`Variance: ${variance.toFixed(1)}%`);
    console.log(`At Risk: ${atRisk}, Delayed: ${delayed}, Not Started: ${notStarted}`);
    if (mostDelayedActivity) {
      console.log(`Most Delayed Activity: ${mostDelayedActivity.name} (planned: ${mostDelayedActivity.planned_progress}%, real: ${mostDelayedActivity.progress}%)`);
    }

    // Create the prompt for OpenAI
    const prompt = `
Você é um analista de planejamento. Abaixo estão as atividades atribuídas ao responsável ${responsible}, com seus respectivos avanços e status:

- Total de atividades: ${totalActivities}
- Atividades ainda não iniciadas: ${notStarted}
- Avanço médio planejado: ${averagePlanned.toFixed(1)}%
- Avanço médio real: ${averageActual.toFixed(1)}%
- PPC médio: ${averagePPC.toFixed(1)}%
- Variação: ${variance.toFixed(1)}%
- Atividades em risco: ${atRisk}
- Atividades atrasadas: ${delayed}
${mostDelayedActivity ? `- Atividade mais atrasada: ${mostDelayedActivity.name} (planejado: ${mostDelayedActivity.planned_progress}%, real: ${mostDelayedActivity.progress}%)` : ''}

Escreva um resumo profissional dirigido ao ${responsible}, com observações sobre o desempenho e recomendações de ação. Use tom profissional, objetivo e orientado a resultados. Máximo 4 frases. Não assine o texto ou coloque "Atenciosamente" ou qualquer tipo de fechamento.
`;

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Você é um analista de planejamento profissional que fornece análises concisas e orientações práticas. Não assine o texto ou coloque saudações de fechamento.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 250,
        temperature: 0.5,
      }),
    });

    const data = await response.json();
    if (data.error) {
      console.error("OpenAI API error:", data.error);
      return "Erro na geração da análise: " + data.error.message;
    }

    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error generating AI analysis:", error);
    return "Erro na geração da análise automática.";
  }
}

function getCurrentWeekLabel(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const pastDaysOfYear = (now.getTime() - startOfYear.getTime()) / 86400000;
  const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  
  return `Semana ${weekNumber} - ${now.getFullYear()}`;
}

async function generateActivityTableHTML(activities: ActivityData[]): Promise<string> {
  // Sort activities by status (most critical first)
  const sortedActivities = [...activities].sort((a, b) => a.ppc - b.ppc);
  
  let tableRows = "";
  
  for (const activity of sortedActivities) {
    const statusClass = await getStatusClass(activity.ppc, activity.start_date);
        
    const startDate = activity.start_date 
      ? new Date(activity.start_date).toLocaleDateString('pt-BR')
      : '-';
      
    const endDate = activity.end_date
      ? new Date(activity.end_date).toLocaleDateString('pt-BR')
      : '-';
      
    tableRows += `
      <tr style="border-bottom: 1px solid #eaeaea;">
        <td style="padding: 8px;">${activity.name}</td>
        <td style="padding: 8px; text-align: center;">${activity.planned_progress || 0}%</td>
        <td style="padding: 8px; text-align: center;">${activity.progress}%</td>
        <td style="padding: 8px; text-align: center;">${statusClass}</td>
        <td style="padding: 8px; text-align: center;">${startDate}</td>
        <td style="padding: 8px; text-align: center;">${endDate}</td>
      </tr>
    `;
  }
  
  return `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #f3f4f6; font-weight: bold;">
          <th style="padding: 10px; text-align: left;">Atividade</th>
          <th style="padding: 10px; text-align: center;">% Previsto</th>
          <th style="padding: 10px; text-align: center;">% Real</th>
          <th style="padding: 10px; text-align: center;">Status</th>
          <th style="padding: 10px; text-align: center;">Início</th>
          <th style="padding: 10px; text-align: center;">Término</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { week, responsibleName, fromDate, toDate, projectId } = await req.json() as ReportRequest;
    
    console.log("Request payload:", { week, responsibleName, fromDate, toDate, projectId });
    
    if (!responsibleName) {
      throw new Error("Nome do responsável não fornecido");
    }
    
    // Fetch activities for the responsible person
    const { activities, contacts } = await fetchResponsibleActivities(
      supabase,
      responsibleName,
      projectId,
      fromDate,
      toDate
    );
    
    console.log(`Found ${activities.length} activities for ${responsibleName}`);
    console.log("Progress values:", activities.map(a => ({ name: a.name, progress: a.progress, totalQty: a.total_qty })));
    
    if (activities.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhuma atividade encontrada para este responsável no período" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    // Generate AI analysis
    const aiAnalysis = await generateAIAnalysis(activities, responsibleName);
    
    // Generate HTML email content
    const weekLabel = week || getCurrentWeekLabel();
    const activitiesTable = await generateActivityTableHTML(activities);
    
    // Movemos a análise para antes da tabela
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Relatório Semanal de Atividades</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; }
          .header { margin-bottom: 20px; }
          .footer { margin-top: 40px; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 20px; }
          .analysis { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #2754C5; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Relatório de Atividades - ${weekLabel}</h1>
          <p>Responsável: <strong>${responsibleName}</strong></p>
        </div>
        
        <div class="analysis">
          <h3>Análise de Desempenho</h3>
          <p>${aiAnalysis}</p>
        </div>
        
        ${activitiesTable}
        
        <div class="footer">
          <p>Enviado automaticamente pela plataforma ABF Engenharia</p>
        </div>
      </body>
      </html>
    `;
    
    // Send email
    const recipientEmail = contacts?.email;
    if (!recipientEmail) {
      return new Response(
        JSON.stringify({ error: "Email do responsável não encontrado" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    try {
      const emailResponse = await resend.emails.send({
        from: "Plataforma ABF <onboarding@resend.dev>",
        to: ["pedro.batista@abfeng.com.br"],
        subject: `Relatório Semanal de Atividades - ${responsibleName}`,
        html: `
        <h1>Olá Pedro,</h1>
        <p>Relatório Semanal de Atividades para ${responsibleName}</p>
        
        <div class="analysis">
          <h3>Análise de Desempenho</h3>
          <p>${aiAnalysis}</p>
        </div>
        
        ${activitiesTable}
        
        <div class="footer">
          <p>Enviado automaticamente pela plataforma ABF Engenharia</p>
        </div>
      `,
      });
      
      // Log detailed email response for debugging
      console.log("Email sent response:", JSON.stringify(emailResponse, null, 2));
      
      return new Response(JSON.stringify({ success: true, emailResponse }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } catch (emailError: any) {
      // Log detailed error info for debugging email issues
      console.error("Error sending email:", {
        message: emailError.message,
        stack: emailError.stack,
        responseText: emailError.response?.text ? await emailError.response.text() : null
      });
      
      return new Response(
        JSON.stringify({ 
          error: "Erro no envio do email", 
          details: emailError.message 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
  } catch (error: any) {
    console.error("Error in send-responsible-report function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error occurred" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
