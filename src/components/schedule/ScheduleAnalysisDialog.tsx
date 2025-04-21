
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScheduleTask, ScheduleAnalysis } from "@/types/schedule";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { FileDown, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface ScheduleAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  scheduleData: ScheduleTask[];
}

export function ScheduleAnalysisDialog({
  open,
  onOpenChange,
  projectId,
  scheduleData
}: ScheduleAnalysisDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ScheduleAnalysis | null>(null);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [, setAnalysisId] = useState<string | null>(null);

  const generateAnalysis = async () => {
    setIsLoading(true);
    setAnalysis(null);
    
    try {
      const { data: reportData, error } = await supabase.functions.invoke('generate-planning-report', {
        body: { 
          projectId, 
          scheduleData
        }
      });
      
      if (error) throw error;
      
      if (reportData?.report?.content) {
        try {
          // Try to parse content if it's JSON
          const contentObj = JSON.parse(reportData.report.content);
          setAnalysis(contentObj);
        } catch (e) {
          // If it's not JSON, use it as text
          setAnalysis({
            projeto: "Projeto",
            semana: format(new Date(), "yyyy-MM-dd"),
            analise_geral: reportData.report.content,
            atividades_em_alerta: [],
            acoes_recomendadas: []
          });
        }
        setAnalysisId(reportData.report.id);
        toast.success("Análise crítica gerada com sucesso!");
      } else {
        toast.error("Não foi possível gerar a análise crítica.");
      }
    } catch (error) {
      console.error("Error generating analysis:", error);
      toast.error("Erro ao gerar análise crítica");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleExportPDF = async () => {
    if (!analysis) return;
    
    toast.info("Funcionalidade de exportação para PDF será implementada em breve.");
    // Implementação da exportação para PDF virá aqui
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Análise Crítica do Cronograma</DialogTitle>
        </DialogHeader>
        
        {!analysis && !isLoading && (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground text-center mb-4">
              Gere uma análise crítica do cronograma atual para identificar riscos e receber recomendações.
            </p>
            <Button onClick={generateAnalysis}>
              Gerar Análise Crítica
            </Button>
          </div>
        )}
        
        {isLoading && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p>Gerando análise crítica, aguarde...</p>
            </div>
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        )}
        
        {analysis && !isLoading && (
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <h3 className="text-lg font-medium">{analysis.projeto}</h3>
                <Badge variant="outline">Semana: {format(new Date(analysis.semana), "dd/MM/yyyy", { locale: pt })}</Badge>
              </div>
              <Separator className="my-4" />
              <div className="prose prose-sm max-w-none">
                <h4 className="text-base font-medium mb-2">Análise Geral</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{analysis.analise_geral}</p>
              </div>
            </div>
            
            {analysis.atividades_em_alerta && analysis.atividades_em_alerta.length > 0 && (
              <div>
                <h4 className="text-base font-medium mb-2">Atividades em Alerta</h4>
                <div className="space-y-2">
                  {analysis.atividades_em_alerta.map((atividade, index) => (
                    <Card key={index} className="p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{atividade.atividade}</p>
                          <p className="text-sm text-muted-foreground">Impacto: {atividade.impacto}</p>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={atividade.desvio_dias > 5 
                            ? "bg-red-100 text-red-800 border-red-300" 
                            : "bg-amber-100 text-amber-800 border-amber-300"
                          }
                        >
                          Desvio: {atividade.desvio_dias} dias
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {analysis.acoes_recomendadas && analysis.acoes_recomendadas.length > 0 && (
              <div>
                <h4 className="text-base font-medium mb-2">Ações Recomendadas</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {analysis.acoes_recomendadas.map((acao, index) => (
                    <li key={index} className="text-sm">{acao}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="space-y-2">
              <h4 className="text-base font-medium">Observações Adicionais</h4>
              <Textarea 
                value={additionalNotes} 
                onChange={(e) => setAdditionalNotes(e.target.value)} 
                placeholder="Adicione suas observações aqui..."
                className="h-24"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
              <Button onClick={handleExportPDF} className="gap-2">
                <FileDown className="h-4 w-4" />
                Exportar Relatório
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
