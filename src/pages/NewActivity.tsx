
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export default function NewActivity() {
  const navigate = useNavigate();
  
  const [activity, setActivity] = useState({
    name: "",
    discipline: "",
    responsible: "",
    team: "",
    unit: "",
    total_qty: 0,
    start_date: "",
    end_date: "",
    project_id: "",
    description: "",
    // Schedule-related fields
    has_schedule: false,
    schedule_start_date: "",
    schedule_end_date: "",
    schedule_predecessor_id: "",
    schedule_duration_days: 0,
    schedule_percent_complete: 0,
    // Detailed schedule flag
    has_detailed_schedule: false
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [responsibleContacts, setResponsibleContacts] = useState<Array<{ id: string; name: string; email: string; discipline: string | null }>>([]);
  const [activities, setActivities] = useState<Array<{ id: string; name: string }>>([]);
  const [activeTab, setActiveTab] = useState("basic");

  useEffect(() => {
    fetchProjects();
    fetchResponsibleContacts();
  }, []);

  useEffect(() => {
    if (activity.project_id) {
      fetchProjectActivities(activity.project_id);
    }
  }, [activity.project_id]);

  async function fetchProjects() {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name");

      if (error) {
        throw error;
      }

      if (data) {
        setProjects(data);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Erro ao carregar projetos");
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setActivity((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setActivity((prev) => ({ ...prev, [name]: value === "" ? 0 : Number(value) }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setActivity((prev) => ({ ...prev, [field]: value }));
  };

  const handleHasScheduleChange = (checked: boolean) => {
    setActivity((prev) => ({ ...prev, has_schedule: checked }));
  };

  const handleDetailedScheduleChange = (checked: boolean) => {
    setActivity((prev) => ({ ...prev, has_detailed_schedule: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      const activityData: any = {
        name: activity.name,
        discipline: activity.discipline,
        responsible: activity.responsible,
        team: activity.team,
        unit: activity.unit,
        total_qty: activity.total_qty,
        start_date: activity.start_date || null,
        end_date: activity.end_date || null,
        project_id: activity.project_id || null,
        description: activity.description,
        has_detailed_schedule: activity.has_detailed_schedule
      };

      // Add schedule fields only if has_schedule is true
      if (activity.has_schedule) {
        activityData.schedule_start_date = activity.schedule_start_date || null;
        activityData.schedule_end_date = activity.schedule_end_date || null;
        activityData.schedule_predecessor_id = activity.schedule_predecessor_id === "none" ? null : activity.schedule_predecessor_id || null;
        activityData.schedule_duration_days = activity.schedule_duration_days || null;
        activityData.schedule_percent_complete = activity.schedule_percent_complete || 0;
      }

      const { data, error } = await supabase
        .from("activities")
        .insert(activityData)
        .select()
        .single();

      if (error) throw error;

      toast.success("Atividade criada com sucesso!");
      navigate("/activities");
    } catch (error) {
      console.error("Error creating activity:", error);
      toast.error("Erro ao criar atividade");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate("/activities")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Atividades
        </Button>
        <h1 className="text-3xl font-bold">Nova Atividade</h1>
        <div className="w-40"></div>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Informações da Atividade</CardTitle>
            <CardDescription>
              Preencha todos os campos necessários para criar uma nova atividade
            </CardDescription>
          </CardHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="px-6">
              <TabsList className="mb-4">
                <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
                <TabsTrigger value="schedule">Cronograma</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="basic">
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome da Atividade</Label>
                    <Input
                      id="name"
                      name="name"
                      value={activity.name}
                      onChange={handleChange}
                      placeholder="Ex: Concretagem do Bloco A"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="discipline">Disciplina</Label>
                      <Input
                        id="discipline"
                        name="discipline"
                        value={activity.discipline}
                        onChange={handleChange}
                        placeholder="Ex: Estrutura"
                      />
                    </div>
                    <div>
                      <Label htmlFor="project">Projeto</Label>
                      <Select
                        value={activity.project_id}
                        onValueChange={(value) => handleSelectChange("project_id", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um projeto" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="responsible">Responsável</Label>
                      <Select
                        value={activity.responsible}
                        onValueChange={(value) => handleSelectChange("responsible", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um responsável" />
                        </SelectTrigger>
                        <SelectContent>
                          {responsibleContacts.map((contact) => (
                            <SelectItem key={contact.id} value={contact.name}>
                              {contact.name} {contact.discipline ? `(${contact.discipline})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="team">Equipe</Label>
                      <Input
                        id="team"
                        name="team"
                        value={activity.team}
                        onChange={handleChange}
                        placeholder="Ex: Equipe A"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="total_qty">Quantidade Total</Label>
                      <Input
                        id="total_qty"
                        name="total_qty"
                        type="number"
                        value={activity.total_qty}
                        onChange={handleNumberChange}
                        placeholder="Ex: 100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="unit">Unidade</Label>
                      <Input
                        id="unit"
                        name="unit"
                        value={activity.unit}
                        onChange={handleChange}
                        placeholder="Ex: m²"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_date">Data de Início</Label>
                      <Input
                        id="start_date"
                        name="start_date"
                        type="date"
                        value={activity.start_date}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_date">Data de Término</Label>
                      <Input
                        id="end_date"
                        name="end_date"
                        type="date"
                        value={activity.end_date}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={activity.description}
                      onChange={handleChange}
                      placeholder="Descreva os detalhes da atividade..."
                    />
                  </div>
                </div>
              </CardContent>
            </TabsContent>
            
            <TabsContent value="schedule">
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="has-schedule"
                      checked={activity.has_schedule}
                      onCheckedChange={handleHasScheduleChange}
                    />
                    <Label htmlFor="has-schedule">
                      Habilitar cronograma para esta atividade
                    </Label>
                  </div>
                  
                  {activity.has_schedule && (
                    <div className="space-y-4 pl-6 border-l-2 border-muted mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="schedule_start_date">Data de Início Planejada</Label>
                          <Input
                            id="schedule_start_date"
                            name="schedule_start_date"
                            type="date"
                            value={activity.schedule_start_date}
                            onChange={handleChange}
                            disabled={activity.schedule_predecessor_id && activity.schedule_predecessor_id !== "none"}
                          />
                          {activity.schedule_predecessor_id && activity.schedule_predecessor_id !== "none" && (
                            <p className="text-xs text-muted-foreground mt-1">
                              A data de início é determinada pelo predecessor
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="schedule_end_date">Data de Término Planejada</Label>
                          <Input
                            id="schedule_end_date"
                            name="schedule_end_date"
                            type="date"
                            value={activity.schedule_end_date}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="schedule_predecessor_id">Atividade Predecessora</Label>
                          <Select
                            value={activity.schedule_predecessor_id || "none"}
                            onValueChange={(value) => handleSelectChange("schedule_predecessor_id", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma atividade predecessora" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Nenhum predecessor</SelectItem>
                              {activities.map((act) => (
                                <SelectItem key={act.id} value={act.id}>
                                  {act.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="schedule_duration_days">Duração (dias)</Label>
                          <Input
                            id="schedule_duration_days"
                            name="schedule_duration_days"
                            type="number"
                            min="1"
                            value={activity.schedule_duration_days}
                            onChange={handleNumberChange}
                          />
                        </div>
                      </div>
                  
                      <div>
                        <div className="flex items-center gap-2 mt-4">
                          <Switch
                            id="has-detailed-schedule"
                            checked={activity.has_detailed_schedule}
                            onCheckedChange={handleDetailedScheduleChange}
                          />
                          <Label htmlFor="has-detailed-schedule">
                            Habilitar cronograma detalhado (subatividades)
                          </Label>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 pl-7">
                          Após criar a atividade, você poderá adicionar subatividades ao cronograma
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {!activity.has_schedule && (
                    <div className="bg-muted/30 p-6 rounded-md text-center text-muted-foreground">
                      <p>Ative o cronograma para configurar informações de planejamento.</p>
                      <p className="text-xs mt-2">Isso permitirá definir datas, predecessores e controlar o progresso da atividade.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </TabsContent>
          </Tabs>
          
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/activities")}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Criando..." : "Criar Atividade"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
