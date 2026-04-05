import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import EarningsReports from './pages/EarningsReports';
import MarketAnalysis from './pages/MarketAnalysis';
import FearAndGreedPage from './pages/FearAndGreedPage';
import NewsFeed from './pages/NewsFeed';
import EarningsCalendar from './pages/EarningsCalendar';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/investment" element={<Layout><Portfolio /></Layout>} />
          <Route path="/markets" element={<Layout><MarketAnalysis /></Layout>} />
          <Route path="/news" element={<Layout><NewsFeed /></Layout>} />
          <Route path="/earnings" element={<Layout><EarningsReports /></Layout>} />
          <Route path="/earnings-calendar" element={<Layout><EarningsCalendar /></Layout>} />
          {/* Legacy redirects */}
          <Route path="/portfolio" element={<Layout><Portfolio /></Layout>} />
          <Route path="/analysis" element={<Layout><MarketAnalysis /></Layout>} />
          <Route path="/fear-and-greed" element={<Layout><FearAndGreedPage /></Layout>} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;