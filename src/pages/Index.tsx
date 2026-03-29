import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DashboardPage } from '@/pages/DashboardPage';
import { ClientsPage } from '@/pages/ClientsPage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { TasksPage } from '@/pages/TasksPage';
import { ProductivityPage } from '@/pages/ProductivityPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { PlatformCatalogPage } from '@/pages/PlatformCatalogPage';
import { OnboardingChecklistPage } from '@/pages/OnboardingChecklistPage';
import { ActionPlansPage } from '@/pages/ActionPlansPage';
import { CsDashboardPage } from '@/pages/CsDashboardPage';
import { CoordinatorDashboardPage } from '@/pages/CoordinatorDashboardPage';
import { LoginPage } from '@/pages/LoginPage';
import { TasksProvider } from '@/contexts/TasksContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ClientsProvider } from '@/contexts/ClientsContext';
import { SquadsProvider } from '@/contexts/SquadsContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60, retry: 1 },
  },
});

function AppContent() {
  const { currentUser, session, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage />;
      case 'clients': return <ClientsPage />;
      case 'projects': return <ProjectsPage />;
      case 'tasks': return <TasksPage />;
      case 'productivity': return <ProductivityPage />;
      case 'reports': return <ReportsPage />;
      case 'onboarding-checklist': return <OnboardingChecklistPage />;
      case 'cs-dashboard': return (currentUser?.role === 'cs' || currentUser?.role === 'gestao' || (currentUser?.accessLevel ?? 0) >= 2) ? <CsDashboardPage /> : <DashboardPage />;
      case 'action-plans': return (currentUser?.accessLevel ?? 0) >= 2 ? <ActionPlansPage /> : <DashboardPage />;
      case 'coordenador-dashboard': return (currentUser?.accessLevel ?? 0) >= 2 ? <CoordinatorDashboardPage /> : <DashboardPage />;
      case 'platform-catalog': return currentUser?.accessLevel === 3 ? <PlatformCatalogPage /> : <DashboardPage />;
      case 'settings': return currentUser?.accessLevel === 3 ? <SettingsPage /> : <DashboardPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <ErrorBoundary>
      <SquadsProvider>
        <ClientsProvider>
          <TasksProvider>
            <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
              {renderPage()}
            </Layout>
          </TasksProvider>
        </ClientsProvider>
      </SquadsProvider>
    </ErrorBoundary>
  );
}

const Index = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </QueryClientProvider>
);

export default Index;
