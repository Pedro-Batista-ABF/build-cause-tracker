
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityRow } from "@/components/activities/ActivityRow";
import { supabase } from "@/integrations/supabase/client";

interface Activity {
  id: string;
  name: string;
  discipline: string | null;
  manager: string | null;
  responsible: string | null;
  unit: string | null;
  total_qty: number | null;
  progress: number;
  ppc: number;
  adherence: number;
}

interface ProjectActivitiesProps {
  projectId: string;
}

export function ProjectActivities({ projectId }: ProjectActivitiesProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivities() {
      try {
        const { data, error } = await supabase
          .from("activities")
          .select("*")
          .eq("project_id", projectId);

        if (error) throw error;

        // Simulando valores de progresso, PPC e aderência para exemplo
        const activitiesWithMetrics = data.map(activity => ({
          ...activity,
          progress: Math.floor(Math.random() * 100),
          ppc: Math.floor(Math.random() * 100),
          adherence: Math.floor(Math.random() * 100),
        }));

        setActivities(activitiesWithMetrics);
      } catch (error) {
        console.error("Error fetching activities:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, [projectId]);

  if (loading) {
    return <p>Carregando atividades...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividades do Projeto</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length > 0 ? (
            activities.map((activity) => (
              <ActivityRow key={activity.id} {...activity} />
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma atividade cadastrada para este projeto.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
