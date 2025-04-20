
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, FileUp, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ScheduleImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onImportSuccess: () => void;
}

export function ScheduleImportDialog({
  open,
  onOpenChange,
  projectId,
  onImportSuccess
}: ScheduleImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);

    if (!selectedFile) {
      return;
    }

    if (selectedFile.name.endsWith('.xml')) {
      setFile(selectedFile);
    } else {
      setError("Por favor, selecione um arquivo XML válido do MS Project.");
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !projectId) {
      setError("Selecione um arquivo XML válido.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Read file content
      const fileContent = await file.text();
      
      // Call edge function to parse and import the MS Project XML
      const { data, error } = await supabase.functions.invoke('import-ms-project', {
        body: { 
          xmlContent: fileContent,
          projectId 
        }
      });

      if (error) throw new Error(error.message);

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success(`Importado com sucesso: ${data?.taskCount || 0} tarefas.`);
      onImportSuccess();
    } catch (err: any) {
      console.error("Import error:", err);
      setError(err.message || "Erro ao importar o cronograma. Verifique se o arquivo XML é válido.");
      toast.error("Falha ao importar cronograma");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Importar Cronograma</DialogTitle>
          <DialogDescription>
            Selecione um arquivo XML exportado do MS Project para importar o cronograma.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="file">Arquivo XML do MS Project</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                accept=".xml"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </div>
            {file && (
              <p className="text-sm text-muted-foreground">
                Arquivo selecionado: {file.name}
              </p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
            Cancelar
          </Button>
          <Button onClick={handleUpload} disabled={!file || isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <FileUp className="mr-2 h-4 w-4" />
                Importar Cronograma
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
