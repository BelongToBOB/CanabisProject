import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../ThemeToggle';
import { Menu, LogOut, User } from 'lucide-react';

interface TopbarProps {
  onMenuToggle: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm px-6 dark:border-slate-800 dark:bg-slate-900/80">
      {/* Mobile Menu Toggle */}
      <button
        className="lg:hidden inline-flex items-center justify-center rounded-lg p-2 text-slate-700 hover:bg-slate-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:text-slate-300 dark:hover:bg-slate-800"
        onClick={onMenuToggle}
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* App Title */}
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          ระบบจัดการร้าน Era Chic
        </h1>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Menu Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <User className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
            </div>
            <div className="hidden sm:flex sm:flex-col sm:items-start">
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {user?.username}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {user?.role === 'ADMIN' ? 'ผู้ดูแลระบบ' : 'พนักงาน'}
              </span>
            </div>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-slate-200 focus:outline-none z-50 dark:bg-slate-900 dark:ring-slate-800">
              <div className="py-1">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {user?.username}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {user?.role === 'ADMIN' ? 'ผู้ดูแลระบบ' : 'พนักงาน'}
                  </p>
                </div>

                {/* Logout Button */}
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-slate-50 transition-all duration-200 flex items-center gap-2 dark:text-rose-400 dark:hover:bg-slate-800"
                >
                  <LogOut className="h-4 w-4" />
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
