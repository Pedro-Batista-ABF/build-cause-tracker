
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
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useState } from "react"
import { supabase } from "@/integrations/supabase/client"

const formSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  client: z.string().min(2, "Cliente deve ter pelo menos 2 caracteres"),
  contract: z.string().min(2, "Contrato deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  start_date: z.string(),
  end_date: z.string(),
})

export default function NewProject() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      client: "",
      contract: "",
      description: "",
      start_date: "",
      end_date: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true)
      console.log("Enviando dados para o Supabase:", values)
      
      // Inserir o projeto no banco de dados usando Supabase
      const { data, error } = await supabase
        .from("projects")
        .insert({
          name: values.name,
          client: values.client,
          contract: values.contract,
          description: values.description || null,
          start_date: values.start_date,
          end_date: values.end_date,
          status: "active", // Define o status inicial como ativo
          ppc: 0 // Inicializa o PPC como zero
        })
        .select()

      if (error) {
        console.error("Erro ao salvar projeto:", error)
        toast.error(`Erro ao criar projeto: ${error.message}`)
        return
      }

      console.log("Projeto criado com sucesso:", data)
      toast.success("Projeto criado com sucesso!")
      navigate("/projects")
    } catch (error) {
      console.error("Erro ao processar formulário:", error)
      toast.error("Ocorreu um erro ao criar o projeto. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Novo Projeto</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cadastro de Projeto</CardTitle>
          <CardDescription>
            Preencha as informações do novo projeto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Projeto</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Projeto ALUMAR" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="client"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do cliente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contract"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contrato</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: CT-2024-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descreva o projeto..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="start_date"
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
                  name="end_date"
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

              <div className="flex justify-end space-x-4">
                <Button variant="outline" type="button" onClick={() => navigate("/projects")}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Criando..." : "Criar Projeto"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
