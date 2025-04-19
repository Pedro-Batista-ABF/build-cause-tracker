
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { Outlet, useLocation } from "react-router-dom";

export function MainLayout() {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  const getBreadcrumbTitle = (segment: string) => {
    switch(segment) {
      case 'projects': return 'Projetos';
      case 'activities': return 'Atividades';
      case 'indicators': return 'Indicadores';
      case 'settings': return 'Configurações';
      default: return segment;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="bg-white border-b p-4 flex items-center">
            <SidebarTrigger />
            {pathSegments.length > 0 && (
              <Breadcrumb className="ml-4">
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                {pathSegments.map((segment, index) => (
                  <BreadcrumbItem key={segment}>
                    <BreadcrumbLink 
                      href={`/${pathSegments.slice(0, index + 1).join('/')}`}
                    >
                      {getBreadcrumbTitle(segment)}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                ))}
              </Breadcrumb>
            )}
          </header>
          
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
