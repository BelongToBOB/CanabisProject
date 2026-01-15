import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Home,
  Plus,
  Users,
  Package,
  ClipboardList,
  BarChart3,
  DollarSign,
  PieChart,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  end?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, collapsed, end = false }) => {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
          'hover:bg-slate-100 dark:hover:bg-slate-800',
          isActive
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : 'text-slate-700 dark:text-slate-300',
          collapsed && 'justify-center'
        )
      }
      title={collapsed ? label : undefined}
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && <span className="flex-1">{label}</span>}
    </NavLink>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { user } = useAuth();

  return (
    <>
      {/* Mobile Overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-in-out',
          'dark:border-slate-800 dark:bg-slate-900',
          'lg:fixed lg:z-auto',
          collapsed ? 'w-16' : 'w-64',
          // Mobile: slide in from left
          !collapsed ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
          {!collapsed && (
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Era Chic
            </h2>
          )}
          <button
            onClick={onToggle}
            className={cn(
              'rounded-lg p-2 text-slate-700 transition-all duration-200 hover:bg-slate-100',
              'dark:text-slate-300 dark:hover:bg-slate-800',
              collapsed && 'mx-auto'
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {/* Dashboard - Available to all */}
          <NavItem
            to="/"
            icon={<Home className="h-5 w-5" />}
            label="แดชบอร์ด"
            collapsed={collapsed}
            end
          />

          {/* Sales Order Creation - Available to Admin and Staff */}
          {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
            <NavItem
              to="/sales-orders/create"
              icon={<Plus className="h-5 w-5" />}
              label="สร้างออเดอร์ขาย"
              collapsed={collapsed}
            />
          )}

          {/* Admin-only sections */}
          {user?.role === 'ADMIN' && (
            <>
              {/* Section Header */}
              {!collapsed && (
                <div className="px-3 py-2 mt-4">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                    การจัดการ
                  </h3>
                </div>
              )}

              <NavItem
                to="/users"
                icon={<Users className="h-5 w-5" />}
                label="ผู้ใช้งานระบบ"
                collapsed={collapsed}
              />

              <NavItem
                to="/batches"
                icon={<Package className="h-5 w-5" />}
                label="รายการสินค้าที่ขาย"
                collapsed={collapsed}
              />

              <NavItem
                to="/sales-orders"
                icon={<ClipboardList className="h-5 w-5" />}
                label="รายการออเดอร์"
                collapsed={collapsed}
              />

              {/* Reports Section */}
              {!collapsed && (
                <div className="px-3 py-2 mt-4">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                    รายงาน
                  </h3>
                </div>
              )}

              <NavItem
                to="/reports/inventory"
                icon={<BarChart3 className="h-5 w-5" />}
                label="รายงานสต็อกสินค้า"
                collapsed={collapsed}
              />

              <NavItem
                to="/reports/monthly-profit"
                icon={<DollarSign className="h-5 w-5" />}
                label="สรุปผลกำไรรายเดือน"
                collapsed={collapsed}
              />

              <NavItem
                to="/profit-shares"
                icon={<PieChart className="h-5 w-5" />}
                label="ผลการแบ่งกำไร"
                collapsed={collapsed}
              />
            </>
          )}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
