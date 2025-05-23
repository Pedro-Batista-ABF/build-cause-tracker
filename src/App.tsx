
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { AuthGuard } from "./components/auth/AuthGuard";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import NewProject from "./pages/NewProject";
import Activities from "./pages/Activities";
import NewActivity from "./pages/NewActivity";
import EditActivity from "./pages/EditActivity";
import Indicators from "./pages/Indicators";
import Causes from "./pages/Causes";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import ProjectDetails from "./pages/ProjectDetails";
import PlanningAssistant from "./pages/PlanningAssistant";
import Schedule from "./pages/Schedule";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route element={<AuthGuard />}>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:id" element={<ProjectDetails />} />
                <Route path="/projects/new" element={<NewProject />} />
                <Route path="/activities" element={<Activities />} />
                <Route path="/activities/new" element={<NewActivity />} />
                <Route path="/activities/edit/:id" element={<EditActivity />} />
                <Route path="/indicators" element={<Indicators />} />
                <Route path="/causes" element={<Causes />} />
                <Route path="/planning" element={<PlanningAssistant />} />
                <Route path="/projects/:id/schedule" element={<Schedule />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
