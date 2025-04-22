
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { formatLocalDate } from "@/utils/dateUtils";
import { useQuery } from "@tanstack/react-query";

interface ActivityDetailsProps {
  activityId: string;
}

export function ActivityDetails({ activityId }: ActivityDetailsProps) {
  const { data: progressData = [], isLoading } = useQuery({
    queryKey: ['activity-details', activityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_progress')
        .select(`
          id,
          date,
          actual_qty,
          planned_qty,
          progress_causes (
            id,
            cause_id,
            notes,
            causes (
              name,
              category
            )
          )
        `)
        .eq('activity_id', activityId)
        .order('date', { ascending: false });

      if (error) {
        console.error("Error fetching activity details:", error);
        throw error;
      }

      return data || [];
    }
  });

  if (isLoading) {
    return (
      <div className="py-4 text-center">
        <p className="text-muted-foreground">Carregando detalhes da atividade...</p>
      </div>
    );
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <Tabs defaultValue="progress" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="progress">Apontamentos</TabsTrigger>
            <TabsTrigger value="causes">Causas</TabsTrigger>
          </TabsList>
          <TabsContent value="progress">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Planejado</TableHead>
                    <TableHead>Realizado</TableHead>
                    <TableHead>Desvio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {progressData.length > 0 ? (
                    progressData.map((item) => {
                      const deviation = item.actual_qty !== null && item.planned_qty !== null
                        ? ((item.actual_qty - item.planned_qty) / item.planned_qty) * 100
                        : 0;
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell>{formatLocalDate(item.date)}</TableCell>
                          <TableCell>{item.planned_qty}</TableCell>
                          <TableCell>{item.actual_qty}</TableCell>
                          <TableCell>
                            <span className={deviation < 0 ? "text-red-500" : "text-green-500"}>
                              {deviation.toFixed(1)}%
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        Nenhum apontamento registrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="causes">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Causa</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {progressData.some(item => item.progress_causes && item.progress_causes.length > 0) ? (
                    progressData
                      .filter(item => item.progress_causes && item.progress_causes.length > 0)
                      .map((item) => (
                        item.progress_causes.map(cause => (
                          <TableRow key={cause.id}>
                            <TableCell>{formatLocalDate(item.date)}</TableCell>
                            <TableCell>{cause.causes?.name || 'Não especificada'}</TableCell>
                            <TableCell>{cause.causes?.category || 'Não especificada'}</TableCell>
                            <TableCell>{cause.notes || '-'}</TableCell>
                          </TableRow>
                        ))
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        Nenhuma causa registrada.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
