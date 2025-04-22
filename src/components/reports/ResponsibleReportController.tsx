
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { ResponsibleReportDialog } from "./ResponsibleReportDialog";

interface ResponsibleReportControllerProps {
  projectId?: string;
}

export function ResponsibleReportController({ projectId }: ResponsibleReportControllerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setDialogOpen(true)}>
        <Mail className="h-4 w-4 mr-2" />
        Enviar Relatório Semanal
      </Button>
      
      <ResponsibleReportDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectId={projectId}
      />
    </>
  );
}
