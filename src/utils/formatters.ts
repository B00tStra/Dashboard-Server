export const fmt = (n: number, digits = 2) =>
  new Intl.NumberFormat('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);

export const fmtEur = (n: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(n);

export const TV_LOGO_MAP: Record<string, string> = {
  NVDA: 'nvidia', AMD: 'advanced-micro-devices', AAPL: 'apple',
  TSLA: 'tesla', MSFT: 'microsoft', AMZN: 'amazon', META: 'meta-platforms',
  GOOGL: 'alphabet', NOW: 'servicenow', NFLX: 'netflix', ANET: 'arista-networks',
  CPRT: 'copart', JPM: 'jpmorgan-chase', FTNT: 'fortinet',
};

export const getLogoUrl = (ticker: string): string | null => {
  const name = TV_LOGO_MAP[ticker];
  return name ? `https://s3-symbol-logo.tradingview.com/${name}--big.svg` : null;
};
