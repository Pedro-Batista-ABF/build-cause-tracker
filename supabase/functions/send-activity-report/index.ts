
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
  team: string | null; // Added team field
  responsible: string | null; // Added responsible field
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

    const emailResponse = await resend.emails.send({
      from: "Relatório de Atividades <onboarding@resend.dev>",
      to: [recipientEmail],
      cc: ["Pedro.batista@abfeng.com.br"], // Adiciona o e-mail em cópia
      subject: "Relatório de Acompanhamento de Atividades",
      html: `
        <h1>Olá ${recipientName},</h1>
        <p>Segue o relatório das suas atividades em andamento:</p>
        <ul>
          ${activitiesList}
        </ul>
        <p>Por favor, mantenha as informações de progresso atualizadas.</p>
        <p>Atenciosamente,<br>Sistema de Gestão de Atividades</p>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Error sending activity report:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

