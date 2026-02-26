import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { DashboardPage } from '@/pages/DashboardPage';
import { ClientsPage } from '@/pages/ClientsPage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { TasksPage } from '@/pages/TasksPage';
import { ProductivityPage } from '@/pages/ProductivityPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { LoginPage } from '@/pages/LoginPage';
import { TasksProvider } from '@/contexts/TasksContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ClientsProvider } from '@/contexts/ClientsContext';
import { SquadsProvider } from '@/contexts/SquadsContext';

function AppContent() {
  const { currentUser } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (!currentUser) {
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
      case 'settings': return currentUser.accessLevel === 3 ? <SettingsPage /> : <DashboardPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <SquadsProvider>
      <ClientsProvider>
        <TasksProvider>
          <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
            {renderPage()}
          </Layout>
        </TasksProvider>
      </ClientsProvider>
    </SquadsProvider>
  );
}

const Index = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default Index;
