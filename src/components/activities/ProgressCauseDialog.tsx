
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

const causes = [
  "Falta de material",
  "Falta de mão de obra",
  "Condições climáticas",
  "Interferência com outras atividades",
  "Problema de equipamento",
  "Retrabalho",
  "Outros",
];

interface ProgressCauseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (cause: { type: string; description: string }) => void;
}

export function ProgressCauseDialog({
  open,
  onOpenChange,
  onSubmit,
}: ProgressCauseDialogProps) {
  const [selectedCause, setSelectedCause] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    onSubmit({
      type: selectedCause,
      description,
    });
    setSelectedCause("");
    setDescription("");
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Registrar Causa do Desvio</AlertDialogTitle>
          <AlertDialogDescription>
            O avanço registrado difere do planejado. Por favor, informe a causa do desvio.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cause">Causa</Label>
            <Select
              value={selectedCause}
              onValueChange={setSelectedCause}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a causa" />
              </SelectTrigger>
              <SelectContent>
                {causes.map((cause) => (
                  <SelectItem key={cause} value={cause}>
                    {cause}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva os detalhes da causa..."
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <Button 
            onClick={handleSubmit}
            disabled={!selectedCause}
          >
            Confirmar
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
