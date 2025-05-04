import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
import { ActivityScheduleItems } from "@/components/activities/ActivityScheduleItems";

export default function EditActivity() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const returnPath = location.state?.returnTo || "/activities";
  
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
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [responsibleContacts, setResponsibleContacts] = useState<Array<{ id: string; name: string; email: string; discipline: string | null }>>([]);
  const [activities, setActivities] = useState<Array<{ id: string; name: string }>>([]);
  const [activeTab, setActiveTab] = useState("basic");

  useEffect(() => {
    if (id) {
      fetchActivity();
      fetchProjects();
      fetchResponsibleContacts();
    }
  }, [id]);

  useEffect(() => {
    if (activity.project_id) {
      fetchProjectActivities(activity.project_id);
    }
  }, [activity.project_id]);

  async function fetchActivity() {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        // Check if there's schedule data
        const hasScheduleData = !!(data.schedule_start_date || data.schedule_end_date || 
                                 data.schedule_predecessor_id || data.schedule_duration_days !== null);

        setActivity({
          name: data.name || "",
          discipline: data.discipline || "",
          responsible: data.responsible || "",
          team: data.team || "",
          unit: data.unit || "",
          total_qty: data.total_qty || 0,
          start_date: data.start_date || "",
          end_date: data.end_date || "",
          project_id: data.project_id || "",
          description: data.description || "",
          has_schedule: hasScheduleData,
          schedule_start_date: data.schedule_start_date || "",
          schedule_end_date: data.schedule_end_date || "",
          schedule_predecessor_id: data.schedule_predecessor_id || "",
          schedule_duration_days: data.schedule_duration_days || 0,
          schedule_percent_complete: data.schedule_percent_complete || 0,
          has_detailed_schedule: data.has_detailed_schedule || false
        });
        
        // Se tiver cronograma detalhado, ativar a aba de cronograma
        if (data.has_detailed_schedule) {
          setActiveTab("schedule");
        }
      }
    } catch (error) {
      console.error("Error fetching activity:", error);
      toast.error("Erro ao carregar atividade");
    } finally {
      setIsLoading(false);
    }
  }

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
        .eq("project_id", projectId)
        .neq("id", id); // Exclude current activity

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
    e.stopPropagation();
    
    try {
      setIsSaving(true);
      
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
      } else {
        // If has_schedule is false, set all schedule fields to null
        activityData.schedule_start_date = null;
        activityData.schedule_end_date = null;
        activityData.schedule_predecessor_id = null;
        activityData.schedule_duration_days = null;
        activityData.schedule_percent_complete = null;
      }

      console.log("Updating activity with data:", activityData);

      const { error } = await supabase
        .from("activities")
        .update(activityData)
        .eq("id", id);

      if (error) {
        console.error("Error updating activity:", error); 
        toast.error(`Erro ao atualizar atividade: ${error.message || 'Erro desconhecido'}`);
        throw error;
      }

      toast.success("Atividade atualizada com sucesso!");
      
      // Check if this is a form submission from the main form buttons
      // by checking if the event has a submitter property
      const isMainFormSubmit = e.nativeEvent instanceof SubmitEvent && 
                             e.nativeEvent.submitter && 
                             e.nativeEvent.submitter instanceof HTMLButtonElement;
      
      if (isMainFormSubmit) {
        // If it was the main form's submit button, navigate back preserving filters
        navigate(returnPath);
      } else {
        // Otherwise, stay on the current page (for subactivity operations)
        setIsSaving(false);
      }
    } catch (error) {
      console.error("Error updating activity:", error);
      toast.error("Erro ao atualizar atividade");
      setIsSaving(false);
    }
  };

  // Function for the Cancel button
  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(returnPath);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center">
          <Button variant="outline" onClick={() => navigate(returnPath)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Atividades
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-64">
              <p>Carregando...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate(returnPath)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Atividades
        </Button>
        <h1 className="text-3xl font-bold">Editar Atividade</h1>
        <div className="w-40"></div>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Informações da Atividade</CardTitle>
            <CardDescription>
              Atualize os detalhes da atividade
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
                      id="has-detailed-schedule"
                      checked={activity.has_detailed_schedule}
                      onCheckedChange={handleDetailedScheduleChange}
                    />
                    <Label htmlFor="has-detailed-schedule">
                      Habilitar cronograma detalhado (subatividades)
                    </Label>
                  </div>
                  
                  {activity.has_detailed_schedule && id ? (
                    <ActivityScheduleItems activityId={id} />
                  ) : (
                    <div className="bg-muted/30 p-6 rounded-md text-center text-muted-foreground">
                      <p>Ative o cronograma detalhado para adicionar e gerenciar subatividades.</p>
                      <p className="text-xs mt-2">Isso permitirá dividir a atividade principal em etapas menores e rastrear o progresso de cada uma separadamente.</p>
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
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSaving}
            >
              {isSaving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
