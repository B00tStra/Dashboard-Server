import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import EarningsReports from './pages/EarningsReports';
import MarketAnalysis from './pages/MarketAnalysis';
import AgentLogs from './pages/AgentLogs';
import Settings from './pages/Settings';

function App() {
  return (
    <LanguageProvider>
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/earnings" element={<Layout><EarningsReports /></Layout>} />
        <Route path="/analysis" element={<Layout><MarketAnalysis /></Layout>} />
        <Route path="/logs" element={<Layout><AgentLogs /></Layout>} />
        <Route path="/settings" element={<Layout><Settings /></Layout>} />
      </Routes>
    </Router>
    </LanguageProvider>
  );
}

export default App;