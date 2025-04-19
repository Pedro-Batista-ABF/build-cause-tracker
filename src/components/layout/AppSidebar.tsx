
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";
import { BarChart2, Calendar, FileText, Home, Settings, AlertTriangle } from "lucide-react";

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const isActive = (path: string) => {
    if (path === '/' && currentPath === '/') return true;
    if (path !== '/' && currentPath.startsWith(path)) return true;
    return false;
  };

  return (
    <Sidebar className="bg-card-bg border-r border-border-subtle">
      <SidebarHeader className="flex items-center px-4 py-5">
        <div className="flex items-center space-x-2">
          <div className="bg-accent-blue p-1 rounded">
            <BarChart2 className="h-6 w-6 text-white" />
          </div>
          <span className="font-bold text-lg text-text-primary">LPS Manager</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  className={isActive('/') ? 'bg-accent-blue text-white' : ''}
                >
                  <Link to="/" className="flex items-center">
                    <Home className="mr-2 h-5 w-5" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  className={isActive('/projects') ? 'bg-accent-blue text-white' : ''}
                >
                  <Link to="/projects" className="flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    <span>Projetos</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  className={isActive('/activities') ? 'bg-accent-blue text-white' : ''}
                >
                  <Link to="/activities" className="flex items-center">
                    <Calendar className="mr-2 h-5 w-5" />
                    <span>Atividades</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  className={isActive('/indicators') ? 'bg-accent-blue text-white' : ''}
                >
                  <Link to="/indicators" className="flex items-center">
                    <BarChart2 className="mr-2 h-5 w-5" />
                    <span>Indicadores</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  className={isActive('/causes') ? 'bg-accent-blue text-white' : ''}
                >
                  <Link to="/causes" className="flex items-center">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    <span>Causas</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <SidebarMenuButton 
          asChild
          className={`w-full flex justify-center ${isActive('/settings') ? 'bg-accent-blue text-white' : ''}`}
        >
          <Link to="/settings" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>Configurações</span>
          </Link>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
