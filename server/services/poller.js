// Market data poller — runs every 5 minutes, updates market-data.json
import { loadJSON, saveJSON, MARKET_DATA_FILE, setMockMarketData } from '../state.js';
import { fetchFearAndGreedStocks, fetchFearAndGreedCrypto } from './fearAndGreed.js';
import { fetchCryptoMarketData, fetchEthGas } from './crypto.js';
import { fetchFREDMacroData } from './fred.js';

async function updateMarketDataFromAPIs() {
  console.log('[Poller] Fetching live data from APIs...');

  const [stocksFG, cryptoFG, cryptoData, ethGas, fredData] = await Promise.all([
    fetchFearAndGreedStocks(),
    fetchFearAndGreedCrypto(),
    fetchCryptoMarketData(),
    fetchEthGas(),
    fetchFREDMacroData(),
  ]);

  const existing = loadJSON(MARKET_DATA_FILE, {
    stocks: { fearAndGreed: {}, macro: [] },
    crypto: { fearAndGreed: {}, macro: [] },
  });

  if (stocksFG !== null) {
    existing.stocks.fearAndGreed = {
      current:   stocksFG,
      yesterday: existing.stocks.fearAndGreed?.yesterday || stocksFG,
      lastWeek:  existing.stocks.fearAndGreed?.lastWeek  || stocksFG,
      lastMonth: existing.stocks.fearAndGreed?.lastMonth || stocksFG,
      lastYear:  existing.stocks.fearAndGreed?.lastYear,
      status:    stocksFG<=25?'Extreme Fear':stocksFG<=45?'Fear':stocksFG<=55?'Neutral':stocksFG<=75?'Greed':'Extreme Greed',
      indicators: existing.stocks.fearAndGreed?.indicators || [
        { name:'Market Momentum',      status:'Fear', value:'S&P 500 below 125-day MA' },
        { name:'Stock Price Strength', status:'Fear', value:'52-week lows outpacing highs' },
        { name:'Put and Call Options', status:'Fear', value:'Put/Call ratio elevated' },
        { name:'Market Volatility',    status:'Fear', value:'VIX elevated' },
      ],
    };
  }

  if (cryptoFG) {
    existing.crypto.fearAndGreed = {
      current:   cryptoFG.current,
      yesterday: cryptoFG.yesterday,
      lastWeek:  cryptoFG.lastWeek,
      lastMonth: existing.crypto.fearAndGreed?.lastMonth || cryptoFG.current,
      status:    cryptoFG.status,
      indicators: existing.crypto.fearAndGreed?.indicators || [
        { name:'Volatility',      status:'Fear', value:'High volatility' },
        { name:'Market Momentum', status:'Fear', value:'Bearish crossovers' },
        { name:'Social Media',    status:'Fear', value:'Negative sentiment' },
      ],
    };
  }

  if (cryptoData) {
    const prevBTC = existing.crypto.macro?.find(m=>m.label==='BTC Dominance')?.value || '56.0%';
    const prevCap = existing.crypto.macro?.find(m=>m.label==='Total Market Cap')?.value || '$2.40T';
    existing.crypto.macro = [
      { label:'BTC Dominance',    value:`${cryptoData.btcDominance}%`,    prev:prevBTC, status: parseFloat(cryptoData.btcDominance)>parseFloat(prevBTC)?'hot':'good' },
      { label:'Total Market Cap', value:`$${cryptoData.totalMarketCap}T`, prev:prevCap, status: parseFloat(cryptoData.totalMarketCap)>parseFloat(prevCap.replace(/[$T]/g,''))?'good':'neutral' },
      existing.crypto.macro?.find(m=>m.label==='ETH Gas (Gwei)') || { label:'ETH Gas (Gwei)', value: ethGas?String(ethGas):'12', prev:'15', status:'good' },
    ];
    if (ethGas !== null) {
      existing.crypto.macro[2] = { label:'ETH Gas (Gwei)', value:String(ethGas), prev:existing.crypto.macro[2]?.value||'15', status:ethGas<20?'good':'hot' };
    }
  }

  if (fredData) {
    const prevFed  = existing.stocks.macro?.find(m=>m.label==='Fed Target Rate')?.value || `${fredData.fedFunds.prev}%`;
    const prevCpi  = existing.stocks.macro?.find(m=>m.label==='CPI (YoY)')?.value       || `${fredData.cpi.prev}%`;
    const prevUnemp= existing.stocks.macro?.find(m=>m.label==='Unemployment')?.value    || `${fredData.unemployment.prev}%`;
    existing.stocks.macro = [
      { label:'Fed Target Rate', value:`${fredData.fedFunds.current}%`,    prev:prevFed,   status: fredData.fedFunds.current>fredData.fedFunds.prev?'bad':fredData.fedFunds.current<fredData.fedFunds.prev?'good':'neutral', history:fredData.fedFunds.history },
      { label:'CPI (YoY)',       value:`${fredData.cpi.current}%`,          prev:prevCpi,   status: fredData.cpi.current<2.5?'good':fredData.cpi.current<3.5?'neutral':'bad', history:fredData.cpi.history },
      { label:'Unemployment',    value:`${fredData.unemployment.current}%`, prev:prevUnemp, status: fredData.unemployment.current<4.5?'good':fredData.unemployment.current<6?'neutral':'bad', history:fredData.unemployment.history },
    ];
    existing.fredCharts = fredData;
  } else if (!existing.stocks.macro?.length) {
    existing.stocks.macro = [
      { label:'Fed Target Rate', value:'4.33%', prev:'4.33%', status:'neutral' },
      { label:'CPI (YoY)',       value:'2.8%',  prev:'3.1%',  status:'good' },
      { label:'Unemployment',    value:'4.1%',  prev:'4.2%',  status:'good' },
    ];
  }

  saveJSON(MARKET_DATA_FILE, existing);
  setMockMarketData(existing);
  console.log('[Poller] ✓ Updated successfully');
}

export function startPoller() {
  updateMarketDataFromAPIs();
  setInterval(updateMarketDataFromAPIs, 5 * 60 * 1000);
}
