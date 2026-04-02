// Fear & Greed index fetchers (stocks + crypto)

export async function fetchFearAndGreedStocks() {
  try {
    const response = await fetch('https://feargreedmeter.com/');
    const html = await response.text();
    const match = html.match(/"value":\s*(\d+)/);
    if (match) return parseInt(match[1]);
  } catch (err) {
    console.error('[F&G Stocks] Primary source failed:', err.message);
  }

  try {
    const response = await fetch('https://production.dataviz.cnn.io/index/fearandgreed/graphdata');
    const data = await response.json();
    return parseInt(data.fear_and_greed.score);
  } catch (err) {
    console.error('[F&G Stocks] Fallback failed:', err.message);
  }

  return null;
}

export async function fetchFearAndGreedCrypto() {
  try {
    const response = await fetch('https://api.alternative.me/fng/?limit=5');
    const data = await response.json();
    return {
      current:   parseInt(data.data[0].value),
      yesterday: parseInt(data.data[1]?.value || data.data[0].value),
      lastWeek:  parseInt(data.data[4]?.value || data.data[0].value),
      status:    data.data[0].value_classification,
    };
  } catch (err) {
    console.error('[F&G Crypto] Failed:', err.message);
    return null;
  }
}
