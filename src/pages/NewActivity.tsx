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
import { Slider } from "@/components/ui/slider"
import { ProgressDistributionChart } from "@/components/activities/ProgressDistributionChart";
import { DistributionType } from "@/utils/progressDistribution";

const formSchema = z.object({
  projectId: z.string().min(1, "Selecione um projeto"),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  discipline: z.string().min(1, "Selecione uma disciplina"),
  manager: z.string().min(2, "Responsável deve ter pelo menos 2 caracteres"),
  responsible: z.string().min(2, "Equipe deve ter pelo menos 2 caracteres"),
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

const mockProjects = [
  { id: "1", name: "Projeto ALUMAR" },
  { id: "2", name: "Expansão Setor 4" },
  { id: "3", name: "Modernização Unidade Sul" },
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
  const { projectId } = useParams(); // Add this line to get project ID from URL
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId: projectId || "", // Set default project ID from URL
      name: "",
      discipline: "",
      manager: "",
      responsible: "",
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
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
    toast.success("Atividade criada com sucesso!")
    navigate("/activities")
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
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={!!projectId} // Disable if project ID is provided in URL
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um projeto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockProjects.map((project) => (
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
                      <FormLabel>Responsável</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do responsável" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="responsible"
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

              <div className="flex justify-end space-x-4">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => navigate("/activities")}
                >
                  Cancelar
                </Button>
                <Button type="submit">Criar Atividade</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
