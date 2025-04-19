
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Cause {
  cause: string;
  count: number;
  category: string;
}

interface CausesAnalysisProps {
  causes: Cause[];
}

export function CausesAnalysis({ causes }: CausesAnalysisProps) {
  return (
    <Card className="bg-card-bg border-border-subtle">
      <CardHeader>
        <CardTitle className="text-text-primary">Principais Causas</CardTitle>
        <CardDescription className="text-text-secondary">
          Causas mais frequentes de baixo PPC
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {causes.map((cause, index) => (
            <div key={index} className="flex items-center justify-between">
              <div>
                <div className="font-medium text-text-primary">{cause.cause}</div>
                <div className="text-sm text-text-secondary">
                  {cause.category}
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-32 h-2 bg-border rounded-full overflow-hidden mr-2">
                  <div
                    className="h-full bg-accent-red"
                    style={{ width: `${(cause.count / 12) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-text-primary">{cause.count}</span>
              </div>
            </div>
          ))}
          <Button variant="outline" className="w-full border-border-subtle text-text-primary hover:bg-hover-bg" asChild>
            <Link to="/indicators/causes">Ver análise detalhada</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
