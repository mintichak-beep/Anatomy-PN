import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { NavPageId } from '../../types/oralExam';
import { MAIN_NAV_ITEMS } from '../../navigation/navConfig';

interface AppShellProps {
  activePage: NavPageId;
  onNavigate: (page: NavPageId) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  activePage,
  onNavigate,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentNavItem =
    MAIN_NAV_ITEMS.find((item) => item.id === activePage) || MAIN_NAV_ITEMS[0];

  const handleSelectNav = (id: NavPageId) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900">
      {/* Desktop & Tablet Landscape Compact Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:shrink-0 bg-white border-r border-slate-200">
        <div className="h-16 px-5 flex items-center border-b border-slate-200">
          <button
            type="button"
            onClick={() => handleSelectNav('dashboard')}
            className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Oral Test Management
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1" aria-label="เมนูหลัก">
          {MAIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activePage;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectNav(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-500'
                  }`}
                />
                <span className="truncate">{item.labelTh}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-slate-100 text-xs text-slate-500">
          ระบบสอบปากเปล่าแบบตัวต่อตัว
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="md:hidden p-2 -ml-1.5 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              aria-label={mobileMenuOpen ? 'ปิดเมนูนำทาง' : 'เปิดเมนูนำทาง'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <span className="md:hidden text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
              Oral Test Management
            </span>

            <span className="hidden md:inline-block text-sm font-medium text-slate-600 truncate">
              {currentNavItem.labelTh}
            </span>
          </div>

          <div className="text-xs text-slate-500 whitespace-nowrap shrink-0">
            สำหรับอาจารย์ผู้ประเมิน
          </div>
        </header>

        {/* Mobile / Compact Drawer Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-3 py-3 space-y-1">
            {MAIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === activePage;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectNav(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-500'
                    }`}
                  />
                  <span>{item.labelTh}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 w-full max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
};
