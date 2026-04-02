// Crypto market data: CoinGecko global stats + Blocknative ETH gas

export async function fetchCryptoMarketData() {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/global');
    const data = await response.json();
    return {
      btcDominance:   parseFloat(data.data.market_cap_percentage.btc.toFixed(1)),
      totalMarketCap: (data.data.total_market_cap.usd / 1e12).toFixed(2), // trillions
    };
  } catch (err) {
    console.error('[CoinGecko] Failed:', err.message);
    return null;
  }
}

export async function fetchEthGas() {
  try {
    const response = await fetch('https://api.blocknative.com/gasprices/blockprices');
    const data = await response.json();
    return Math.round(data.blockPrices[0].baseFeePerGas);
  } catch (err) {
    console.error('[ETH Gas] Failed:', err.message);
    return null;
  }
}
