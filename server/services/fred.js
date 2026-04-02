// FRED API — Federal Reserve Economic Data
// Fetches 11 macro series + full yield curve snapshot

const BASE_URL = 'https://api.stlouisfed.org/fred/series/observations';

async function fetchSeries(seriesId, limit, apiKey) {
  const url = `${BASE_URL}?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FRED ${seriesId} HTTP ${res.status}`);
  const data = await res.json();
  if (data.error_message) throw new Error(`FRED ${seriesId}: ${data.error_message}`);
  return data.observations
    .filter(o => o.value !== '.')
    .map(o => ({ date: o.date, value: parseFloat(o.value) }));
}

export async function fetchFREDMacroData() {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    console.warn('[FRED] No FRED_API_KEY — skipping. Get a free key at https://fred.stlouisfed.org/docs/api/api_key.html');
    return null;
  }

  try {
    const [
      fedFunds, cpiRaw, unrate, t10y2y, payemsRaw, gdpGrowth, umcsent, t10yie,
      walcl, icsa, wti,
      t1m, t3m, t6m, t1y, t2y, t3y, t5y, t7y, t10y, t20y, t30y,
    ] = await Promise.all([
      fetchSeries('FEDFUNDS',         25, apiKey),
      fetchSeries('CPIAUCSL',         26, apiKey),
      fetchSeries('UNRATE',           25, apiKey),
      fetchSeries('T10Y2Y',          312, apiKey),
      fetchSeries('PAYEMS',           26, apiKey),
      fetchSeries('A191RL1Q225SBEA', 12, apiKey),
      fetchSeries('UMCSENT',          25, apiKey),
      fetchSeries('T10YIE',          312, apiKey),
      fetchSeries('WALCL',            52, apiKey),
      fetchSeries('ICSA',             52, apiKey),
      fetchSeries('DCOILWTICO',      312, apiKey),
      fetchSeries('DGS1MO',  5, apiKey),
      fetchSeries('DGS3MO',  5, apiKey),
      fetchSeries('DGS6MO',  5, apiKey),
      fetchSeries('DGS1',    5, apiKey),
      fetchSeries('DGS2',    5, apiKey),
      fetchSeries('DGS3',    5, apiKey),
      fetchSeries('DGS5',    5, apiKey),
      fetchSeries('DGS7',    5, apiKey),
      fetchSeries('DGS10',   5, apiKey),
      fetchSeries('DGS20',   5, apiKey),
      fetchSeries('DGS30',   5, apiKey),
    ]);

    // Fed Funds Rate
    const fedHistory = fedFunds.slice(0, 24).reverse().map(o => ({ date: o.date.substring(0,7), v: o.value }));

    // CPI YoY (level series → YoY %)
    const cpiYoY = [];
    for (let i = 0; i < cpiRaw.length - 12; i++) {
      if (cpiRaw[i] && cpiRaw[i+12]) {
        cpiYoY.push({ date: cpiRaw[i].date.substring(0,7), v: parseFloat(((cpiRaw[i].value / cpiRaw[i+12].value - 1) * 100).toFixed(2)) });
      }
    }
    const cpiHistory = cpiYoY.slice(0, 24).reverse();

    // Unemployment
    const unrateHistory = unrate.slice(0, 24).reverse().map(o => ({ date: o.date.substring(0,7), v: o.value }));

    // Yield Curve spread (T10Y2Y), sampled weekly
    const t10y2ySampled = t10y2y.filter((_,i) => i%5===0).slice(0, 52).reverse();
    const yieldCurveHistory = t10y2ySampled.map(o => ({ date: o.date.substring(0,10), v: parseFloat(o.value.toFixed(2)) }));

    // Non-Farm Payrolls (MoM change in thousands)
    const payrollsChangeSeries = [];
    for (let i = 0; i < payemsRaw.length - 1; i++) {
      payrollsChangeSeries.push({ date: payemsRaw[i].date.substring(0,7), v: Math.round(payemsRaw[i].value - payemsRaw[i+1].value) });
    }
    const payrollsHistory = payrollsChangeSeries.slice(0, 24).reverse();

    // Real GDP Growth
    const gdpHistory = gdpGrowth.slice(0, 12).reverse().map(o => ({ date: o.date.substring(0,7), v: parseFloat(o.value.toFixed(1)) }));

    // Consumer Sentiment
    const sentimentHistory = umcsent.slice(0, 24).reverse().map(o => ({ date: o.date.substring(0,7), v: parseFloat(o.value.toFixed(1)) }));

    // Breakeven Inflation (T10YIE), sampled weekly
    const t10yieSampled = t10yie.filter((_,i) => i%5===0).slice(0, 52).reverse();
    const breakevenHistory = t10yieSampled.map(o => ({ date: o.date.substring(0,10), v: parseFloat(o.value.toFixed(2)) }));

    // Fed Balance Sheet (WALCL, millions → trillions)
    const walclHistory = walcl.slice(0, 52).reverse().map(o => ({ date: o.date.substring(0,10), v: parseFloat((o.value/1e6).toFixed(2)) }));

    // Initial Jobless Claims (weekly, units → thousands)
    const icsaHistory = icsa.slice(0, 52).reverse().map(o => ({ date: o.date.substring(0,10), v: Math.round(o.value/1000) }));

    // WTI Crude Oil, sampled weekly
    const wtiSampled = wti.filter((_,i) => i%5===0).slice(0, 52).reverse();
    const wtiHistory = wtiSampled.map(o => ({ date: o.date.substring(0,10), v: parseFloat(o.value.toFixed(2)) }));

    // Full Yield Curve snapshot
    const yieldCurveSnapshot = [
      { label:'1M',  value: t1m[0]?.value  ?? null },
      { label:'3M',  value: t3m[0]?.value  ?? null },
      { label:'6M',  value: t6m[0]?.value  ?? null },
      { label:'1Y',  value: t1y[0]?.value  ?? null },
      { label:'2Y',  value: t2y[0]?.value  ?? null },
      { label:'3Y',  value: t3y[0]?.value  ?? null },
      { label:'5Y',  value: t5y[0]?.value  ?? null },
      { label:'7Y',  value: t7y[0]?.value  ?? null },
      { label:'10Y', value: t10y[0]?.value ?? null },
      { label:'20Y', value: t20y[0]?.value ?? null },
      { label:'30Y', value: t30y[0]?.value ?? null },
    ].filter(p => p.value !== null);

    const result = {
      fedFunds:           { current: fedFunds[0]?.value,                                     prev: fedFunds[1]?.value,                                     history: fedHistory },
      cpi:                { current: cpiYoY[0]?.v ?? null,                                   prev: cpiYoY[1]?.v ?? null,                                   history: cpiHistory },
      unemployment:       { current: unrate[0]?.value,                                        prev: unrate[1]?.value,                                        history: unrateHistory },
      yieldCurve:         { current: parseFloat((t10y2y[0]?.value ?? 0).toFixed(2)),          prev: parseFloat((t10y2y[5]?.value ?? 0).toFixed(2)),          history: yieldCurveHistory },
      payrolls:           { current: payrollsChangeSeries[0]?.v ?? null,                      prev: payrollsChangeSeries[1]?.v ?? null,                      history: payrollsHistory },
      gdpGrowth:          { current: parseFloat((gdpGrowth[0]?.value ?? 0).toFixed(1)),       prev: parseFloat((gdpGrowth[1]?.value ?? 0).toFixed(1)),       history: gdpHistory },
      consumerSentiment:  { current: parseFloat((umcsent[0]?.value ?? 0).toFixed(1)),         prev: parseFloat((umcsent[1]?.value ?? 0).toFixed(1)),         history: sentimentHistory },
      breakevenInflation: { current: parseFloat((t10yie[0]?.value ?? 0).toFixed(2)),          prev: parseFloat((t10yie[5]?.value ?? 0).toFixed(2)),          history: breakevenHistory },
      fedBalanceSheet:    { current: parseFloat((walcl[0]?.value/1e6 ?? 0).toFixed(2)),       prev: parseFloat((walcl[4]?.value/1e6 ?? 0).toFixed(2)),       history: walclHistory },
      joblessClaims:      { current: Math.round((icsa[0]?.value ?? 0)/1000),                  prev: Math.round((icsa[1]?.value ?? 0)/1000),                  history: icsaHistory },
      wtiOil:             { current: parseFloat((wti[0]?.value ?? 0).toFixed(2)),             prev: parseFloat((wti[5]?.value ?? 0).toFixed(2)),             history: wtiHistory },
      yieldCurveSnapshot,
    };

    console.log(`[FRED] Rate:${result.fedFunds.current}% | CPI:${result.cpi.current}% | UNRATE:${result.unemployment.current}% | T10Y2Y:${result.yieldCurve.current}% | NFP:${result.payrolls.current}K | GDP:${result.gdpGrowth.current}% | WTI:$${result.wtiOil.current}`);
    return result;
  } catch (err) {
    console.error('[FRED] Failed:', err.message);
    return null;
  }
}
