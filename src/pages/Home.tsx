import React, { useEffect, useRef, useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BarChart3, FileText, TrendingUp, Briefcase, ChevronRight } from 'lucide-react';

interface NavCard {
  title: string;
  subtitle: string;
  description: string;
  href: string;
  icon: React.ElementType;
  stats: { label: string; value: string }[];
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.2 + i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
};

const BASE_OPACITY = 0.2;
const FADED_OUT_OPACITY = 0;
const CROSSFADE_SECONDS = 0.8;

function NavCards() {
  const navigate = useNavigate();

  const cards: NavCard[] = [
    {
      title: 'Markt-Hub',
      subtitle: 'Strategisches Terminal',
      description: 'Erweiterte Echtzeit-Telemetrie und Watchlist-Analyse für Marktbewegungen.',
      href: '/dashboard',
      icon: BarChart3,
      stats: [
        { label: 'Vektoren', value: '6' },
        { label: 'Aktiv', value: '7' },
        { label: 'Signale', value: '14' },
      ],
    },
    {
      title: 'Finanz-Matrix',
      subtitle: 'Quartalsberichte',
      description: 'DCF-Bewertungen im Detail und institutionelle Analyse von Finanzberichten.',
      href: '/earnings',
      icon: FileText,
      stats: [
        { label: 'Berichte', value: '142' },
        { label: 'Beats', value: '61%' },
        { label: 'Ø Alpha', value: '+4.2%' },
      ],
    },
    {
      title: 'Sentiment-Matrix',
      subtitle: 'Fear & Greed Index',
      description: 'Marktstimmung und Clusteranalyse auf Basis laufender Telemetriedaten.',
      href: '/analysis',
      icon: TrendingUp,
      stats: [
        { label: 'Indikatoren', value: '89' },
        { label: 'Momentum', value: '54%' },
        { label: 'VIX-Level', value: '27' },
      ],
    },
    {
      title: 'Asset-Allokation',
      subtitle: 'Portfolio-Tracker',
      description: 'Präzise Verteilungs- und Performance-Attribution für dein Portfolio.',
      href: '/portfolio',
      icon: Briefcase,
      stats: [
        { label: 'Assets', value: '14' },
        { label: 'P&L 30T', value: '+12%' },
        { label: 'Sharpe', value: '+1.4%' },
      ],
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full px-6 lg:px-12">
      {cards.map((card, i) => (
        <motion.button
          key={card.href}
          custom={i}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ y: -5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate(card.href)}
          className="analytics-card p-6 flex flex-col text-left group border-[var(--border-main)] hover:border-[var(--accent-blue)] transition-all"
        >
          <div className="mb-6 p-3 rounded-lg bg-[var(--bg-sidebar)] w-fit border border-[var(--border-secondary)] group-hover:bg-[var(--accent-blue)] group-hover:text-white transition-all">
            <card.icon size={22} strokeWidth={1.5} />
          </div>
          <h3 className="text-sm font-black text-[var(--test-primary)] uppercase tracking-tight mb-1">{card.title}</h3>
          <p className="text-[10px] text-[var(--accent-blue)] font-black uppercase tracking-[0.2em] mb-4">{card.subtitle}</p>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-8 flex-1">{card.description}</p>
          
          <div className="flex items-center justify-between pt-4 border-t border-[var(--border-secondary)]">
            <div className="flex gap-4">
              {card.stats.slice(0, 2).map((s) => (
                <div key={s.label}>
                  <p className="text-xs font-black text-[var(--test-primary)] tabular-nums">{s.value}</p>
                  <p className="text-[9px] text-[var(--text-muted)] uppercase font-bold">{s.label}</p>
                </div>
              ))}
            </div>
            <ChevronRight size={14} className="text-[var(--text-muted)] group-hover:text-[var(--accent-blue)] group-hover:translate-x-1 transition-all" />
          </div>
        </motion.button>
      ))}
    </div>
  );
}

