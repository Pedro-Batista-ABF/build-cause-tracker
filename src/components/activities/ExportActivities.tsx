
import { Button } from "@/components/ui/button";
import { download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ExportActivitiesProps {
  projectId?: string;
}

export function ExportActivities({ projectId }: ExportActivitiesProps) {
  const exportToCSV = async () => {
    let query = supabase
      .from('activities')
      .select(`
        *,
        daily_progress (
          date,
          actual_qty,
          planned_qty
        ),
        progress_causes (
          notes,
          causes (
            name,
            category
          )
        )
      `);

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching data:', error);
      return;
    }

    const csvContent = convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `atividades_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const convertToCSV = (data: any[]) => {
    const headers = ['Nome', 'Disciplina', 'Responsável', 'Equipe', 'Quantidade Total', 'Unidade', 'Progresso', 'Data', 'Quantidade Realizada', 'Quantidade Planejada', 'Causa', 'Categoria'];
    const rows = data.flatMap(activity => {
      const progress = activity.daily_progress || [];
      const causes = activity.progress_causes || [];
      
      return progress.map((p: any) => {
        const cause = causes.find((c: any) => c.progress_id === p.id);
        return [
          activity.name,
          activity.discipline,
          activity.manager,
          activity.responsible,
          activity.total_qty,
          activity.unit,
          ((p.actual_qty / activity.total_qty) * 100).toFixed(2) + '%',
          p.date,
          p.actual_qty,
          p.planned_qty,
          cause?.causes?.name || '',
          cause?.causes?.category || ''
        ].join(',');
      });
    });

    return [headers.join(','), ...rows].join('\n');
  };

  return (
    <Button onClick={exportToCSV} variant="outline">
      <download className="mr-2 h-4 w-4" />
      Exportar Dados
    </Button>
  );
}
