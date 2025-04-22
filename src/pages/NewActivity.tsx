
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
import { Slider } from "@/components/ui/slider"
import { ProgressDistributionChart } from "@/components/activities/ProgressDistributionChart";
import { DistributionType } from "@/utils/progressDistribution";
import { Tables } from "@/integrations/supabase/types";

const formSchema = z.object({
  projectId: z.string().min(1, "Selecione um projeto"),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  discipline: z.string().min(1, "Selecione uma disciplina"),
  manager: z.string().min(2, "Responsável deve ter pelo menos 2 caracteres"),
  responsible: z.string().min(1, "Selecione um responsável"),
  team: z.string().min(2, "Equipe deve ter pelo menos 2 caracteres"),
  unit: z.string().min(1, "Selecione uma unidade"),
  totalQty: z.string().min(1, "Quantidade é obrigatória"),
  description: z.string().optional(),
  startDate: z.string().min(1, "Data de início é obrigatória"),
  endDate: z.string().min(1, "Data de término é obrigatória"),
  planningType: z.string().min(1, "Selecione o tipo de planejamento"),
  dailyGoal: z.string().optional(),
  weeklyGoal: z.string().optional(),
  monthlyGoal: z.string().optional(),
  distributionType: z.string().min(1, "Selecione o tipo de distribuição"),
  scheduleTaskId: z.string().optional(),
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

const planningTypes = [
  "Diário",
  "Semanal",
  "Mensal",
]

const distributionTypes = [
  "Linear",
  "Personalizado",
  "Curva S",
]

export default function NewActivity() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [projects, setProjects] = useState<Tables<'projects'>[]>([]);
  const [loading, setLoading] = useState(false);
  const [scheduleTasks, setScheduleTasks] = useState<ScheduleTask[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectId || "");
  const [responsibleContacts, setResponsibleContacts] = useState<Array<{ id: string; name: string; email: string; discipline: string | null }>>([]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId: projectId || "",
      name: "",
      discipline: "",
      manager: "",
      responsible: "",
      team: "",
      unit: "",
      totalQty: "",
      description: "",
      startDate: "",
      endDate: "",
      planningType: "",
      dailyGoal: "",
      weeklyGoal: "",
      monthlyGoal: "",
      distributionType: "",
      scheduleTaskId: "",
    },
  });

  useEffect(() => {
    fetchProjects();
    fetchResponsibleContacts();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchScheduleTasks(selectedProjectId);
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
        inicio_linha_base: null, // Set as null since it might not exist in the database yet
        termino_linha_base: null, // Set as null since it might not exist in the database yet
        predecessores: task.predecessores || null,
        predecessor_id: null, // For backward compatibility
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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Usuário não autenticado");
        return;
      }

      // Create the activity - Removing the description field since it doesn't exist in the DB
      const { data: activity, error: activityError } = await supabase
        .from('activities')
        .insert({
          project_id: values.projectId,
          name: values.name,
          discipline: values.discipline,
          manager: values.manager,
          responsible: values.responsible,
          unit: values.unit,
          total_qty: Number(values.totalQty),
          created_by: session.user.id
        })
        .select()
        .single();

      if (activityError) {
        console.error("Activity creation error:", activityError);
        throw activityError;
      }

      // If a schedule task was selected, update the link
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

  const showDistributionChart = form.watch("startDate") && 
    form.watch("endDate") && 
    form.watch("totalQty") && 
    form.watch("distributionType") &&
    form.watch("unit");

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
                      disabled={!!projectId} // Disable if project ID is provided in URL
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
                  name="manager"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gerente</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do gerente" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Planejamento de Avanço</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="planningType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Planejamento</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {planningTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
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
                    name="distributionType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Distribuição do Avanço</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a distribuição" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {distributionTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {form.watch("planningType") === "Diário" && (
                  <FormField
                    control={form.control}
                    name="dailyGoal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Diária ({form.watch("unit")})</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {form.watch("planningType") === "Semanal" && (
                  <FormField
                    control={form.control}
                    name="weeklyGoal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Semanal ({form.watch("unit")})</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {form.watch("planningType") === "Mensal" && (
                  <FormField
                    control={form.control}
                    name="monthlyGoal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Mensal ({form.watch("unit")})</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {showDistributionChart && (
                <ProgressDistributionChart
                  startDate={form.watch("startDate")}
                  endDate={form.watch("endDate")}
                  totalQuantity={Number(form.watch("totalQty"))}
                  distributionType={form.watch("distributionType") as DistributionType}
                  unit={form.watch("unit")}
                />
              )}

              {selectedProjectId && (
                <FormField
                  control={form.control}
                  name="scheduleTaskId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vincular à Tarefa do Cronograma</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
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
