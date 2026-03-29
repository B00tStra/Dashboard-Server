import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, RefreshCw, Pause, Play, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

const AgentLogs: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/agent-logs');
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setLogs([]);
      } else {
        setLogs(data.logs || []);
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch agent logs');
      console.error('Log fetch error:', err);
    }
  };

  useEffect(() => {
    fetchLogs();
    if (isAutoRefresh) {
      const interval = setInterval(fetchLogs, 3000); // Refresh every 3 seconds
      return () => clearInterval(interval);
    }
  }, [isAutoRefresh]);

  useEffect(() => {
    if (isAtBottom && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isAtBottom]);

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const atBottom = scrollHeight - scrollTop - clientHeight < 50;
      setIsAtBottom(atBottom);
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertCircle size={14} className="text-red-400" />;
      case 'warning': return <AlertTriangle size={14} className="text-yellow-400" />;
      case 'success': return <CheckCircle size={14} className="text-green-400" />;
      default: return <Info size={14} className="text-blue-400" />;
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-300';
      case 'warning': return 'text-yellow-300';
      case 'success': return 'text-green-300';
      default: return 'text-slate-300';
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Terminal size={24} className="text-indigo-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Agent Logs</h1>
            <p className="text-sm text-slate-400">Live streaming logs from AI agents</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              isAutoRefresh
                ? 'bg-green-600/20 text-green-300 border border-green-500/30'
                : 'bg-slate-700/50 text-slate-400 border border-slate-600'
            }`}
          >
            {isAutoRefresh ? <Pause size={16} /> : <Play size={16} />}
            {isAutoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </button>
          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 font-medium text-sm transition-all"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Logs</p>
          <p className="text-2xl font-bold text-white">{logs.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Errors</p>
          <p className="text-2xl font-bold text-red-400">{logs.filter(l => l.type === 'error').length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Warnings</p>
          <p className="text-2xl font-bold text-yellow-400">{logs.filter(l => l.type === 'warning').length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Success</p>
          <p className="text-2xl font-bold text-green-400">{logs.filter(l => l.type === 'success').length}</p>
        </div>
      </div>

      {/* Terminal */}
      <div className="glass-card rounded-2xl overflow-hidden border border-white/10 relative">
        <div className="bg-slate-900/80 px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <span className="text-xs font-mono text-slate-400 ml-2">agent logs (OpenClaw removed)</span>
          </div>
          {isAutoRefresh && (
            <div className="flex items-center gap-2 text-xs text-green-400">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Live
            </div>
          )}
        </div>

        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="bg-black/40 p-4 font-mono text-xs overflow-y-auto h-[600px] leading-relaxed"
        >
          {error ? (
            <div className="flex items-center gap-2 text-yellow-400 p-4 bg-yellow-900/20 rounded-lg border border-yellow-500/30">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-500">
              <div className="text-center">
                <Terminal size={48} className="mx-auto mb-3 opacity-30" />
                <p>No logs available</p>
                <p className="text-xs mt-1">Waiting for agent activity...</p>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {logs.map((log, idx) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.02 }}
                  className="flex items-start gap-3 py-1.5 hover:bg-white/5 px-2 -mx-2 rounded transition-colors"
                >
                  <span className="text-slate-600 select-none flex-shrink-0">{log.timestamp}</span>
                  <span className="flex-shrink-0 mt-0.5">{getLogIcon(log.type)}</span>
                  <span className={`${getLogColor(log.type)} flex-1 break-all`}>{log.message}</span>
                </motion.div>
              ))}
              <div ref={logsEndRef} />
            </AnimatePresence>
          )}
        </div>

        {!isAtBottom && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => {
              setIsAtBottom(true);
              logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="absolute bottom-6 right-6 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium shadow-lg hover:bg-indigo-500 transition-colors"
          >
            ↓ Scroll to bottom
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default AgentLogs;
