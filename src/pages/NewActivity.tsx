
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { ScheduleTask } from "@/types/schedule"
import { supabase } from "@/integrations/supabase/client"
import { Tables } from "@/integrations/supabase/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  projectId: z.string().min(1, "Selecione um projeto"),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  discipline: z.string().min(1, "Selecione uma disciplina"),
  responsible: z.string().min(1, "Selecione um responsável"),
  team: z.string().min(2, "Equipe deve ter pelo menos 2 caracteres"),
  unit: z.string().min(1, "Selecione uma unidade"),
  totalQty: z.string().min(1, "Quantidade é obrigatória"),
  description: z.string().optional(),
  startDate: z.string().min(1, "Data de início é obrigatória"),
  endDate: z.string().min(1, "Data de término é obrigatória"),
  scheduleTaskId: z.string().optional(),
  // Schedule fields (optional)
  hasSchedule: z.boolean().default(false),
  scheduleStartDate: z.string().optional(),
  scheduleEndDate: z.string().optional(),
  scheduleDurationDays: z.string().optional(),
  schedulePredecessorId: z.string().optional(),
  schedulePercentComplete: z.string().optional(),
})

const disciplines = [
  "Montagem Civil",
  "Elétrica",
  "Mecânica",
  "Civil",
  "Instrumentação",
]

const units = [
  "un",
  "m",
  "m²",
  "m³",
  "ton",
  "kg",
]

