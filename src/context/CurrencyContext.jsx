import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  BASE_CURRENCY,
  CURRENCIES,
  FALLBACK_RATES,
  SUPPORTED_CURRENCIES,
  convertFromIls,
  formatPrice as formatPriceLib,
  getCurrencyMeta,
  getEffectiveRates,
  isSupportedCurrency,
  loadCachedRates,
  loadPreferredCurrency,
  resolveExchangeRates,
  savePreferredCurrency,
} from '../lib/currency';

const CurrencyContext = createContext(null);

function initialRatesState() {
  const cached = loadCachedRates();
  return {
    rates: getEffectiveRates(cached),
    fetchedAt: cached?.fetchedAt || 0,
    source: cached?.source || 'fallback',
  };
}

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(loadPreferredCurrency);
  const [rates, setRates] = useState(() => initialRatesState().rates);
  const [ratesMeta, setRatesMeta] = useState(() => {
    const initial = initialRatesState();
    return { fetchedAt: initial.fetchedAt, source: initial.source };
  });

  useEffect(() => {
    let active = true;

    resolveExchangeRates()
      .then((result) => {
        if (!active) return;
        setRates(result.rates);
        setRatesMeta({ fetchedAt: result.fetchedAt, source: result.source });
      })
      .catch(() => {
        /* resolveExchangeRates never throws; keep fallback/cache */
      });

    return () => {
      active = false;
    };
  }, []);

  const setCurrency = useCallback((code) => {
    if (!isSupportedCurrency(code)) return;
    setCurrencyState(code);
    savePreferredCurrency(code);
  }, []);

  const formatPrice = useCallback(
    (amountIls, options = {}) => formatPriceLib(amountIls, {
      currency,
      rates,
      ...options,
    }),
    [currency, rates],
  );

  const convert = useCallback(
    (amountIls, targetCurrency = currency) => convertFromIls(amountIls, targetCurrency, rates),
    [currency, rates],
  );

  const value = useMemo(() => ({
    currency,
    setCurrency,
    rates,
    ratesMeta,
    currencies: CURRENCIES,
    supportedCurrencies: SUPPORTED_CURRENCIES,
    baseCurrency: BASE_CURRENCY,
    currencyMeta: getCurrencyMeta(currency),
    formatPrice,
    convert,
    fallbackRates: FALLBACK_RATES,
  }), [currency, setCurrency, rates, ratesMeta, formatPrice, convert]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return ctx;
}
