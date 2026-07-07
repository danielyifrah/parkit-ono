import { createContext, useContext, useState, useCallback } from 'react';

const HeaderContext = createContext(null);

export function HeaderProvider({ children }) {
  const [search, setSearchState] = useState({
    value: '',
    onChange: null,
    onPlaceSelect: null,
    onLocate: null,
    placeholder: '',
  });

  const setSearch = useCallback((config) => {
    if (config === null) {
      setSearchState({ value: '', onChange: null, onPlaceSelect: null, onLocate: null, placeholder: '' });
    } else {
      setSearchState(config);
    }
  }, []);

  return (
    <HeaderContext.Provider value={{ search, setSearch }}>
      {children}
    </HeaderContext.Provider>
  );
}

export function useHeaderSearch() {
  const ctx = useContext(HeaderContext);
  if (!ctx) throw new Error('useHeaderSearch must be used within HeaderProvider');
  return ctx;
}
