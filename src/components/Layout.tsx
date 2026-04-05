import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, TrendingUp, Newspaper,
  FileBarChart, CalendarDays, ChevronLeft, ChevronRight,
  Menu, Sun, Moon, Activity
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

// ── Nav Definition ─────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/investment', label: 'Investment', icon: Briefcase },
  { href: '/markets', label: 'Märkte', icon: TrendingUp },
  { href: '/news', label: 'News Feed', icon: Newspaper },
  { href: '/earnings', label: 'Ergebnisse', icon: FileBarChart },
  { href: '/earnings-calendar', label: 'Ergebnis-Kalender', icon: CalendarDays },
];

// ── NavItem ────────────────────────────────────────────────────────────────────

const NavItem: React.FC<{
  item: typeof NAV_ITEMS[0];
  collapsed: boolean;
  onClick?: () => void;
}> = ({ item, collapsed, onClick }) => {
  const location = useLocation();
  const Icon = item.icon;
  const isActive = location.pathname === item.href;

  return (
    <Link
      to={item.href}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={`
        nav-item ${isActive ? 'active' : ''}
        ${collapsed ? 'justify-center px-0' : ''}
      `}
    >
      <Icon
        size={18}
        className="flex-shrink-0"
      />
      {!collapsed && (
        <span className="truncate">{item.label}</span>
      )}
    </Link>
  );
};

// ── Layout ─────────────────────────────────────────────────────────────────────

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  React.useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const currentPage = NAV_ITEMS.find(n => n.href === location.pathname)?.label ?? 'Dashboard';

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full bg-[var(--bg-sidebar)]">
      <div className={`flex items-center h-14 px-4 border-b border-[var(--border-main)] flex-shrink-0 ${collapsed && !isMobile ? 'justify-center' : 'gap-3'}`}>
        <div className="w-6 h-6 rounded bg-[var(--accent-blue)] flex items-center justify-center flex-shrink-0">
          <Activity size={12} className="text-white" />
        </div>
        {(!collapsed || isMobile) && (
          <span className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
            Trading<span className="text-[var(--accent-blue)]">View</span>
          </span>
        )}
      </div>

      <nav className="flex-1 py-2 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <NavItem
            key={item.href}
            item={item}
            collapsed={collapsed && !isMobile}
            onClick={isMobile ? () => setMobileOpen(false) : undefined}
          />
        ))}
      </nav>

      <div className="p-4 border-t border-[var(--border-main)] flex-shrink-0 bg-[var(--bg-sidebar)]">
        <div className="flex items-center gap-3">
           <div className="w-2 h-2 rounded-full bg-[var(--accent-green)]" />
           {(!collapsed || isMobile) && <span className="text-[11px] font-medium text-[var(--accent-green)]">CONNECTED</span>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex text-[var(--text-primary)] bg-[var(--bg-main)]">
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
              className="fixed inset-y-0 left-0 z-[70] w-64 bg-[var(--bg-sidebar)] border-r border-[var(--border-main)] shadow-2xl lg:hidden"
            >
              <SidebarContent isMobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <aside
        className={`
          hidden lg:flex flex-col z-40 flex-shrink-0
          bg-[var(--bg-sidebar)] border-r border-[var(--border-main)]
          transition-all duration-250 ease-in-out
          ${collapsed ? 'w-[60px]' : 'w-56'}
        `}
      >
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="sticky top-0 z-[40] h-14 flex items-center px-5 lg:px-6 bg-[var(--bg-main)] border-b border-[var(--border-main)] flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden mr-3 p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
          >
            <Menu size={18} />
          </button>

          <button
            onClick={() => setCollapsed(c => !c)}
            className="hidden lg:flex mr-4 p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors duration-150"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--text-primary)]">
              {currentPage}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors duration-150"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-5 lg:px-8 py-8 custom-scrollbar">
          <div className="max-w-[1920px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;