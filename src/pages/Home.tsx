import React, { useEffect, useRef, useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { BarChart3, FileText, TrendingUp, Settings as SettingsIcon } from 'lucide-react';

interface NavCard {
  title: string;
  subtitle: string;
  description: string;
  href: string;
  gradient: string;
  border: string;
  glow: string;
  icon: React.ElementType;
  iconColor: string;
  stats: { label: string; value: string }[];
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40, rotateX: -15 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { delay: 0.4 + i * 0.15, duration: 0.8, ease: 'easeOut' },
  }),
};

const LOOP_SECONDS = 4;
const CROSSFADE_SECONDS = 0.8;
const BASE_OPACITY = 0.3;
const FADED_OUT_OPACITY = 0;

function NavCards() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const cards: NavCard[] = [
    {
      title: t('card_dashboard_title'),
      subtitle: t('card_dashboard_subtitle'),
      description: t('card_dashboard_desc'),
      href: '/dashboard',
      gradient: 'from-indigo-500/10 to-transparent',
      border: 'border-white/10 hover:border-indigo-500/40',
      glow: 'hover:shadow-indigo-500/20',
      icon: BarChart3,
      iconColor: 'text-indigo-400',
      stats: [
        { label: t('card_dashboard_stat1'), value: '6' },
        { label: t('card_dashboard_stat2'), value: '7' },
        { label: t('card_dashboard_stat3'), value: '14' },
      ],
    },
    {
      title: t('card_earnings_title'),
      subtitle: t('card_earnings_subtitle'),
      description: t('card_earnings_desc'),
      href: '/earnings',
      gradient: 'from-cyan-500/10 to-transparent',
      border: 'border-white/10 hover:border-cyan-500/40',
      glow: 'hover:shadow-cyan-500/20',
      icon: FileText,
      iconColor: 'text-cyan-400',
      stats: [
        { label: t('card_earnings_stat1'), value: '142' },
        { label: t('card_earnings_stat2'), value: '61%' },
        { label: t('card_earnings_stat3'), value: '+4.2%' },
      ],
    },
    {
      title: t('card_analysis_title'),
      subtitle: t('card_analysis_subtitle'),
      description: t('card_analysis_desc'),
      href: '/analysis',
      gradient: 'from-emerald-500/10 to-transparent',
      border: 'border-white/10 hover:border-emerald-500/40',
      glow: 'hover:shadow-emerald-500/20',
      icon: TrendingUp,
      iconColor: 'text-emerald-400',
      stats: [
        { label: t('card_analysis_stat1'), value: '89' },
        { label: t('card_analysis_stat2'), value: '54%' },
        { label: t('card_analysis_stat3'), value: '27' },
      ],
    },
    {
      title: t('card_settings_title'),
      subtitle: t('card_settings_subtitle'),
      description: t('card_settings_desc'),
      href: '/settings',
      gradient: 'from-slate-400/10 to-transparent',
      border: 'border-white/10 hover:border-slate-400/40',
      glow: 'hover:shadow-slate-500/20',
      icon: SettingsIcon,
      iconColor: 'text-slate-400',
      stats: [
        { label: t('card_settings_stat1'), value: '8' },
        { label: t('card_settings_stat2'), value: '12' },
        { label: t('card_settings_stat3'), value: '7' },
      ],
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full max-w-5xl px-6" style={{ perspective: '1200px' }}>
      {cards.map((card, i) => (
        <motion.button
          key={card.href}
          custom={i}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ scale: 1.02, y: -3 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate(card.href)}
          className={`
            relative overflow-hidden text-left rounded-3xl p-7 flex flex-col cursor-pointer
            bg-black/40 backdrop-blur-xl bg-gradient-to-br ${card.gradient}
            border border-solid ${card.border} ${card.glow}
            transition-all duration-500 hover:shadow-2xl hover:bg-black/60
          `}
        >
          <div className={`relative z-10 mb-5 ${card.iconColor} drop-shadow-lg`}>
            <card.icon size={36} strokeWidth={1.5} />
          </div>
          <h3 className="relative z-10 font-display text-2xl font-bold text-white mb-1 tracking-tight">{card.title}</h3>
          <p className="relative z-10 text-xs text-slate-400 font-semibold tracking-wide uppercase mb-4">{card.subtitle}</p>
          <p className="relative z-10 text-sm text-slate-300 leading-relaxed mb-6 flex-1">{card.description}</p>
          <div className="relative z-10 flex gap-5 border-t border-white/10 pt-5 mt-auto">
            {card.stats.map((s) => (
              <div key={s.label}>
                <p className="font-display text-xl font-bold text-white drop-shadow-md">{s.value}</p>
                <p className="text-xs text-slate-400 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.button>
      ))}
    </div>
  );
}

const Home: React.FC = () => {
  const { lang, setLang, t } = useLanguage();
  
  const videoRefA = useRef<HTMLVideoElement | null>(null);
  const videoRefB = useRef<HTMLVideoElement | null>(null);
  const [activeVideo, setActiveVideo] = useState<'A' | 'B'>('A');
  const [isLooping, setIsLooping] = useState(false);
  const transitioningRef = useRef(false);

  useEffect(() => {
    const videoA = videoRefA.current;
    const videoB = videoRefB.current;
    if (!videoA || !videoB) return;

    const handleTimeUpdate = (e: Event) => {
      const activeVideoEl = e.target as HTMLVideoElement;
      const currentActive = activeVideo === 'A' ? videoA : videoB;
      
      // Only the video that is currently "active" (visible) should trigger the next loop
      if (activeVideoEl !== currentActive) return;
      if (!activeVideoEl.duration || transitioningRef.current) return;

      const loopStart = Math.max(0, activeVideoEl.duration - LOOP_SECONDS);
      // Determine if we should start the crossfade
      const triggerTime = activeVideoEl.duration - CROSSFADE_SECONDS;

      if (activeVideoEl.currentTime >= triggerTime) {
        transitioningRef.current = true;
        
        const nextVideoEl = activeVideo === 'A' ? videoB : videoA;
        
        // Prepare next video at loopStart or 0 depending on if we are already in loop mode
        nextVideoEl.currentTime = isLooping ? loopStart : loopStart; // In this design, we always jump to loopStart for the next video
        void nextVideoEl.play().catch(() => {});
        
        setActiveVideo(activeVideo === 'A' ? 'B' : 'A');
        setIsLooping(true);

        // Reset transition flag after some time to allow the new active video to take over handleTimeUpdate
        setTimeout(() => {
          transitioningRef.current = false;
        }, CROSSFADE_SECONDS * 1000 + 100);
      }
    };

    videoA.addEventListener('timeupdate', handleTimeUpdate);
    videoB.addEventListener('timeupdate', handleTimeUpdate);

    // Initial play
    void videoA.play().catch(() => {});

    return () => {
      videoA.removeEventListener('timeupdate', handleTimeUpdate);
      videoB.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [activeVideo, isLooping]);

  return (
    <div className="relative w-full min-h-screen bg-gray-900 overflow-x-hidden" style={{ backgroundColor: '#030712' }}>
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.video
          ref={videoRefA}
          src="/background.mp4"
          muted
          playsInline
          preload="auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: activeVideo === 'A' ? BASE_OPACITY : FADED_OUT_OPACITY }}
          transition={{ duration: CROSSFADE_SECONDS, ease: "linear" }}
          className="absolute inset-0 w-full h-full object-cover mix-blend-screen"
        />
        <motion.video
          ref={videoRefB}
          src="/background.mp4"
          muted
          playsInline
          preload="auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: activeVideo === 'B' ? BASE_OPACITY : FADED_OUT_OPACITY }}
          transition={{ duration: CROSSFADE_SECONDS, ease: "linear" }}
          className="absolute inset-0 w-full h-full object-cover mix-blend-screen"
        />
      </div>

      <div className="fixed inset-0 bg-gradient-to-b from-gray-950/20 via-transparent to-gray-950/90 pointer-events-none" />

      <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
        {(['de', 'en'] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase transition-all duration-200 ${
              lang === l ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center min-h-screen gap-16 pt-[22vh] pb-24">
        <motion.div
          className="text-center px-6"
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            className="inline-block px-4 py-1.5 rounded-full glass border outline-none border-indigo-500/30 mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">{t('home_badge')}</p>
          </motion.div>
          <h1 className="font-display text-6xl md:text-8xl font-black text-white leading-tight tracking-tighter drop-shadow-2xl">
            AI{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent text-glow-accent">
              Hub
            </span>
          </h1>
          <motion.p
            className="mt-6 text-slate-300 text-lg md:text-xl font-medium max-w-2xl mx-auto drop-shadow-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            {t('home_tagline')}
          </motion.p>
        </motion.div>

        <NavCards />
      </div>
    </div>
  );
};

export default Home;
