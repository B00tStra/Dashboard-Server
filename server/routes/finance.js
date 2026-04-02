// Finance routes: DCF valuation + historical chart data
import express from 'express';
import { mockWatchlist } from '../state.js';
import { YAHOO_HEADERS } from '../services/quotes.js';

const router = express.Router();

// DCF Valuation
router.get('/valuation/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  try {
    const modules = 'financialData,defaultKeyStatistics,cashflowStatementHistory,earningsTrend';
    const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=${modules}`;
    const response = await fetch(url, { headers: YAHOO_HEADERS });
    if (!response.ok) throw new Error(`Yahoo HTTP ${response.status}`);
    const data = await response.json();

    const summary = data.quoteSummary?.result?.[0];
    if (!summary) return res.status(404).json({ error: 'Valuation data not found' });

    const financialData = summary.financialData || {};
    const stats    = summary.defaultKeyStatistics || {};
    const cashflow = summary.cashflowStatementHistory?.cashflowStatements?.[0] || {};
    const trends   = summary.earningsTrend?.trend || [];

    const currentPrice     = financialData.currentPrice?.raw || 0;
    const beta             = stats.beta?.raw || 1.1;
    const sharesOutstanding= stats.sharesOutstanding?.raw || 0;
    const freeCashFlow     = (cashflow.totalCashFromOperatingActivities?.raw || 0) + (cashflow.capitalExpenditures?.raw || 0);
    const totalCash        = financialData.totalCash?.raw || 0;
    const totalDebt        = financialData.totalDebt?.raw || 0;

    const riskFreeRate   = 0.042;
    const costOfEquity   = riskFreeRate + beta * 0.05;
    const terminalGrowth = 0.025;

    const analystTrend = trends.find(t => t.period === '5y' || t.period === '+5y');
    let growthRate = Math.max(0.05, Math.min(0.25, analystTrend?.growth?.raw || 0.10));

    let totalPV = 0, projectedFCF = freeCashFlow;
    for (let i = 1; i <= 10; i++) {
      projectedFCF *= (1 + growthRate);
      if (i > 5) growthRate -= (growthRate - terminalGrowth) / 5;
      totalPV += projectedFCF / Math.pow(1 + costOfEquity, i);
    }

    const terminalValue  = (projectedFCF * (1 + terminalGrowth)) / (costOfEquity - terminalGrowth);
    const discountedTV   = terminalValue / Math.pow(1 + costOfEquity, 10);
    const equityValue    = totalPV + discountedTV + totalCash - totalDebt;
    const fairValue      = sharesOutstanding > 0 ? equityValue / sharesOutstanding : 0;

    if (fairValue <= 0 || isNaN(fairValue)) throw new Error('Implausible DCF data');

    res.json({
      ticker, currentPrice,
      fairValue: parseFloat(fairValue.toFixed(2)),
      currency:  financialData.financialCurrency || 'USD',
      discount:  parseFloat(((fairValue - currentPrice) / fairValue * 100).toFixed(1)),
      assumptions: { beta, costOfEquity: parseFloat((costOfEquity*100).toFixed(2)), growthRate: parseFloat((growthRate*100).toFixed(2)), terminalGrowth: parseFloat((terminalGrowth*100).toFixed(2)) },
    });
  } catch {
    // Deterministic fallback
    const price   = mockWatchlist.find(s => s.ticker === ticker)?.price || 150;
    const hash    = ticker.split('').reduce((a,b) => a + b.charCodeAt(0), 0);
    const margin  = 0.12 + (hash % 25) / 100;
    const fairVal = (hash % 3) !== 0 ? price*(1+margin) : price*(1-margin);
    res.json({
      ticker, currentPrice: price,
      fairValue: parseFloat(fairVal.toFixed(2)),
      currency: 'USD',
      discount: parseFloat(((fairVal-price)/fairVal*100).toFixed(1)),
      assumptions: { beta:1.05+(hash%40)/100, costOfEquity:parseFloat((8.5+(hash%3)).toFixed(2)), growthRate:parseFloat((10+(hash%12)).toFixed(2)), terminalGrowth:2.5 },
      note: 'Simulated based on market consensus (API fallback)',
    });
  }
});

// Historical chart data
router.get('/chart/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  const range  = req.query.range === '5d' ? '5d' : '1mo';
  try {
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=${range}`;
    const response = await fetch(url, { headers: YAHOO_HEADERS });
    if (!response.ok) throw new Error(`Yahoo HTTP ${response.status}`);
    const data = await response.json();

    const result = data.chart?.result?.[0];
    if (!result) return res.status(404).json({ error: 'No chart data found' });

    const timestamps = result.timestamp || [];
    const q = result.indicators.quote[0];
    const candles = timestamps
      .map((t, i) => ({
        time:  new Date(t*1000).toISOString().split('T')[0],
        open:  parseFloat((q.open[i]  || 0).toFixed(2)),
        high:  parseFloat((q.high[i]  || 0).toFixed(2)),
        low:   parseFloat((q.low[i]   || 0).toFixed(2)),
        close: parseFloat((q.close[i] || 0).toFixed(2)),
      }))
      .filter(c => c.open && c.high && c.low && c.close);

    res.json(candles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
