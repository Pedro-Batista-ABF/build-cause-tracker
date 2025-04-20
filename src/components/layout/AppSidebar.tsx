
import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader, // Added missing import
} from "@/components/ui/sidebar";
import {
  Home,
  Calendar,
  ListChecks,
  BarChart2,
  Settings,
  AlertTriangle,
} from "lucide-react";
import { Link } from "react-router-dom";

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        {/*  <Link to="/">
          <h1 className="font-bold text-2xl">Flowise</h1>
        </Link> */}
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Geral</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Dashboard">
                <Link to="/">
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Projetos">
                <Link to="/projects">
                  <Calendar className="h-4 w-4" />
                  <span>Projetos</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Atividades">
                <Link to="/activities">
                  <ListChecks className="h-4 w-4" />
                  <span>Atividades</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Análise</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Indicadores">
                <Link to="/indicators">
                  <BarChart2 className="h-4 w-4" />
                  <span>Indicadores</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Análise de Riscos">
                <Link to="/planning">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Análise de Riscos</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Causas">
                <Link to="/causes">
                  <BarChart2 className="h-4 w-4" />
                  <span>Causas</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Configurações">
                <Link to="/settings">
                  <Settings className="h-4 w-4" />
                  <span>Configurações</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        {/*  <ModeToggle /> */}
      </SidebarFooter>
    </Sidebar>
  );
}
