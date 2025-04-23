
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProjectActivities } from "@/components/projects/ProjectActivities";
import { AuthCheck } from "@/components/auth/AuthCheck";

export default function Activities() {
  const navigate = useNavigate();

  return (
    <AuthCheck>
      <div className="container py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Atividades</h1>
          <Button onClick={() => navigate("/activities/new")}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Nova Atividade
          </Button>
        </div>
        <ProjectActivities projectId="all" />
      </div>
    </AuthCheck>
  );
}
