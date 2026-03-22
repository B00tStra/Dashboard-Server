import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars } from '@react-three/drei';
import * as THREE from 'three';
import {
  BarChart3, FileText, TrendingUp, Settings,
  Home, ChevronLeft, ChevronRight, Menu, X,
} from 'lucide-react';
import { useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';

const mainNavDef = [
  { key: 'nav_home',      href: '/',          icon: Home },
  { key: 'nav_dashboard', href: '/dashboard', icon: BarChart3 },
  { key: 'nav_earnings',  href: '/earnings',  icon: FileText },
  { key: 'nav_analysis',  href: '/analysis',  icon: TrendingUp },
];

const bottomNavDef = [
  { key: 'nav_settings', href: '/settings', icon: Settings },
];

const AIBrain = () => {
  const meshRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.15;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.25;
    }
  });
  return (
    <Float speed={2.5} rotationIntensity={0.5} floatIntensity={1.5}>
      <group ref={meshRef}>
        <mesh>
          <icosahedronGeometry args={[1.2, 0]} />
          <meshStandardMaterial color="#818cf8" wireframe emissive="#4f46e5" emissiveIntensity={0.6} transparent opacity={0.6} />
        </mesh>
        <mesh scale={0.6}>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={1} />
        </mesh>
      </group>
    </Float>
  );
};

const AnimatedStars = () => {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y -= delta * 0.02;
      ref.current.rotation.x -= delta * 0.01;
    }
  });
  return (
    <group ref={ref}>
      <Stars radius={100} depth={50} count={3500} factor={4} saturation={0} fade speed={1} />
    </group>
  );
};

const AILogo3D = ({ collapsed = false }: { collapsed?: boolean }) => (
  <div className={`${collapsed ? 'w-9 h-9' : 'w-12 h-12'} flex-shrink-0 pointer-events-none transition-all duration-300`}>
    <Canvas camera={{ position: [0, 0, 3.2], fov: 50 }}>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#c084fc" />
      <pointLight position={[-10, -10, -5]} intensity={0.5} color="#38bdf8" />
      <AIBrain />
    </Canvas>
  </div>
);

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { lang, setLang, t } = useLanguage();

  // Close mobile drawer on navigation
  React.useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Desktop: w-56 expanded / w-16 collapsed
  const desktopW = collapsed ? 'w-16' : 'w-56';

  const mainNav = mainNavDef.map(n => ({ ...n, name: t(n.key) }));
  const bottomNav = bottomNavDef.map(n => ({ ...n, name: t(n.key) }));

  const allNav = [...mainNav, ...bottomNav];
  const currentPage = allNav.find(n => n.href === location.pathname)?.name ?? 'Dashboard';

  const NavItem = ({ item }: { item: typeof mainNav[0] }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.href;
    return (
      <Link
        to={item.href}
        title={collapsed ? item.name : undefined}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
          isActive
            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 shadow-sm'
            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
        }`}
      >
        <Icon size={18} className="flex-shrink-0" />
        {/* Always show label in mobile drawer; hide when desktop-collapsed */}
        <span className={`text-sm font-medium truncate lg:hidden`}>{item.name}</span>
        <span className={`text-sm font-medium truncate hidden lg:block ${collapsed ? 'lg:hidden' : ''}`}>{item.name}</span>
        {!collapsed && isActive && (
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 hidden lg:block" />
        )}
      </Link>
    );
  };

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {/* Logo */}
      <div className="flex items-center h-16 px-3 border-b border-white/10 flex-shrink-0 relative">
        <div className={`flex-1 flex items-center ${collapsed && !mobile ? 'justify-start' : 'gap-2 pl-1'}`}>
          <AILogo3D collapsed={collapsed && !mobile} />
          {(!collapsed || mobile) && (
            <h1 className="text-xl font-display font-black tracking-tight text-white drop-shadow-md">
              AI <span className="text-indigo-400">Hub</span>
            </h1>
          )}
        </div>
        {/* Mobile close */}
        {mobile && (
          <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        )}
        {/* Desktop collapse toggle */}
        {!mobile && (
          <button
            onClick={() => setCollapsed(c => !c)}
            className="absolute -right-3.5 top-5 bg-indigo-600 border border-indigo-400/50 p-1.5 rounded-full hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all z-50"
          >
            {collapsed ? <ChevronRight size={16} strokeWidth={3} /> : <ChevronLeft size={16} strokeWidth={3} />}
          </button>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {mainNav.map(item => <NavItem key={item.href} item={item} />)}
      </nav>

      {/* Settings at bottom */}
      <div className="px-2 pb-3 pt-2 border-t border-white/10 space-y-0.5">
        {bottomNav.map(item => <NavItem key={item.href} item={item} />)}
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-slate-950">

      {/* 3D background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <Canvas camera={{ position: [0, 0, 1] }}>
          <AnimatedStars />
        </Canvas>
      </div>

      {/* ── Mobile overlay backdrop ─────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer ──────────────────────────────────────────────────── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 flex flex-col glass-panel border-r border-white/10
        transition-transform duration-300 lg:hidden
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <SidebarContent mobile />
      </aside>

      {/* ── Desktop sidebar ────────────────────────────────────────────────── */}
      <aside className={`
        hidden lg:flex flex-col relative z-50
        ${desktopW} glass-panel border-r border-white/10 transition-all duration-300
      `}>
        <SidebarContent />
      </aside>

      {/* ── Main area ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col relative z-10 min-w-0">

        {/* Top bar */}
        <header className="sticky top-0 z-20 h-16 flex items-center px-4 lg:px-8 glass-panel border-b border-white/10 backdrop-blur-xl flex-shrink-0 bg-slate-900/40">
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden mr-3 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Menu size={20} />
          </button>
          <h2 className="text-lg font-display font-bold text-white tracking-wide">{currentPage}</h2>
          <div className="ml-auto flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
            {(['de', 'en'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase transition-all duration-200 ${
                  lang === l
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
