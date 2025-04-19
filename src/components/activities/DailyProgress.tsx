
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface DailyProgressProps {
  activityId: string;
  activityName: string;
  unit: string;
  totalQty: number;
}

export function DailyProgress({ activityId, activityName, unit, totalQty }: DailyProgressProps) {
  const [quantity, setQuantity] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [open, setOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Here you would typically send this to your backend
    console.log({
      activityId,
      date,
      quantity: Number(quantity),
    });

    toast.success("Avanço registrado com sucesso!");
    setOpen(false);
    setQuantity("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Registrar Avanço
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Avanço Diário</DialogTitle>
          <DialogDescription>
            {activityName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade ({unit})</Label>
            <Input
              id="quantity"
              type="number"
              placeholder={`0 ${unit}`}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="0"
              max={totalQty}
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
