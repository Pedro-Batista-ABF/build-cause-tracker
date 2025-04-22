
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker"; 
import { DateRange } from "react-day-picker";
import { format, addDays } from "date-fns";
import { pt } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ResponsibleReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
}

type ResponsibleContact = {
  id: string;
  name: string;
  email: string;
  discipline?: string | null;
};

export function ResponsibleReportDialog({
  open,
  onOpenChange,
  projectId,
}: ResponsibleReportDialogProps) {
  const [responsibles, setResponsibles] = useState<ResponsibleContact[]>([]);
  const [selectedResponsible, setSelectedResponsible] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -7),
    to: new Date(),
  });
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (open) {
      fetchResponsibles();
    }
  }, [open]);

  async function fetchResponsibles() {
    try {
      // First, get all activities with their responsible persons
      const { data: activities, error: activitiesError } = await supabase
        .from("activities")
        .select("responsible")
        .filter("responsible", "not.is", null);

      if (activitiesError) throw activitiesError;

      // Get unique responsible names
      const uniqueResponsibles = Array.from(
        new Set(activities.map((a) => a.responsible).filter(Boolean))
      );

      // Get contact details for these responsibles
      const { data: contacts, error: contactsError } = await supabase
        .from("responsible_contacts")
        .select("*")
        .in("name", uniqueResponsibles);

      if (contactsError) throw contactsError;

      setResponsibles(contacts);
    } catch (error) {
      console.error("Error fetching responsibles:", error);
      toast.error("Erro ao carregar responsáveis");
    }
  }

  async function handleSendReport() {
    if (!selectedResponsible) {
      toast.error("Selecione um responsável");
      return;
    }

    if (!dateRange?.from || !dateRange?.to) {
      toast.error("Selecione um período");
      return;
    }

    setIsSending(true);

    try {
      const response = await supabase.functions.invoke("send-responsible-report", {
        body: {
          responsibleName: selectedResponsible,
          fromDate: dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
          toDate: dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
          projectId: projectId,
          week: `Semana ${getCurrentWeekNumber()} - ${new Date().getFullYear()}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao enviar relatório");
      }

      toast.success(`Relatório enviado para ${selectedResponsible}`);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error sending report:", error);
      toast.error(`Erro ao enviar relatório: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  }

  function getCurrentWeekNumber(): number {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const pastDaysOfYear = (now.getTime() - startOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enviar Relatório por Responsável</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Responsável</Label>
            <Select value={selectedResponsible} onValueChange={setSelectedResponsible}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um responsável" />
              </SelectTrigger>
              <SelectContent>
                {responsibles.map((responsible) => (
                  <SelectItem key={responsible.id} value={responsible.name}>
                    {responsible.name}{" "}
                    {responsible.discipline ? `(${responsible.discipline})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Período</Label>
            <DatePickerWithRange 
              date={dateRange} 
              setDate={setDateRange} 
              locale={pt}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSendReport} disabled={isSending}>
              {isSending ? "Enviando..." : "Enviar Relatório"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
