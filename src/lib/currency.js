/**
 * Currency conversion & formatting.
 *
 * Canonical amounts in the app are always ILS.
 * Display conversion uses rates from a free FX API (cached in localStorage).
 *
 * Note: Frankfurter (ECB) does not publish ILS, so we use ExchangeRate-API's
 * open endpoint (no API key): https://open.er-api.com/v6/latest/ILS
 */

export const BASE_CURRENCY = 'ILS';

export const CURRENCIES = {
  ILS: {
    code: 'ILS',
    symbol: '₪',
    label: 'שקל חדש (₪) ILS',
    shortLabel: 'שקל חדש',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    label: 'דולר אמריקאי ($) USD',
    shortLabel: 'דולר אמריקאי',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    label: 'אירו (€) EUR',
    shortLabel: 'אירו',
  },
};

export const SUPPORTED_CURRENCIES = Object.keys(CURRENCIES);

/** Reasonable offline defaults (ILS → target). Updated when API succeeds. */
export const FALLBACK_RATES = {
  ILS: 1,
  USD: 0.27,
  EUR: 0.25,
};

export const CURRENCY_PREF_KEY = 'parkit_currency';
export const FX_RATES_CACHE_KEY = 'parkit_fx_rates_v1';
export const FX_CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

const FX_API_URL = 'https://open.er-api.com/v6/latest/ILS';

export function isSupportedCurrency(code) {
  return Boolean(CURRENCIES[code]);
}

export function getCurrencyMeta(code) {
  return CURRENCIES[isSupportedCurrency(code) ? code : BASE_CURRENCY];
}

export function loadPreferredCurrency() {
  try {
    const stored = localStorage.getItem(CURRENCY_PREF_KEY);
    if (isSupportedCurrency(stored)) return stored;
  } catch {
    /* ignore */
  }
  return BASE_CURRENCY;
}

export function savePreferredCurrency(code) {
  if (!isSupportedCurrency(code)) return;
  try {
    localStorage.setItem(CURRENCY_PREF_KEY, code);
  } catch {
    /* ignore */
  }
}

export function loadCachedRates() {
  try {
    const raw = localStorage.getItem(FX_RATES_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.rates || typeof parsed.rates !== 'object') return null;
    return {
      rates: {
        ILS: 1,
        USD: Number(parsed.rates.USD) || FALLBACK_RATES.USD,
        EUR: Number(parsed.rates.EUR) || FALLBACK_RATES.EUR,
      },
      fetchedAt: Number(parsed.fetchedAt) || 0,
      source: parsed.source || 'cache',
    };
  } catch {
    return null;
  }
}

export function saveCachedRates(rates, source = 'api') {
  const payload = {
    rates: {
      ILS: 1,
      USD: Number(rates.USD) || FALLBACK_RATES.USD,
      EUR: Number(rates.EUR) || FALLBACK_RATES.EUR,
    },
    fetchedAt: Date.now(),
    source,
  };
  try {
    localStorage.setItem(FX_RATES_CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
  return payload;
}

export function isRatesCacheFresh(fetchedAt, now = Date.now()) {
  return Boolean(fetchedAt) && now - fetchedAt < FX_CACHE_TTL_MS;
}

export function getEffectiveRates(cached) {
  if (cached?.rates) {
    return {
      ILS: 1,
      USD: Number(cached.rates.USD) || FALLBACK_RATES.USD,
      EUR: Number(cached.rates.EUR) || FALLBACK_RATES.EUR,
    };
  }
  return { ...FALLBACK_RATES };
}

/**
 * Convert an ILS amount to the target currency.
 */
export function convertFromIls(amountIls, currency = BASE_CURRENCY, rates = FALLBACK_RATES) {
  const code = isSupportedCurrency(currency) ? currency : BASE_CURRENCY;
  const rate = Number(rates?.[code]) || FALLBACK_RATES[code] || 1;
  const value = Number(amountIls);
  if (!Number.isFinite(value)) return 0;
  return value * rate;
}

/**
 * Format an ILS amount for display in the selected currency.
 * @param {number} amountIls
 * @param {object} [options]
 * @param {string} [options.currency]
 * @param {Record<string, number>} [options.rates]
 * @param {number} [options.maximumFractionDigits]
 * @param {boolean} [options.compact] — fewer decimals for map pins
 */
export function formatPrice(amountIls, options = {}) {
  const {
    currency = BASE_CURRENCY,
    rates = FALLBACK_RATES,
    maximumFractionDigits,
    compact = false,
  } = options;

  const meta = getCurrencyMeta(currency);
  const converted = convertFromIls(amountIls, meta.code, rates);

  let digits = maximumFractionDigits;
  if (digits == null) {
    if (meta.code === 'ILS') {
      digits = 0;
    } else if (compact) {
      digits = converted >= 10 ? 0 : 2;
    } else {
      digits = 2;
    }
  }

  const rounded = digits === 0
    ? Math.round(converted)
    : Number(converted.toFixed(digits));

  const formatted = rounded.toLocaleString('he-IL', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

  return `${meta.symbol}${formatted}`;
}

/**
 * Fetch latest ILS→USD/EUR rates. Throws on network/API failure.
 */
export async function fetchExchangeRates() {
  const response = await fetch(FX_API_URL);
  if (!response.ok) {
    throw new Error(`FX API HTTP ${response.status}`);
  }

  const data = await response.json();
  if (data?.result !== 'success' || !data?.rates) {
    throw new Error('FX API returned an unexpected payload');
  }

  const usd = Number(data.rates.USD);
  const eur = Number(data.rates.EUR);
  if (!Number.isFinite(usd) || !Number.isFinite(eur) || usd <= 0 || eur <= 0) {
    throw new Error('FX API missing USD/EUR rates');
  }

  return saveCachedRates({ ILS: 1, USD: usd, EUR: eur }, 'open.er-api.com');
}

/**
 * Resolve rates: fresh cache → fetch → stale cache → fallback.
 * Never throws.
 */
export async function resolveExchangeRates({ force = false } = {}) {
  const cached = loadCachedRates();

  if (!force && cached && isRatesCacheFresh(cached.fetchedAt)) {
    return {
      rates: getEffectiveRates(cached),
      fetchedAt: cached.fetchedAt,
      source: cached.source || 'cache',
      fromCache: true,
    };
  }

  try {
    const fresh = await fetchExchangeRates();
    return {
      rates: getEffectiveRates(fresh),
      fetchedAt: fresh.fetchedAt,
      source: fresh.source,
      fromCache: false,
    };
  } catch {
    if (cached?.rates) {
      return {
        rates: getEffectiveRates(cached),
        fetchedAt: cached.fetchedAt,
        source: 'stale-cache',
        fromCache: true,
      };
    }

    return {
      rates: { ...FALLBACK_RATES },
      fetchedAt: 0,
      source: 'fallback',
      fromCache: false,
    };
  }
}
