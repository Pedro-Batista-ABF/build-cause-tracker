
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SidebarSection } from "@/components/ui/sidebar";
import { BarChart2, LayoutDashboard, FileText, Settings, LogOut, Lightbulb } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function AppSidebar() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut?.();
    navigate("/auth");
  };

  return (
    <SidebarSection className="w-full h-full max-w-[250px] border-r border-border-subtle bg-card-bg p-4 flex flex-col">
      <div className="flex items-center gap-2 py-2 mb-6">
        <div className="w-8 h-8 bg-accent-blue rounded-md flex items-center justify-center text-white font-bold">L</div>
        <span className="text-lg font-semibold text-text-primary">LPS Manager</span>
      </div>

      <div className="space-y-1 mb-6">
        <Button 
          variant="ghost" 
          className="w-full justify-start" 
          onClick={() => navigate("/")}
        >
          <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
        </Button>
        <Button 
          variant="ghost" 
          className="w-full justify-start" 
          onClick={() => navigate("/projects")}
        >
          <FileText className="h-4 w-4 mr-2" /> Projetos
        </Button>
        <Button 
          variant="ghost" 
          className="w-full justify-start" 
          onClick={() => navigate("/activities")}
        >
          <FileText className="h-4 w-4 mr-2" /> Atividades
        </Button>
        <Button 
          variant="ghost" 
          className="w-full justify-start" 
          onClick={() => navigate("/indicators")}
        >
          <BarChart2 className="h-4 w-4 mr-2" /> Indicadores
        </Button>
        <Button 
          variant="ghost" 
          className="w-full justify-start" 
          onClick={() => navigate("/causes")}
        >
          <FileText className="h-4 w-4 mr-2" /> Causas
        </Button>
        <Button 
          variant="ghost" 
          className="w-full justify-start" 
          onClick={() => navigate("/planning")}
        >
          <Lightbulb className="h-4 w-4 mr-2" /> Assist. Planejamento
        </Button>
      </div>

      <div className="mt-auto space-y-1">
        <Button 
          variant="ghost" 
          className="w-full justify-start" 
          onClick={() => navigate("/settings")}
        >
          <Settings className="h-4 w-4 mr-2" /> Configurações
        </Button>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-accent-red hover:text-accent-red" 
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" /> Sair
        </Button>
      </div>
    </SidebarSection>
  );
}
