import { useState } from 'react';
import Sidebar from './Sidebar';
import Flow from '@/components/spaces/Flow';
import Garden from '@/components/spaces/Garden';
import Journal from '@/components/spaces/Journal';
import Horizon from '@/components/spaces/Horizon';

type Space = 'Flow' | 'Garden' | 'Journal' | 'Horizon';

const spaceComponents = {
  Flow: <Flow />,
  Garden: <Garden />,
  Journal: <Journal />,
  Horizon: <Horizon />,
};

interface DashboardLayoutProps {
  firstName: string;
  onLogout: () => void;
}

const DashboardLayout = ({ firstName, onLogout }: DashboardLayoutProps) => {
  const [activeSpace, setActiveSpace] = useState<Space>('Flow');

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar
        activeSpace={activeSpace}
        onNavigate={setActiveSpace}
        onLogout={onLogout}
        firstName={firstName}
      />
      <main className="flex-grow p-8 sm:p-12 overflow-auto">
        {spaceComponents[activeSpace]}
      </main>
    </div>
  );
};

export default DashboardLayout;