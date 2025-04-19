
import { ActivityRow } from "@/components/activities/ActivityRow";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const mockActivities = [
  {
    id: "1",
    name: "Montagem de Estrutura Metálica",
    discipline: "Montagem Civil",
    manager: "João Silva",
    responsible: "Equipe A",
    unit: "ton",
    totalQty: 120,
    progress: 65,
    ppc: 95,
    adherence: 98,
  },
  {
    id: "2",
    name: "Lançamento de Cabos",
    discipline: "Elétrica",
    manager: "Maria Oliveira",
    responsible: "Equipe B",
    unit: "m",
    totalQty: 5000,
    progress: 43,
    ppc: 85,
    adherence: 92,
  },
  {
    id: "3",
    name: "Instalação de Equipamentos",
    discipline: "Mecânica",
    manager: "Carlos Santos",
    responsible: "Equipe C",
    unit: "un",
    totalQty: 45,
    progress: 72,
    ppc: 65,
    adherence: 78,
  },
  {
    id: "4",
    name: "Pintura Industrial",
    discipline: "Civil",
    manager: "Ana Costa",
    responsible: "Equipe D",
    unit: "m²",
    totalQty: 3500,
    progress: 90,
    ppc: 98,
    adherence: 97,
  },
];

export default function Activities() {
  const [filter, setFilter] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState("all");

  const filteredActivities = mockActivities.filter((activity) => {
    const matchesFilter =
      activity.name.toLowerCase().includes(filter.toLowerCase()) ||
      activity.manager.toLowerCase().includes(filter.toLowerCase()) ||
      activity.responsible.toLowerCase().includes(filter.toLowerCase());

    const matchesDiscipline =
      disciplineFilter === "all" || activity.discipline === disciplineFilter;

    return matchesFilter && matchesDiscipline;
  });

  const disciplines = Array.from(
    new Set(mockActivities.map((activity) => activity.discipline))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Atividades</h1>
        <Button asChild>
          <Link to="/activities/new">
            <Plus className="mr-2 h-4 w-4" /> Nova Atividade
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Atividades</CardTitle>
          <CardDescription>
            Gerenciamento de atividades e apontamentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar atividades..."
                className="pl-8"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            <Select
              value={disciplineFilter}
              onValueChange={setDisciplineFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Disciplina" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {disciplines.map((discipline) => (
                  <SelectItem key={discipline} value={discipline}>
                    {discipline}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredActivities.map((activity) => (
              <ActivityRow key={activity.id} {...activity} />
            ))}
          </div>

          {filteredActivities.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Nenhuma atividade encontrada com os filtros aplicados.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
