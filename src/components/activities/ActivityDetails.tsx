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

// Helper function to calculate business days (similar to the one in DailyProgress)
function calculateBusinessDays(startDate?: string | null, endDate?: string | null) {
  if (!startDate || !endDate) return 0;
  let count = 0;
  let curr = new Date(startDate);
  const end = new Date(endDate);

  while (curr <= end) {
    const day = curr.getDay();
    if (day !== 0 && day !== 6) count++; // 0=Dom, 6=Sáb
    curr.setDate(curr.getDate() + 1);
  }
  return count > 0 ? count : 1;
}

// Helper function to calculate daily goal (similar to the one in DailyProgress)
function calculateDailyGoal(startDate?: string | null, endDate?: string | null, totalQty?: number) {
  if (!startDate || !endDate || !totalQty || isNaN(totalQty)) return {qty: 0, percent: 0};
  try {
    const businessDays = calculateBusinessDays(startDate, endDate);
    const qtyGoal = Math.round(totalQty / businessDays);
    const percentGoal = Number((100 / businessDays).toFixed(2));
    return {qty: qtyGoal, percent: percentGoal};
  } catch {
    return {qty: 0, percent: 0};
  }
}

interface ActivityDetailsProps {
  activityId: string;
}

export function ActivityDetails({ activityId }: ActivityDetailsProps) {
  const { data: progressData = [], isLoading } = useQuery({
    queryKey: ['activity-details', activityId],
    queryFn: async () => {
      const { data: activityData, error: activityError } = await supabase
        .from("activities")
        .select("total_qty, start_date, end_date, description")
        .eq("id", activityId)
        .single();

      if (activityError) {
        console.error("Error fetching activity details:", activityError);
        throw activityError;
      }

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

      // Attach activity data to each progress entry for daily goal calculation
      return (data || []).map(item => ({
        ...item,
        activity: activityData
      }));
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
                      // Calculate daily goal based on activity data
                      const dailyGoal = calculateDailyGoal(
                        item.activity?.start_date, 
                        item.activity?.end_date, 
                        item.activity?.total_qty
                      );
                      
                      const plannedQty = dailyGoal.qty;
                      
                      // Fix: Prevent division by zero when calculating deviation
                      let deviation = 0;
                      if (plannedQty > 0) {
                        deviation = ((item.actual_qty - plannedQty) / plannedQty) * 100;
                      } else if (item.actual_qty > 0) {
                        // If planned is 0 but actual is not, show 100% positive deviation
                        deviation = 100;
                      }
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell>{formatLocalDate(item.date)}</TableCell>
                          <TableCell>{plannedQty}</TableCell>
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
        {progressData?.activity?.description && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Descrição</h4>
            <p className="text-sm bg-muted p-3 rounded-md">{progressData.activity.description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
