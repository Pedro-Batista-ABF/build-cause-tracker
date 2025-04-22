
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatLocalDate } from "@/utils/dateUtils";

interface EditProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progress: {
    id: string;
    date: string;
    actual: number;
    planned: number;
  } | null;
  unit: string;
  onSave: (newValue: number) => void;
}

export function EditProgressDialog({
  open,
  onOpenChange,
  progress,
  unit,
  onSave,
}: EditProgressDialogProps) {
  const [newValue, setNewValue] = useState(progress?.actual?.toString() || "");

  // Reset field on open
  // eslint-disable-next-line
  if (open && progress && newValue !== progress.actual?.toString()) {
    setNewValue(progress.actual.toString());
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Avanço</DialogTitle>
          <DialogDescription>
            Editar avanço do dia {progress ? formatLocalDate(progress.date) : ''}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={e => {
            e.preventDefault();
            onSave(Number(newValue));
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="newValue">Nova quantidade ({unit}):</Label>
            <Input
              id="newValue"
              type="number"
              min="0"
              value={newValue}
              onChange={e => setNewValue(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
