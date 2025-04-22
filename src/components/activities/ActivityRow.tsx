import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ActivityDetails } from "./ActivityDetails";
import { DistributionType } from "@/utils/progressDistribution";

interface ActivityRowProps {
  id: string;
  name: string;
  discipline: string;
  responsible: string;
  team: string;
  unit: string;
  totalQty: number;
  progress: number;
  ppc: number;
  adherence: number;
  startDate?: string;
  endDate?: string;
  distributionType?: DistributionType;
}

export function ActivityRow({
  id,
  name,
  discipline,
  responsible,
  team,
  unit,
  totalQty,
  progress,
  ppc,
  adherence,
  startDate,
  endDate,
  distributionType,
}: ActivityRowProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
      <div className="md:col-span-2">
        <h3 className="font-semibold">{name}</h3>
        <p className="text-sm text-muted-foreground">
          {discipline} - {responsible} - {team}
        </p>
      </div>
      <div>
        <Progress value={progress} />
        <p className="text-sm text-muted-foreground text-right">
          {progress}% ({totalQty} {unit})
        </p>
      </div>
      <div className="text-center">
        <p className="text-sm">
          PPC: {ppc}%
        </p>
        <p className="text-sm">
          Aderência: {adherence}%
        </p>
      </div>
      <div className="text-right">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Detalhes</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{name}</DialogTitle>
              <DialogDescription>
                Informações detalhadas da atividade.
              </DialogDescription>
            </DialogHeader>
            <ActivityDetails
              activityId={id}
              activityName={name}
              unit={unit}
              totalQty={totalQty}
              startDate={startDate}
              endDate={endDate}
              distributionType={distributionType}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
