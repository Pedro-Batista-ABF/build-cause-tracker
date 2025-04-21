
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { ScheduleAnalysis } from "@/types/schedule";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface ScheduleExportReportProps {
  analysis: ScheduleAnalysis;
  projectName: string;
  additionalNotes?: string;
}

export function ScheduleExportReport({
  analysis,
  projectName,
  additionalNotes
}: ScheduleExportReportProps) {
  
  const handleExport = async () => {
    // Create content for the report
    const content = `
Análise Crítica do Cronograma
Projeto: ${projectName}
Data: ${format(new Date(analysis.semana), "dd/MM/yyyy", { locale: pt })}

ANÁLISE GERAL:
${analysis.analise_geral}

${analysis.atividades_em_alerta.length > 0 ? `
ATIVIDADES EM ALERTA:
${analysis.atividades_em_alerta.map(atividade => 
  `- ${atividade.atividade}
   Desvio: ${atividade.desvio_dias} dias
   Impacto: ${atividade.impacto}`
).join('\n\n')}` : ''}

AÇÕES RECOMENDADAS:
${analysis.acoes_recomendadas.map(acao => `- ${acao}`).join('\n')}

${additionalNotes ? `\nOBSERVAÇÕES ADICIONAIS:\n${additionalNotes}` : ''}
    `.trim();

    // Create and download file
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `analise-critica-${projectName.toLowerCase().replace(/\s+/g, '-')}-${analysis.semana}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button onClick={handleExport} className="gap-2">
      <FileDown className="h-4 w-4" />
      Exportar Relatório
    </Button>
  );
}

