// Shared state: file paths, I/O helpers, default data, in-memory store
import fs from 'fs';
import path from 'path';

export const DATA_DIR = '/home/fabio/dashboard/data';
export const STOCK_NEWS_FILE  = path.join(DATA_DIR, 'stock-news.json');
export const MARKET_DATA_FILE = path.join(DATA_DIR, 'market-data.json');
export const WATCHLIST_FILE   = path.join(DATA_DIR, 'watchlist.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function loadJSON(filePath, defaultValue) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (err) {
    console.warn(`Failed to load ${filePath}:`, err.message);
  }
  return defaultValue;
}

export function saveJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Failed to save ${filePath}:`, err.message);
  }
}

// ── Default / fallback data ──────────────────────────────────────────────────

function generateChartData(basePrice, volatility, points) {
  let open = basePrice;
  const data = [];
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  for (let i = points; i > 0; i--) {
    const timeStr = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const change = (Math.random() - 0.5) * volatility;
    const bias   = (Math.random() - 0.3) * (volatility * 0.2);
    const close  = open + change + bias;
    const minOC  = Math.min(open, close);
    const maxOC  = Math.max(open, close);
    data.push({
      time:  timeStr,
      open:  parseFloat(open.toFixed(2)),
      high:  parseFloat((maxOC + Math.random() * (volatility * 0.5)).toFixed(2)),
      low:   parseFloat((minOC - Math.random() * (volatility * 0.5)).toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      price: parseFloat(close.toFixed(2)),
      day:   new Date(timeStr).toLocaleDateString('en-US', { weekday: 'short' }),
    });
    open = close;
  }
  return data;
}

const defaultWatchlist = [
  { ticker: 'NVDA', name: 'NVIDIA Corporation',     price: 875.20, change:  48.30, changePercent:  5.84, sparkline: [820,830,825,845,860,855,870,875] },
  { ticker: 'AMD',  name: 'Advanced Micro Devices', price: 162.45, change:  -3.10, changePercent: -1.87, sparkline: [170,168,165,167,164,163,165,162] },
  { ticker: 'NFLX', name: 'Netflix Inc.',           price: 893.70, change:  12.50, changePercent:  1.42, sparkline: [875,878,882,879,885,888,891,894] },
  { ticker: 'ANET', name: 'Arista Networks',        price: 388.90, change:  -5.20, changePercent: -1.32, sparkline: [398,396,394,391,393,390,389,389] },
  { ticker: 'CPRT', name: 'Copart Inc.',            price:  54.80, change:   0.95, changePercent:  1.76, sparkline: [52,53,53,54,53,54,55,55] },
  { ticker: 'NOW',  name: 'ServiceNow Inc.',        price: 888.50, change:  22.10, changePercent:  2.55, sparkline: [860,862,868,870,875,878,884,889] },
];

export const mockStats = [
  { label: 'Portfolio Value', value: '$124,530.00', change: '+2.4% today',    positive: true  },
  { label: 'Day P&L',        value: '+$2,918.42',  change: '+2.40%',          positive: true  },
  { label: 'Active Agents',  value: '7',            change: '2 running now',  positive: true  },
  { label: 'News Alerts',    value: '14',           change: '3 high priority', positive: false },
];

export const mockNews = [
  { id: '1', title: 'Apple Reports Strong Q4 Earnings', summary: 'Apple exceeded expectations with $119.4 billion in revenue.', timestamp: new Date(Date.now() - 1000*60*18).toISOString(), ticker: 'AAPL', sentiment: 'positive' },
  { id: '2', title: 'Tesla Faces Production Challenges',  summary: 'Tesla announces delays in Model Y production.',               timestamp: new Date(Date.now() - 1000*60*45).toISOString(), ticker: 'TSLA', sentiment: 'negative' },
];

export const mockAgentActivity = [
  { id: '1', timestamp: new Date(Date.now()-1000*30).toISOString(),     agent: 'SentimentBot', action: 'Scanning earnings call transcripts', ticker: 'AAPL', status: 'running' },
  { id: '2', timestamp: new Date(Date.now()-1000*60*2).toISOString(),   agent: 'NewsParser',   action: 'Ingested 14 new articles',            ticker: 'NVDA', status: 'done'    },
];

const defaultStockNews = [
  { ticker: 'NVDA', name: 'NVIDIA Corporation', sentiment: 'bullish', news_summary: '⏳ Awaiting AI analysis...', analysis: '🤖 AI-powered analysis pending.', last_updated: null, chart_1w: generateChartData(875,15,7), chart_1m: generateChartData(820,25,30), priceHistory: generateChartData(875,15,7).map(d=>({price:d.price})), bullish:80, bearish:5, neutral:15, score:75, trend:'up',   signals:['AI leadership','Data center demand','Strong guidance'] },
  { ticker: 'AMD',  name: 'Advanced Micro Devices', sentiment: 'bullish', news_summary: '⏳ Awaiting AI analysis...', analysis: '🤖 AI-powered analysis pending.', last_updated: null, chart_1w: generateChartData(162,5,7),  chart_1m: generateChartData(145,10,30), priceHistory: generateChartData(162,5,7).map(d=>({price:d.price})), bullish:65, bearish:15, neutral:20, score:50, trend:'up',   signals:['MI300 ramp strong','Market share gains','AI chip demand'] },
  { ticker: 'NFLX', name: 'Netflix Inc.',        sentiment: 'bullish', news_summary: '⏳ Awaiting AI analysis...', analysis: '🤖 AI-powered analysis pending.', last_updated: null, chart_1w: generateChartData(880,6,7),  chart_1m: generateChartData(820,12,30), priceHistory: generateChartData(880,6,7).map(d=>({price:d.price})), bullish:70, bearish:10, neutral:20, score:60, trend:'up',   signals:['Subscriber growth accelerating','Content strategy','Strong momentum'] },
  { ticker: 'ANET', name: 'Arista Networks',    sentiment: 'neutral', news_summary: '⏳ Awaiting AI analysis...', analysis: '🤖 AI-powered analysis pending.', last_updated: null, chart_1w: generateChartData(390,4,7),  chart_1m: generateChartData(370,7,30),  priceHistory: generateChartData(390,4,7).map(d=>({price:d.price})), bullish:50, bearish:25, neutral:25, score:10, trend:'flat', signals:['Steady revenue growth','Competition intensifying','Market share stable'] },
  { ticker: 'CPRT', name: 'Copart Inc.',        sentiment: 'neutral', news_summary: '⏳ Awaiting AI analysis...', analysis: '🤖 AI-powered analysis pending.', last_updated: null, chart_1w: generateChartData(53,1.5,7), chart_1m: generateChartData(50,2,30),   priceHistory: generateChartData(53,1.5,7).map(d=>({price:d.price})), bullish:40, bearish:35, neutral:25, score:-5, trend:'down', signals:['Used car market cooling','Inventory challenges','Margin pressure'] },
  { ticker: 'NOW',  name: 'ServiceNow Inc.',    sentiment: 'bullish', news_summary: '⏳ Awaiting AI analysis...', analysis: '🤖 AI-powered analysis pending.', last_updated: null, chart_1w: generateChartData(860,8,7),  chart_1m: generateChartData(810,14,30), priceHistory: generateChartData(860,8,7).map(d=>({price:d.price})), bullish:75, bearish:10, neutral:15, score:65, trend:'up',   signals:['AI platform gaining traction','Enterprise demand strong','Excellent guidance'] },
];

const defaultMarketData = {
  stocks: {
    fearAndGreed: { current:20, yesterday:22, lastWeek:45, lastMonth:68, lastYear:54, status:'Extreme Fear', indicators:[
      { name:'Market Momentum',      status:'Extreme Fear', value:'S&P 500 is below 125-day MA' },
      { name:'Stock Price Strength', status:'Fear',         value:'Net 52-week lows outpace highs' },
      { name:'Put and Call Options', status:'Fear',         value:'Put/Call ratio at 1.08' },
      { name:'Market Volatility',    status:'Extreme Fear', value:'VIX is 32.4 (above 50-day MA)' },
      { name:'Safe Haven Demand',    status:'Extreme Fear', value:'Bonds outperforming stocks by 4%' },
      { name:'Junk Bond Demand',     status:'Extreme Fear', value:'Spread is widening significantly' },
    ]},
    macro: [
      { label:'Fed Target Rate', value:'5.25 - 5.50%', prev:'5.25 - 5.50%', status:'neutral', history:[{v:5},{v:5.25},{v:5.25},{v:5.5},{v:5.5}] },
      { label:'CPI (YoY)',       value:'3.1%',          prev:'3.2%',          status:'good',    history:[{v:3.7},{v:3.2},{v:3.1},{v:3.4},{v:3.2},{v:3.1}] },
      { label:'Market Outlook',  value:'Extreme Fear',  prev:'Cautious',      status:'bad',     history:[{v:80},{v:75},{v:70},{v:65},{v:20}] },
    ],
  },
  crypto: {
    fearAndGreed: { current:28, yesterday:35, lastWeek:62, lastMonth:78, status:'Fear', indicators:[
      { name:'Volatility',      status:'Extreme Fear', value:'High volatility in BTC/ETH' },
      { name:'Market Momentum', status:'Fear',         value:'Bearish crossovers' },
      { name:'Social Media',    status:'Neutral',      value:'Negative sentiment rising' },
      { name:'Dominance',       status:'Greed',        value:'BTC dominance at 52.4%' },
      { name:'Google Trends',   status:'Fear',         value:'Declining search volume' },
    ]},
    macro: [
      { label:'BTC Dominance',    value:'52.4%',  prev:'51.8%', status:'hot',  history:[{v:50},{v:51},{v:51.5},{v:51.2},{v:52},{v:52.4}] },
      { label:'Total Market Cap', value:'$2.64T', prev:'$2.51T', status:'good', history:[{v:2.1},{v:2.3},{v:2.4},{v:2.2},{v:2.5},{v:2.64}] },
    ],
  },
};

// ── In-memory state (mutated by routes & poller) ─────────────────────────────
export let mockWatchlist  = loadJSON(WATCHLIST_FILE,   defaultWatchlist);
export let mockStockNews  = loadJSON(STOCK_NEWS_FILE,  defaultStockNews);
export let mockMarketData = loadJSON(MARKET_DATA_FILE, defaultMarketData);

export let marketDebate = {
  last_updated: new Date().toISOString(),
  entries: [
    { analyst:'Bull',       sentiment:'bullish', content:'Der Markt zeigt starke Unterstützung auf den aktuellen Niveaus. Der KI-Rückenwind befindet sich noch in der Frühphase, und die Unternehmensgewinne bleiben robust.' },
    { analyst:'Bear',       sentiment:'bearish', content:'Die Bewertungen sind auf historische Extreme gedehnt. Die Inflation bleibt hartnäckig, was die Fed dazu zwingen könnte, die Zinsen länger hoch zu halten.' },
    { analyst:'Macro',      sentiment:'neutral', content:'Die globalen PMIs stabilisieren sich. Geopolitische Spannungen und bevorstehende Wahlen sorgen für Unsicherheit. Diversifikation ist der Schlüssel.' },
    { analyst:'Technician', sentiment:'bullish', content:'Die Indizes handeln über ihren 50- und 200-Tage-Linien. Der RSI befindet sich nicht im überkauften Bereich. Der Weg des geringsten Widerstands führt nach oben.' },
  ],
};

// Setters used by routes/poller to update shared state
export function setMockMarketData(data) { mockMarketData = data; }
export function setMarketDebate(data)   { marketDebate   = data; }

console.log(`Loaded ${mockWatchlist.length} watchlist items`);
console.log(`Loaded ${mockStockNews.length} stock news items`);
