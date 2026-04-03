import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import EarningsReports from './pages/EarningsReports';
import MarketAnalysis from './pages/MarketAnalysis';
import FearAndGreedPage from './pages/FearAndGreedPage';
import Settings from './pages/Settings';
import TokenUsage from './pages/TokenUsage';
import Portfolio from './pages/Portfolio';

function App() {
  return (
    <LanguageProvider>
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/portfolio" element={<Layout><Portfolio /></Layout>} />
        <Route path="/earnings" element={<Layout><EarningsReports /></Layout>} />
        <Route path="/analysis" element={<Layout><MarketAnalysis /></Layout>} />
        <Route path="/fear-and-greed" element={<Layout><FearAndGreedPage /></Layout>} />
        <Route path="/token-usage" element={<Layout><TokenUsage /></Layout>} />
        <Route path="/settings" element={<Layout><Settings /></Layout>} />
      </Routes>
    </Router>
    </LanguageProvider>
  );
}

export default App;