import { useState } from 'react';
import Sidebar, { View } from './Sidebar';
import Flow from '@/components/spaces/Flow';
import Garden from '@/components/spaces/Garden';
import Journal from '@/components/spaces/Journal';
import Horizon from '@/components/spaces/Horizon';
import DashboardOverview from '@/components/DashboardOverview';

interface DashboardLayoutProps {
  firstName: string;
  onLogout: () => void;
}

const DashboardLayout = ({ firstName, onLogout }: DashboardLayoutProps) => {
  const [activeView, setActiveView] = useState<View>('Overview');

  const renderContent = () => {
    switch (activeView) {
      case 'Overview':
        return (
          <DashboardOverview
            firstName={firstName}
            onNavigate={setActiveView}
          />
        );
      case 'Flow':
        return <Flow />;
      case 'Garden':
        return <Garden />;
      case 'Journal':
        return <Journal />;
      case 'Horizon':
        return <Horizon />;
      default:
        return (
          <DashboardOverview
            firstName={firstName}
            onNavigate={setActiveView}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        onLogout={onLogout}
        firstName={firstName}
      />
      <main className="flex-grow p-8 sm:p-12 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default DashboardLayout;