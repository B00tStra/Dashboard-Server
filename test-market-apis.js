#!/usr/bin/env node

/**
 * Test Script for Market Data API Endpoints
 *
 * This script tests all the direct API endpoints documented in agent/AGENT.md
 * and validates the responses according to the defined rules.
 */

import https from 'https';
import http from 'http';

// ANSI Color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(color, prefix, message) {
  console.log(`${color}${prefix}${colors.reset} ${message}`);
}

function success(message) {
  log(colors.green, '✓', message);
}

function error(message) {
  log(colors.red, '✗', message);
}

function info(message) {
  log(colors.cyan, 'ℹ', message);
}

function warn(message) {
  log(colors.yellow, '⚠', message);
}

// Helper to fetch JSON from URL with proper headers
function fetchJSON(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const urlObj = new URL(url);

    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        ...headers
      }
    };

    protocol.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 100)}`));
          return;
        }
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(new Error(`JSON parse error: ${err.message} (Response: ${data.substring(0, 100)})`));
        }
      });
    }).on('error', reject);
  });
}

// Validation functions
function validateFearAndGreed(value, name) {
  const val = parseInt(value);
  if (isNaN(val) || val < 0 || val > 100) {
    error(`${name}: Invalid value ${value} (must be 0-100)`);
    return null;
  }
  success(`${name}: ${val} ✓`);
  return val;
}

function validateBTCDominance(value) {
  const val = parseFloat(value);
  if (isNaN(val) || val < 30.0 || val > 70.0) {
    error(`BTC Dominance: Invalid value ${value}% (must be 30.0-70.0%)`);
    return null;
  }
  const rounded = Math.round(val * 10) / 10;
  success(`BTC Dominance: ${rounded}% ✓`);
  return rounded;
}

function validateETHGas(value) {
  const val = parseInt(value);
  if (isNaN(val) || val < 0 || val > 999) {
    error(`ETH Gas: Invalid value ${value} (must be 0-999 Gwei)`);
    return null;
  }
  success(`ETH Gas: ${val} Gwei ✓`);
  return val;
}

function formatMarketCap(value) {
  const trillions = value / 1e12;
  if (trillions < 0.5 || trillions > 10.0) {
    error(`Total Market Cap: Invalid value $${trillions.toFixed(2)}T (must be $0.5T-$10.0T)`);
    return null;
  }
  const formatted = `$${trillions.toFixed(2)}T`;
  success(`Total Market Cap: ${formatted} ✓`);
  return formatted;
}

// Test each API endpoint
async function testStocksFearAndGreed() {
  info('Testing Stocks Fear & Greed (Multiple sources)...');

  // Try 1: Original CNN API
  try {
    const data = await fetchJSON('https://production.dataviz.cnn.io/index/fearandgreed/graphdata');
    const score = data.fear_and_greed?.score;
    if (score) {
      return validateFearAndGreed(score, 'Stocks Fear & Greed (CNN)');
    }
  } catch (err) {
    warn(`CNN API failed (${err.message}), trying alternative...`);
  }

  // Try 2: FearGreedMeter.com scraping
  try {
    const response = await new Promise((resolve, reject) => {
      https.get('https://feargreedmeter.com/', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });

    // Extract value from HTML (e.g., "value":15 or similar pattern)
    const match = response.match(/"value":\s*(\d+)/);
    if (match) {
      const score = parseInt(match[1]);
      return validateFearAndGreed(score, 'Stocks Fear & Greed (FearGreedMeter)');
    }

    error('FearGreedMeter: Could not extract value from HTML');
    return null;
  } catch (err) {
    error(`FearGreedMeter API failed: ${err.message}`);
    return null;
  }
}

async function testCryptoFearAndGreed() {
  info('Testing Crypto Fear & Greed (Alternative.me)...');
  try {
    const data = await fetchJSON('https://api.alternative.me/fng/?limit=1');
    const value = data.data?.[0]?.value;
    if (!value) {
      error('Alternative.me API: data[0].value not found in response');
      return null;
    }
    return validateFearAndGreed(value, 'Crypto Fear & Greed');
  } catch (err) {
    error(`Alternative.me API failed: ${err.message}`);
    return null;
  }
}

async function testCryptoMarketData() {
  info('Testing Crypto Market Data (CoinGecko)...');
  try {
    const data = await fetchJSON('https://api.coingecko.com/api/v3/global');

    // BTC Dominance
    const btcDom = data.data?.market_cap_percentage?.btc;
    const validBtcDom = btcDom ? validateBTCDominance(btcDom) : null;

    // Total Market Cap
    const totalCap = data.data?.total_market_cap?.usd;
    const validTotalCap = totalCap ? formatMarketCap(totalCap) : null;

    if (!btcDom || !totalCap) {
      error('CoinGecko API: Missing required fields');
      return { btcDom: null, totalCap: null };
    }

    return { btcDom: validBtcDom, totalCap: validTotalCap };
  } catch (err) {
    error(`CoinGecko API failed: ${err.message}`);
    return { btcDom: null, totalCap: null };
  }
}

async function testETHGasPrice() {
  info('Testing ETH Gas Price (BlockNative)...');
  try {
    const data = await fetchJSON('https://api.blocknative.com/gasprices/blockprices');
    const gasPrice = data.blockPrices?.[0]?.baseFeePerGas;
    if (!gasPrice) {
      error('BlockNative API: blockPrices[0].baseFeePerGas not found in response');
      return null;
    }
    // BlockNative returns decimals, we need integer Gwei
    const gasGwei = Math.round(gasPrice);
    return validateETHGas(gasGwei);
  } catch (err) {
    error(`BlockNative API failed: ${err.message}`);
    return null;
  }
}

// Main test runner
async function runTests() {
  console.log('\n' + colors.cyan + '═'.repeat(60) + colors.reset);
  console.log(colors.cyan + '  Market Data API Test Suite' + colors.reset);
  console.log(colors.cyan + '═'.repeat(60) + colors.reset + '\n');

  const results = {};

  // Test all APIs
  results.stocksFG = await testStocksFearAndGreed();
  console.log();

  results.cryptoFG = await testCryptoFearAndGreed();
  console.log();

  const cryptoData = await testCryptoMarketData();
  results.btcDom = cryptoData.btcDom;
  results.totalCap = cryptoData.totalCap;
  console.log();

  results.ethGas = await testETHGasPrice();
  console.log();

  // Summary
  console.log(colors.cyan + '─'.repeat(60) + colors.reset);
  console.log(colors.cyan + '  Test Summary' + colors.reset);
  console.log(colors.cyan + '─'.repeat(60) + colors.reset + '\n');

  const tests = [
    { name: 'Stocks Fear & Greed (CNN)', value: results.stocksFG },
    { name: 'Crypto Fear & Greed (Alternative.me)', value: results.cryptoFG },
    { name: 'BTC Dominance (CoinGecko)', value: results.btcDom },
    { name: 'Total Market Cap (CoinGecko)', value: results.totalCap },
    { name: 'ETH Gas Price (BlockNative)', value: results.ethGas },
  ];

  const passed = tests.filter(t => t.value !== null).length;
  const failed = tests.filter(t => t.value === null).length;

  tests.forEach(test => {
    if (test.value !== null) {
      success(`${test.name}: PASSED`);
    } else {
      error(`${test.name}: FAILED`);
    }
  });

  console.log();
  console.log(colors.cyan + '─'.repeat(60) + colors.reset);
  if (failed === 0) {
    success(`All ${passed} tests passed!`);
  } else {
    warn(`${passed} passed, ${failed} failed`);
  }
  console.log(colors.cyan + '═'.repeat(60) + colors.reset + '\n');

  // Build payload (allow partial data)
  const canBuildPayload = results.cryptoFG !== null && results.btcDom !== null &&
                          results.totalCap !== null && results.ethGas !== null;

  if (canBuildPayload) {

    console.log(colors.cyan + '  Generated Payload for Dashboard' + colors.reset);
    console.log(colors.cyan + '─'.repeat(60) + colors.reset + '\n');

    // Use fallback value for Stocks F&G if CNN failed
    const stocksFG = results.stocksFG !== null ? results.stocksFG : 50;
    if (results.stocksFG === null) {
      warn('Using fallback value (50) for Stocks Fear & Greed — Agent should use Tavily');
    }

    const payload = {
      stocks: {
        fearAndGreed: stocksFG,
        macro: [
          { label: 'Fed Target Rate', value: '5.25 - 5.50%', prev: '5.25 - 5.50%', status: 'neutral' },
          { label: 'CPI (YoY)', value: '3.1%', prev: '3.2%', status: 'good' },
          { label: 'Non-Farm Payrolls', value: '275K', prev: '229K', status: 'hot' }
        ]
      },
      crypto: {
        fearAndGreed: results.cryptoFG,
        macro: [
          { label: 'BTC Dominance', value: `${results.btcDom}%`, prev: '51.8%', status: 'hot' },
          { label: 'Total Market Cap', value: results.totalCap, prev: '$2.51T', status: 'good' },
          { label: 'ETH Gas (Gwei)', value: String(results.ethGas), prev: '45', status: 'neutral' }
        ]
      }
    };

    console.log(JSON.stringify(payload, null, 2));
    console.log();

    info('To submit this to the dashboard, run:');
    console.log(colors.gray + 'curl -X POST http://localhost:3001/api/market-data \\' + colors.reset);
    console.log(colors.gray + '  -H "Content-Type: application/json" \\' + colors.reset);
    console.log(colors.gray + '  -d \'' + JSON.stringify(payload) + '\'' + colors.reset);
    console.log();

    return payload;
  } else {
    warn('Cannot generate payload — some APIs failed');
    return null;
  }
}

// Run tests
runTests().catch(err => {
  error(`Test suite failed: ${err.message}`);
  process.exit(1);
});