const Home: React.FC = () => {
  const videoRefA = useRef<HTMLVideoElement | null>(null);
  const videoRefB = useRef<HTMLVideoElement | null>(null);
  const [activeVideo, setActiveVideo] = useState<'A' | 'B'>('A');
  const transitioningRef = useRef(false);

  useEffect(() => {
    const videoA = videoRefA.current;
    const videoB = videoRefB.current;
    if (!videoA || !videoB) return;

    const handleTimeUpdate = (e: Event) => {
      const activeVideoEl = e.target as HTMLVideoElement;
      const currentActive = activeVideo === 'A' ? videoA : videoB;
      if (activeVideoEl !== currentActive) return;
      if (!activeVideoEl.duration || transitioningRef.current) return;

      const triggerTime = activeVideoEl.duration - CROSSFADE_SECONDS;
      if (activeVideoEl.currentTime >= triggerTime) {
        transitioningRef.current = true;
        const nextVideoEl = activeVideo === 'A' ? videoB : videoA;
        nextVideoEl.currentTime = 0;
        void nextVideoEl.play().catch(() => {});
        setActiveVideo(activeVideo === 'A' ? 'B' : 'A');
        setTimeout(() => { transitioningRef.current = false; }, CROSSFADE_SECONDS * 1000 + 100);
      }
    };

    videoA.addEventListener('timeupdate', handleTimeUpdate);
    videoB.addEventListener('timeupdate', handleTimeUpdate);
    void videoA.play().catch(() => {});

    return () => {
      videoA.removeEventListener('timeupdate', handleTimeUpdate);
      videoB.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [activeVideo]);

  return (
    <div className="relative w-full min-h-screen bg-[var(--bg-main)] overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.video
          ref={videoRefA} src="/background.mp4" muted playsInline preload="auto"
          animate={{ opacity: activeVideo === 'A' ? BASE_OPACITY : FADED_OUT_OPACITY }}
          transition={{ duration: CROSSFADE_SECONDS, ease: 'linear' }}
          className="absolute inset-0 w-full h-full object-cover mix-blend-screen"
        />
        <motion.video
          ref={videoRefB} src="/background.mp4" muted playsInline preload="auto"
          animate={{ opacity: activeVideo === 'B' ? BASE_OPACITY : FADED_OUT_OPACITY }}
          transition={{ duration: CROSSFADE_SECONDS, ease: 'linear' }}
          className="absolute inset-0 w-full h-full object-cover mix-blend-screen"
        />
      </div>

      <div className="fixed inset-0 bg-gradient-to-b from-[var(--bg-main)]/40 via-transparent to-[var(--bg-main)]/95 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center min-h-screen gap-24 pt-[20vh] pb-32">
        <motion.div
          className="text-center px-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-block px-4 py-1 border border-[var(--accent-blue)]/30 mb-8 bg-[var(--accent-blue)]/5 backdrop-blur-md rounded"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--accent-blue)]">Asset Tracker v2.0</p>
          </motion.div>
          <h1 className="text-6xl md:text-8xl font-black text-[var(--text-primary)] leading-tight tracking-tighter uppercase drop-shadow-2xl">
            Asset{' '}
            <span className="text-outline text-[var(--accent-blue)]">
              Tracker
            </span>
          </h1>
          <motion.p
            className="mt-8 text-[var(--text-muted)] text-sm md:text-base font-bold max-w-xl mx-auto uppercase tracking-widest leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Hochpräzise Analyseplattform für moderne Asset-Allokation.
          </motion.p>
          
          <motion.div
            className="mt-12 flex justify-center gap-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          >
            <div className="w-12 h-0.5 bg-[var(--accent-blue)]/20" />
            <div className="w-12 h-0.5 bg-[var(--accent-blue)]/20 shadow-[0_0_15px_var(--accent-blue)]" />
            <div className="w-12 h-0.5 bg-[var(--accent-blue)]/20" />
          </motion.div>
        </motion.div>

        <NavCards />
      </div>
      
      <div className="absolute bottom-12 left-12 flex items-center gap-8 z-10 opacity-30">
        <div className="flex flex-col">
          <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)]">Terminalstatus</span>
          <span className="text-[10px] font-black uppercase text-[var(--accent-green)]">Einsatzbereit</span>
        </div>
        <div className="flex flex-col border-l border-[var(--border-main)] pl-8">
          <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)]">Latenzmatrix</span>
          <span className="text-[10px] font-black uppercase text-[var(--text-primary)]">14ms / Cluster 04</span>
        </div>
      </div>
    </div>
  );
};

export default Home;