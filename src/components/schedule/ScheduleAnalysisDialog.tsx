
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
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { ScheduleExportReport } from "./ScheduleExportReport";

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
      // Chamar a função específica para análise do cronograma
      const { data: reportData, error } = await supabase.functions.invoke('import-ms-project', {
        body: { 
          action: 'analyze',
          projectId, 
          scheduleData
        }
      });
      
      if (error) throw error;
      
      if (reportData?.analysis) {
        try {
          // Parse the analysis content if it's JSON
          if (typeof reportData.analysis === 'string') {
            setAnalysis(JSON.parse(reportData.analysis));
          } else {
            setAnalysis(reportData.analysis);
          }
          setAnalysisId(reportData.id || null);
          toast.success("Análise crítica gerada com sucesso!");
        } catch (e) {
          console.error("Erro ao processar análise:", e);
          throw new Error("Formato de resposta inválido da análise");
        }
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
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium mb-2">{analysis.projeto}</h3>
                  <Badge variant="outline">
                    Semana: {format(new Date(analysis.semana), "dd/MM/yyyy", { locale: pt })}
                  </Badge>
                </div>
                <ScheduleExportReport 
                  analysis={analysis}
                  projectName={analysis.projeto}
                  additionalNotes={additionalNotes}
                />
              </div>
              
              <Separator className="my-4" />
              
              <Card className="p-4 bg-card mb-6">
                <h4 className="text-base font-medium mb-2">Análise Geral</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                  {analysis.analise_geral}
                </p>
              </Card>
            </div>
            
            {analysis.atividades_em_alerta && analysis.atividades_em_alerta.length > 0 && (
              <div>
                <h4 className="text-base font-medium mb-3">Atividades em Alerta</h4>
                <div className="grid gap-3">
                  {analysis.atividades_em_alerta.map((atividade, index) => (
                    <Card key={index} className="p-4 border-l-4 border-l-amber-500">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{atividade.atividade}</p>
                          <p className="text-sm text-muted-foreground mt-1">Impacto: {atividade.impacto}</p>
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
                <h4 className="text-base font-medium mb-3">Ações Recomendadas</h4>
                <Card className="p-4">
                  <ul className="space-y-2">
                    {analysis.acoes_recomendadas.map((acao, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                        <span className="text-sm">{acao}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
