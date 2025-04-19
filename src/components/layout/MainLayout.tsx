
import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { Outlet, useLocation } from "react-router-dom";
import { Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function MainLayout() {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  
  const getBreadcrumbTitle = (segment: string) => {
    switch(segment) {
      case 'projects': return 'Projetos';
      case 'activities': return 'Atividades';
      case 'indicators': return 'Indicadores';
      case 'causes': return 'Causas';
      case 'settings': return 'Configurações';
      default: return segment;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-dark-bg">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="bg-card-bg border-b border-border-subtle p-4 flex items-center justify-between">
            <div className="flex items-center">
              <SidebarTrigger className="text-text-secondary hover:text-text-primary mr-4" />
              {pathSegments.length > 0 ? (
                <Breadcrumb className="text-text-secondary">
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/" className="hover:text-text-primary">Dashboard</BreadcrumbLink>
                  </BreadcrumbItem>
                  {pathSegments.map((segment, index) => (
                    <BreadcrumbItem key={segment}>
                      <BreadcrumbLink 
                        href={`/${pathSegments.slice(0, index + 1).join('/')}`}
                        className="hover:text-text-primary"
                      >
                        {getBreadcrumbTitle(segment)}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  ))}
                </Breadcrumb>
              ) : (
                <div className="flex items-center">
                  {companyLogo ? (
                    <img src={companyLogo} alt="Company logo" className="h-8 mr-2" />
                  ) : (
                    <span className="text-lg font-semibold text-text-primary">LPS Manager</span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-text-secondary" />
                <Input 
                  placeholder="Buscar..." 
                  className="pl-8 bg-dark-bg border-border-subtle h-9" 
                />
              </div>
              
              <Avatar className="h-8 w-8">
                <AvatarImage src="" />
                <AvatarFallback className="bg-accent-blue text-white">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </div>
          </header>
          
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
