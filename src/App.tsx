import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import Layout from './components/Layout';
import ChatWidget from './components/ChatWidget';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import EarningsReports from './pages/EarningsReports';
import MarketAnalysis from './pages/MarketAnalysis';
import FearAndGreedPage from './pages/FearAndGreedPage';
import AgentLogs from './pages/AgentLogs';
import Settings from './pages/Settings';
import MarketDebate from './pages/MarketDebate';
import TokenUsage from './pages/TokenUsage';

function App() {
  return (
    <LanguageProvider>
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/earnings" element={<Layout><EarningsReports /></Layout>} />
        <Route path="/analysis" element={<Layout><MarketAnalysis /></Layout>} />
        <Route path="/fear-and-greed" element={<Layout><FearAndGreedPage /></Layout>} />
        <Route path="/logs" element={<Layout><AgentLogs /></Layout>} />
        <Route path="/debate" element={<Layout><MarketDebate /></Layout>} />
        <Route path="/token-usage" element={<Layout><TokenUsage /></Layout>} />
        <Route path="/settings" element={<Layout><Settings /></Layout>} />
      </Routes>
      <ChatWidget />
    </Router>
    </LanguageProvider>
  );
}

export default App;