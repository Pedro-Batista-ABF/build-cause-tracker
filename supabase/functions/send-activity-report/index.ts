import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Activity {
  name: string;
  discipline: string | null;
  progress: number;
  unit: string | null;
  total_qty: number | null;
  team: string | null;
  responsible: string | null;
}

interface SendReportRequest {
  recipientName: string;
  recipientEmail: string;
  activities: Activity[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipientName, recipientEmail, activities }: SendReportRequest = await req.json();

    // Log de depuração para verificar os dados recebidos
    console.log("Dados recebidos:", {
      recipientName,
      recipientEmail,
      activitiesCount: activities.length
    });

    const activitiesList = activities
      .map(
        (activity) =>
          `<li>
            ${activity.name} - ${activity.progress}% concluído
            ${activity.total_qty ? `(${activity.total_qty} ${activity.unit})` : ""}
            ${activity.responsible ? `<br>Responsável: ${activity.responsible}` : ""}
            ${activity.team ? `<br>Equipe: ${activity.team}` : ""}
          </li>`
      )
      .join("");

    try {
      const emailResponse = await resend.emails.send({
        from: "Pedro Batista <pedro.batista@abfeng.com.br>",
        to: ["pedro.batista@abfeng.com.br"],
        subject: "Relatório de Acompanhamento de Atividades",
        html: `
          <h1>Olá Pedro,</h1>
          <p>Relatório de atividades para ${recipientName}:</p>
          <ul>
            ${activitiesList}
          </ul>
          <p>Detalhes do responsável: ${recipientName}</p>
          <p>Por favor, mantenha as informações de progresso atualizadas.</p>
          <p>Atenciosamente,<br>Sistema de Gestão de Atividades</p>
        `,
      });

      // Log detalhado da resposta do envio de e-mail
      console.log("Resposta completa do envio de e-mail:", JSON.stringify(emailResponse, null, 2));

      return new Response(JSON.stringify(emailResponse), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    } catch (emailError) {
      // Log específico para erros de envio de e-mail
      console.error("Erro específico no envio de e-mail:", {
        message: emailError.message,
        stack: emailError.stack,
        responseText: emailError.response?.text ? await emailError.response.text() : null
      });

      return new Response(
        JSON.stringify({ 
          error: "Erro no envio do e-mail", 
          details: emailError.message 
        }),
        {
          status: 500,
          headers: { 
            "Content-Type": "application/json", 
            ...corsHeaders 
          },
        }
      );
    }
  } catch (error) {
    // Log para erros de processamento dos dados
    console.error("Erro geral no processamento do relatório:", {
      message: error.message,
      stack: error.stack
    });

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
