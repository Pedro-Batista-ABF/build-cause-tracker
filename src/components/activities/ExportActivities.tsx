
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

interface Activity {
  id: string;
  name: string;
  discipline: string;
  manager: string;
  responsible: string;
  unit: string;
  totalQty: number;
  progress: number;
  ppc: number;
  adherence: number;
}

export function ExportActivities({ activities }: { activities: Activity[] }) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState("csv");

  const handleExport = async () => {
    try {
      let content = "";
      let fileName = `atividades_${new Date().toISOString().split('T')[0]}`;
      
      if (format === "csv") {
        const headers = "ID,Nome,Disciplina,Responsável,Gerente,Unidade,Quantidade Total,Progresso (%),PPC (%),Aderência (%)\n";
        const rows = activities.map(activity => (
          `"${activity.id}","${activity.name}","${activity.discipline}","${activity.responsible}","${activity.manager}","${activity.unit}",${activity.totalQty},${activity.progress},${activity.ppc},${activity.adherence}`
        )).join("\n");
        
        content = headers + rows;
        fileName += ".csv";
      } else if (format === "json") {
        content = JSON.stringify(activities, null, 2);
        fileName += ".json";
      }
      
      // Create blob and initiate download
      const blob = new Blob([content], { type: format === "csv" ? "text/csv;charset=utf-8;" : "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Exportação concluída com sucesso!");
      setOpen(false);
    } catch (error) {
      console.error("Erro ao exportar atividades:", error);
      toast.error("Erro ao exportar atividades");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exportar Atividades</DialogTitle>
          <DialogDescription>
            Selecione o formato para exportar os dados das atividades
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="format">Formato</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger id="format">
                <SelectValue placeholder="Selecione um formato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Excel)</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleExport}>Exportar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