export default function NewActivity() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [projects, setProjects] = useState<Tables<'projects'>[]>([]);
  const [loading, setLoading] = useState(false);
  const [scheduleTasks, setScheduleTasks] = useState<ScheduleTask[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectId || "");
  const [responsibleContacts, setResponsibleContacts] = useState<Array<{ id: string; name: string; email: string; discipline: string | null }>>([]);
  const [activities, setActivities] = useState<Array<{ id: string; name: string }>>([]);
  const [hasSchedule, setHasSchedule] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId: projectId || "",
      name: "",
      discipline: "",
      responsible: "",
      team: "",
      unit: "",
      totalQty: "",
      description: "",
      startDate: "",
      endDate: "",
      scheduleTaskId: "",
      hasSchedule: false,
      scheduleStartDate: "",
      scheduleEndDate: "",
      scheduleDurationDays: "",
      schedulePredecessorId: "",
      schedulePercentComplete: "0",
    },
  });

  useEffect(() => {
    fetchProjects();
    fetchResponsibleContacts();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchScheduleTasks(selectedProjectId);
      fetchProjectActivities(selectedProjectId);
    }
  }, [selectedProjectId]);

  async function fetchProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('status', 'active');

    if (error) {
      toast.error("Erro ao carregar projetos");
      console.error(error);
    } else {
      setProjects(data || []);
    }
  }

  async function fetchScheduleTasks(projectId: string) {
    const { data, error } = await supabase
      .from('cronograma_projeto')
      .select('*')
      .eq('projeto_id', projectId);

    if (error) {
      toast.error("Erro ao carregar tarefas do cronograma");
      console.error(error);
    } else {
      // Map the database records ensuring all fields from the ScheduleTask interface are properly set
      const mappedTasks: ScheduleTask[] = (data || []).map(task => ({
        id: task.id,
        projeto_id: task.projeto_id,
        tarefa_id: task.tarefa_id,
        nome: task.nome,
        data_inicio: task.data_inicio,
        data_termino: task.data_termino,
        duracao_dias: task.duracao_dias,
        wbs: task.wbs,
        percentual_previsto: task.percentual_previsto,
        percentual_real: task.percentual_real,
        nivel_hierarquia: task.nivel_hierarquia,
        atividade_lps_id: task.atividade_lps_id,
        inicio_linha_base: null,
        termino_linha_base: null,
        predecessores: task.predecessores || null,
        predecessor_id: null,
        created_at: task.created_at
      }));
      
      setScheduleTasks(mappedTasks);
    }
  }

  async function fetchResponsibleContacts() {
    try {
      const { data, error } = await supabase
        .from('responsible_contacts')
        .select('*')
        .order('name');

      if (error) throw error;
      setResponsibleContacts(data || []);
    } catch (error) {
      console.error("Error fetching responsible contacts:", error);
      toast.error("Erro ao carregar lista de responsáveis");
    }
  }

  async function fetchProjectActivities(projectId: string) {
    try {
      const { data, error } = await supabase
        .from("activities")
        .select("id, name")
        .eq("project_id", projectId);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error("Error fetching project activities:", error);
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Usuário não autenticado");
        return;
      }

      // Create activity data object
      const activityData = {
        project_id: values.projectId,
        name: values.name,
        discipline: values.discipline,
        responsible: values.responsible,
        team: values.team,
        unit: values.unit,
        total_qty: Number(values.totalQty),
        created_by: session.user.id,
        start_date: values.startDate,
        end_date: values.endDate,
        description: values.description
      };
      
      // Add schedule data if has schedule is enabled
      if (values.hasSchedule) {
        Object.assign(activityData, {
          schedule_start_date: values.scheduleStartDate || null,
          schedule_end_date: values.scheduleEndDate || null,
          schedule_predecessor_id: values.schedulePredecessorId || null,
          schedule_duration_days: values.scheduleDurationDays ? Number(values.scheduleDurationDays) : null,
          schedule_percent_complete: values.schedulePercentComplete ? Number(values.schedulePercentComplete) : 0,
        });
      }

      // Create the activity with the correct fields, including start and end dates
      const { data: activity, error: activityError } = await supabase
        .from('activities')
        .insert(activityData)
        .select()
        .single();

      if (activityError) {
        console.error("Activity creation error:", activityError);
        throw activityError;
      }

      if (values.scheduleTaskId && values.scheduleTaskId !== 'none' && activity) {
        const { error: linkError } = await supabase
          .from('cronograma_projeto')
          .update({ atividade_lps_id: activity.id })
          .eq('id', values.scheduleTaskId);

        if (linkError) {
          console.error("Link error:", linkError);
          throw linkError;
        }
      }

      toast.success("Atividade criada com sucesso!");
      navigate("/activities");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao criar atividade");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Nova Atividade</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cadastro de Atividade</CardTitle>
          <CardDescription>
            Preencha as informações da nova atividade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="basic">
                <TabsList className="mb-4">
                  <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
                  <TabsTrigger value="schedule">Cronograma</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-6">
                  <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Projeto</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedProjectId(value);
                          }} 
                          defaultValue={field.value}
                          disabled={!!projectId}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um projeto" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {projects.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Atividade</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Montagem de Estrutura Metálica" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="discipline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Disciplina</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma disciplina" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {disciplines.map((discipline) => (
                                <SelectItem key={discipline} value={discipline}>
                                  {discipline}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="responsible"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Responsável</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um responsável" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {responsibleContacts.map((contact) => (
                                <SelectItem key={contact.id} value={contact.name}>
                                  {contact.name} {contact.discipline ? `(${contact.discipline})` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="team"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Equipe</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Equipe A" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unidade</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Un." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {units.map((unit) => (
                                  <SelectItem key={unit} value={unit}>
                                    {unit}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="totalQty"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantidade</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descreva os detalhes da atividade..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Início</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Término</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="schedule" className="space-y-6">
                  <FormField
                    control={form.control}
                    name="hasSchedule"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Switch 
                            checked={field.value} 
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              setHasSchedule(checked);
                            }} 
                          />
                        </FormControl>
                        <FormLabel className="text-base">
                          Adicionar informações de cronograma
                        </FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("hasSchedule") && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="scheduleStartDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Data de Início do Cronograma</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="scheduleEndDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Data de Término do Cronograma</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="scheduleDurationDays"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Duração (dias)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="0" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="schedulePercentComplete"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Percentual Concluído (%)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  max="100" 
                                  placeholder="0" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="schedulePredecessorId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Predecessor</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || "none"}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma atividade predecessora" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">Nenhum predecessor</SelectItem>
                                {activities.map((activity) => (
                                  <SelectItem key={activity.id} value={activity.id}>
                                    {activity.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                            <p className="text-sm text-muted-foreground">
                              Selecione a atividade que precisa ser concluída antes desta.
                            </p>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {selectedProjectId && (
                <FormField
                  control={form.control}
                  name="scheduleTaskId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vincular à Tarefa do Cronograma</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "none"}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma tarefa do cronograma" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Nenhuma tarefa</SelectItem>
                          {scheduleTasks.map((task) => (
                            <SelectItem key={task.id} value={task.id}>
                              {task.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex justify-end space-x-4">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => navigate("/activities")}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Criando..." : "Criar Atividade"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
