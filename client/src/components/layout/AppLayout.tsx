import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Breadcrumb from '../Breadcrumb';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Sidebar - Fixed width, no shrink */}
      <div className={`shrink-0 ${sidebarCollapsed ? 'w-0 lg:w-16' : 'w-0 lg:w-64'}`}>
        <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      </div>

      {/* Main Content Area - Flex 1 with min-width 0 to prevent overflow */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <Topbar onMenuToggle={toggleSidebar} />

        {/* Main Content with Breadcrumb */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6">
            <Breadcrumb />
            <div className="mt-4">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
