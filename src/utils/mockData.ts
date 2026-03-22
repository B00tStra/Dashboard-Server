// Mock data for the dashboard

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  timestamp: Date;
  ticker: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface WatchlistItem {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  sparkline: number[];
}

export interface EarningsReport {
  ticker: string;
  company: string;
  date: Date;
  expectedEPS: number;
  actualEPS: number;
  beat: boolean;
  surprise: number;
}

export interface SentimentData {
  ticker: string;
  bullish: number;
  bearish: number;
  neutral: number;
}

export interface AgentActivity {
  id: string;
  timestamp: Date;
  agent: string;
  action: string;
  ticker: string;
  status: 'running' | 'done' | 'error';
}

export interface AgentLog {
  id: string;
  timestamp: Date;
  message: string;
  type: 'info' | 'warning' | 'error';
}

export interface StatCard {
  label: string;
  value: string;
  change: string;
  positive: boolean;
}

// Mock stats
export const mockStats: StatCard[] = [
  { label: 'Portfolio Value', value: '$124,530.00', change: '+2.4% today', positive: true },
  { label: 'Day P&L', value: '+$2,918.42', change: '+2.40%', positive: true },
  { label: 'Active Agents', value: '7', change: '2 running now', positive: true },
  { label: 'News Alerts', value: '14', change: '3 high priority', positive: false },
];

// Mock news feed
export const mockNews: NewsItem[] = [
  {
    id: '1',
    title: 'Apple Reports Strong Q4 Earnings',
    summary: 'Apple exceeded expectations with $119.4 billion in revenue.',
    timestamp: new Date(Date.now() - 1000 * 60 * 18),
    ticker: 'AAPL',
    sentiment: 'positive',
  },
  {
    id: '2',
    title: 'Tesla Faces Production Challenges',
    summary: 'Tesla announces delays in Model Y production due to supply chain issues.',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    ticker: 'TSLA',
    sentiment: 'negative',
  },
  {
    id: '3',
    title: 'NVIDIA Surges on AI Chip Demand',
    summary: 'NVIDIA shares up 6% after analysts raise price targets citing data center growth.',
    timestamp: new Date(Date.now() - 1000 * 60 * 72),
    ticker: 'NVDA',
    sentiment: 'positive',
  },
  {
    id: '4',
    title: 'Microsoft Azure Growth Slows Slightly',
    summary: 'Microsoft cloud segment grew 28% YoY, slightly below the 29% analyst consensus.',
    timestamp: new Date(Date.now() - 1000 * 60 * 110),
    ticker: 'MSFT',
    sentiment: 'neutral',
  },
  {
    id: '5',
    title: 'Amazon AWS Beats Revenue Estimates',
    summary: 'AWS revenue hit $25.0B, topping the $24.2B estimate on strong enterprise adoption.',
    timestamp: new Date(Date.now() - 1000 * 60 * 150),
    ticker: 'AMZN',
    sentiment: 'positive',
  },
  {
    id: '6',
    title: 'Meta Ad Revenue Misses Q3 Forecast',
    summary: 'Meta advertising revenue came in at $33.6B vs the $34.1B estimate.',
    timestamp: new Date(Date.now() - 1000 * 60 * 200),
    ticker: 'META',
    sentiment: 'negative',
  },
];

// Mock watchlist
export const mockWatchlist: WatchlistItem[] = [
  {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    price: 175.43,
    change: 2.15,
    changePercent: 1.24,
    sparkline: [170, 171, 169, 172, 174, 173, 176, 175],
  },
  {
    ticker: 'NVDA',
    name: 'NVIDIA Corp.',
    price: 875.20,
    change: 48.30,
    changePercent: 5.84,
    sparkline: [820, 830, 825, 845, 860, 855, 870, 875],
  },
  {
    ticker: 'MSFT',
    name: 'Microsoft Corp.',
    price: 415.80,
    change: 3.60,
    changePercent: 0.87,
    sparkline: [410, 411, 413, 412, 414, 413, 415, 416],
  },
  {
    ticker: 'TSLA',
    name: 'Tesla Inc.',
    price: 248.50,
    change: -5.20,
    changePercent: -2.05,
    sparkline: [260, 258, 255, 252, 250, 249, 247, 248],
  },
  {
    ticker: 'AMZN',
    name: 'Amazon.com Inc.',
    price: 185.10,
    change: 1.90,
    changePercent: 1.04,
    sparkline: [181, 182, 183, 182, 184, 184, 185, 185],
  },
  {
    ticker: 'META',
    name: 'Meta Platforms',
    price: 492.30,
    change: -8.70,
    changePercent: -1.74,
    sparkline: [505, 502, 500, 498, 496, 494, 493, 492],
  },
  {
    ticker: 'GOOGL',
    name: 'Alphabet Inc.',
    price: 163.45,
    change: 0.85,
    changePercent: 0.52,
    sparkline: [161, 162, 162, 163, 163, 163, 163, 163],
  },
];

// Mock agent activity
export const mockAgentActivity: AgentActivity[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 1000 * 30),
    agent: 'SentimentBot',
    action: 'Scanning earnings call transcripts',
    ticker: 'AAPL',
    status: 'running',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 1000 * 60 * 2),
    agent: 'NewsParser',
    action: 'Ingested 14 new articles',
    ticker: 'NVDA',
    status: 'done',
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    agent: 'EarningsAgent',
    action: 'Beat/miss detection complete',
    ticker: 'MSFT',
    status: 'done',
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 1000 * 60 * 7),
    agent: 'RiskAgent',
    action: 'Volatility threshold breached',
    ticker: 'TSLA',
    status: 'error',
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 1000 * 60 * 10),
    agent: 'PriceBot',
    action: 'Updating price targets',
    ticker: 'META',
    status: 'running',
  },
  {
    id: '6',
    timestamp: new Date(Date.now() - 1000 * 60 * 14),
    agent: 'NewsParser',
    action: 'Processed 8 SEC filings',
    ticker: 'AMZN',
    status: 'done',
  },
];

// Mock earnings reports
export const mockEarnings: EarningsReport[] = [
  {
    ticker: 'AAPL',
    company: 'Apple Inc.',
    date: new Date('2024-01-25'),
    expectedEPS: 2.10,
    actualEPS: 2.18,
    beat: true,
    surprise: 0.08,
  },
  {
    ticker: 'TSLA',
    company: 'Tesla Inc.',
    date: new Date('2024-01-24'),
    expectedEPS: 0.85,
    actualEPS: 0.71,
    beat: false,
    surprise: -0.14,
  },
];

// Mock sentiment data
export const mockSentiment: SentimentData[] = [
  { ticker: 'AAPL', bullish: 65, bearish: 20, neutral: 15 },
  { ticker: 'TSLA', bullish: 40, bearish: 45, neutral: 15 },
];

// Mock agent logs
export const mockAgentLogs: AgentLog[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    message: 'Analyzing AAPL earnings report...',
    type: 'info',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 1000 * 60 * 10),
    message: 'Detected negative sentiment spike for TSLA',
    type: 'warning',
  },
];

export function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
