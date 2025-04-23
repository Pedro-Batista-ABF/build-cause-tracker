import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";

export default function EditActivity() {
  const { id } = useParams<{ id: string }>();
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
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [responsibleContacts, setResponsibleContacts] = useState<Array<{ id: string; name: string; email: string; discipline: string | null }>>([]);

  useEffect(() => {
    if (id) {
      fetchActivity();
      fetchProjects();
      fetchResponsibleContacts();
    }
  }, [id]);

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
        });
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setActivity((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setActivity((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from("activities")
        .update({
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
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Atividade atualizada com sucesso!");
      navigate("/activities");
    } catch (error) {
      console.error("Error updating activity:", error);
      toast.error("Erro ao atualizar atividade");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center">
          <Button variant="outline" onClick={() => navigate("/activities")}>
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
        <Button variant="outline" onClick={() => navigate("/activities")}>
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
                    onChange={handleChange}
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
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/activities")}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
