import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from './components/Navbar';
import HorizonFilterBar from './components/HorizonFilterBar';
import StockCardGrid from './components/StockCardGrid';
import StockDetailModal from './components/StockDetailModal';
import AiCopilotDrawer from './components/AiCopilotDrawer';
import CustomStockAnalyzer from './components/CustomStockAnalyzer';
import './App.css';

import { INDIAN_STOCKS_UNIVERSE } from './data/indianStocksList';
import { US_STOCKS_UNIVERSE } from './data/usStocksList';
import { fetchLiveStockData, fetchMarketIndices, getInitialStockList, getInitialIndices } from './services/stockService';

export default function App() {
  // Market Selection: true = Indian Market (NSE / BSE), false = Foreign / US Market (NYSE / NASDAQ)
  const [isIndianMarket, setIsIndianMarket] = useState(true);

  // Horizon Filter: 'top5-intraday', 'top5-swing', 'top5-longterm', 'all', 'watchlist'
  const [selectedHorizon, setSelectedHorizon] = useState('top5-intraday');
  const [selectedSector, setSelectedSector] = useState('All');
  const [sortBy, setSortBy] = useState('aiScore');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Panels state
  const [selectedStock, setSelectedStock] = useState(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isCustomAnalyzerOpen, setIsCustomAnalyzerOpen] = useState(false);

  // User's Personal Watchlist (stored in localStorage)
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem('tradex_watchlist');
      return saved ? JSON.parse(saved) : ['RELIANCE', 'TCS', 'NVDA', 'AAPL'];
    } catch {
      return ['RELIANCE', 'TCS'];
    }
  });

  const toggleWatchlist = useCallback((ticker) => {
    setWatchlist((prev) => {
      const next = prev.includes(ticker) ? prev.filter((t) => t !== ticker) : [...prev, ticker];
      try {
        localStorage.setItem('tradex_watchlist', JSON.stringify(next));
      } catch (e) {
        // ignore
      }
      return next;
    });
  }, []);

  // Live quotes state: instant baseline so page is never blank on Vercel
  const [stocksList, setStocksList] = useState(() => getInitialStockList(true));
  const [marketIndices, setMarketIndices] = useState(() => getInitialIndices(true));
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currencySymbol = isIndianMarket ? '₹' : '$';

  // Switch baseline stocks when market switches
  useEffect(() => {
    setStocksList(getInitialStockList(isIndianMarket));
    setMarketIndices(getInitialIndices(isIndianMarket));
  }, [isIndianMarket]);

  // Load live indices and stocks for current active market
  const loadMarketData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // 1. Fetch live market indices (Nifty/Sensex or S&P/Nasdaq)
      const indices = await fetchMarketIndices(isIndianMarket);
      setMarketIndices(indices);

      // 2. Fetch live data for the active universe
      const targetUniverse = isIndianMarket ? INDIAN_STOCKS_UNIVERSE : US_STOCKS_UNIVERSE;

      // Fetch in parallel with Promise.allSettled
      const promises = targetUniverse.map((item) =>
        fetchLiveStockData(item.symbol, item.name, item.sector)
      );

      const results = await Promise.allSettled(promises);
      const loadedStocks = results
        .filter((r) => r.status === 'fulfilled' && r.value != null)
        .map((r) => r.value);

      if (loadedStocks.length > 0) {
        setStocksList(loadedStocks);
      }
    } catch (err) {
      console.warn('Error loading market data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [isIndianMarket]);

  // Initial load and on market toggle
  useEffect(() => {
    loadMarketData();
  }, [loadMarketData]);

  // Unique sectors list for filter chips
  const sectorsList = useMemo(() => {
    const set = new Set(['All']);
    stocksList.forEach((s) => {
      if (s.sector) {
        const mainSec = s.sector.split('&')[0].trim();
        set.add(mainSec);
      }
    });
    return Array.from(set);
  }, [stocksList]);

  // --- BEST 5 QUANT PICKS CALCULATIONS ---
  // Top 5 Intraday: sorted by Intraday Conviction & RVOL
  const top5Intraday = useMemo(() => {
    return [...stocksList]
      .sort((a, b) => (b.intraday?.confidence || 0) - (a.intraday?.confidence || 0))
      .slice(0, 5)
      .map((s, idx) => ({ ...s, top5Rank: idx + 1, top5Category: 'intraday' }));
  }, [stocksList]);

  // Top 5 Swing: sorted by Swing Conviction & Risk-Reward Ratio
  const top5Swing = useMemo(() => {
    return [...stocksList]
      .sort((a, b) => (b.shortTerm?.confidence || 0) - (a.shortTerm?.confidence || 0))
      .slice(0, 5)
      .map((s, idx) => ({ ...s, top5Rank: idx + 1, top5Category: 'shortTerm' }));
  }, [stocksList]);

  // Top 5 Long-Term: sorted by Compounder Score & DCF Fair Value discount
  const top5LongTerm = useMemo(() => {
    return [...stocksList]
      .sort((a, b) => (b.longTerm?.compounderScore || 0) - (a.longTerm?.compounderScore || 0))
      .slice(0, 5)
      .map((s, idx) => ({ ...s, top5Rank: idx + 1, top5Category: 'longTerm' }));
  }, [stocksList]);

  // Top 5 map for lookup
  const top5IntradayMap = useMemo(() => new Map(top5Intraday.map((s) => [s.ticker, s.top5Rank])), [top5Intraday]);
  const top5SwingMap = useMemo(() => new Map(top5Swing.map((s) => [s.ticker, s.top5Rank])), [top5Swing]);
  const top5LongTermMap = useMemo(() => new Map(top5LongTerm.map((s) => [s.ticker, s.top5Rank])), [top5LongTerm]);

  // Filtered & Sorted Stocks depending on Active Horizon
  const filteredStocks = useMemo(() => {
    let sourceList = stocksList;

    // Horizon selection
    if (selectedHorizon === 'top5-intraday') {
      sourceList = top5Intraday;
    } else if (selectedHorizon === 'top5-swing') {
      sourceList = top5Swing;
    } else if (selectedHorizon === 'top5-longterm') {
      sourceList = top5LongTerm;
    } else if (selectedHorizon === 'watchlist') {
      sourceList = stocksList.filter((s) => watchlist.includes(s.ticker));
    }

    return sourceList
      .map((stock) => {
        // Tag rank if in top 5
        let rank = null;
        let category = null;
        if (selectedHorizon === 'top5-intraday' || top5IntradayMap.has(stock.ticker)) {
          rank = top5IntradayMap.get(stock.ticker);
          category = 'intraday';
        } else if (selectedHorizon === 'top5-swing' || top5SwingMap.has(stock.ticker)) {
          rank = top5SwingMap.get(stock.ticker);
          category = 'shortTerm';
        } else if (selectedHorizon === 'top5-longterm' || top5LongTermMap.has(stock.ticker)) {
          rank = top5LongTermMap.get(stock.ticker);
          category = 'longTerm';
        }
        return {
          ...stock,
          top5Rank: stock.top5Rank || rank,
          top5Category: stock.top5Category || category,
        };
      })
      .filter((stock) => {
        // Sector filter
        if (selectedSector !== 'All') {
          if (!stock.sector?.toLowerCase().includes(selectedSector.toLowerCase())) {
            return false;
          }
        }

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesTicker = stock.ticker?.toLowerCase().includes(q);
          const matchesName = stock.name?.toLowerCase().includes(q);
          const matchesSector = stock.sector?.toLowerCase().includes(q);
          if (!matchesTicker && !matchesName && !matchesSector) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // If viewing a Top 5 view, keep rank order unless user explicitly changed sortBy
        if (selectedHorizon.startsWith('top5-') && sortBy === 'aiScore') {
          return (a.top5Rank || 99) - (b.top5Rank || 99);
        }
        if (sortBy === 'aiScore') {
          return (b.aiOverallScore || 0) - (a.aiOverallScore || 0);
        }
        if (sortBy === 'change') {
          return (b.changePercent || 0) - (a.changePercent || 0);
        }
        if (sortBy === 'rvol') {
          return (b.rvol || 0) - (a.rvol || 0);
        }
        if (sortBy === 'peLow') {
          return (a.pe || 0) - (b.pe || 0);
        }
        if (sortBy === 'potentialReturn') {
          const aTarget = a.intraday?.targets?.[1]?.profitPercent || 0;
          const bTarget = b.intraday?.targets?.[1]?.profitPercent || 0;
          return bTarget - aTarget;
        }
        return 0;
      });
  }, [
    stocksList,
    selectedHorizon,
    selectedSector,
    searchQuery,
    sortBy,
    top5Intraday,
    top5Swing,
    top5LongTerm,
    top5IntradayMap,
    top5SwingMap,
    top5LongTermMap,
    watchlist,
  ]);

  return (
    <div className="tradex-app-root">
      {/* Top Navbar with Market Toggle (Indian vs Foreign) & Watchlist Quick Link */}
      <Navbar
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onOpenWatchlist={() => setSelectedHorizon('watchlist')}
        watchlistCount={watchlist.length}
        onOpenCustomAnalyzer={() => setIsCustomAnalyzerOpen(true)}
        onSelectTop5={() => setSelectedHorizon('top5-intraday')}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isIndianMarket={isIndianMarket}
        setIsIndianMarket={setIsIndianMarket}
        marketIndices={marketIndices}
        onRefreshPrices={loadMarketData}
        isRefreshing={isRefreshing}
      />

      {/* Main Container */}
      <main className="tradex-main-layout">
        {/* Horizon Filter & Best 5 Selection Bar */}
        <HorizonFilterBar
          selectedHorizon={selectedHorizon}
          setSelectedHorizon={setSelectedHorizon}
          selectedSector={selectedSector}
          setSelectedSector={setSelectedSector}
          sortBy={sortBy}
          setSortBy={setSortBy}
          viewMode={viewMode}
          setViewMode={setViewMode}
          sectorsList={sectorsList}
          totalCount={filteredStocks.length}
          watchlistCount={watchlist.length}
        />

        {/* Live Market Notice Banner */}
        <div className="market-mode-indicator-bar">
          <div className="indicator-left">
            <span className="live-radar-dot"></span>
            <span className="indicator-title">
              Active Live Market:{' '}
              <strong>
                {isIndianMarket
                  ? 'National Stock Exchange (NSE) & BSE India 🇮🇳'
                  : 'New York Stock Exchange & NASDAQ 🇺🇸'}
              </strong>
            </span>
            <span className="indicator-sub">
              {isIndianMarket
                ? 'Showing live quotes in Rupees (₹) with real NSE ticks and AI technical indicators'
                : 'Showing live quotes in US Dollars ($) with real NYSE/NASDAQ ticks and AI technical indicators'}
            </span>
          </div>

          <div className="indicator-right">
            <button
              id="btn-switch-market-secondary"
              className="btn-quick-switch"
              onClick={() => setIsIndianMarket(!isIndianMarket)}
            >
              Switch to {isIndianMarket ? 'Foreign / US Market 🇺🇸' : 'Indian Market 🇮🇳'}
            </button>
          </div>
        </div>

        {/* Stock Analysis Card Grid / Pro Table */}
        <StockCardGrid
          stocks={filteredStocks}
          selectedHorizon={selectedHorizon}
          onSelectStock={(stock) => setSelectedStock(stock)}
          viewMode={viewMode}
          defaultCurrency={currencySymbol}
          watchlist={watchlist}
          onToggleWatchlist={toggleWatchlist}
        />
      </main>

      {/* Modals & Drawers */}
      {selectedStock && (
        <StockDetailModal
          stock={selectedStock}
          initialHorizon={
            selectedHorizon.includes('intraday')
              ? 'intraday'
              : selectedHorizon.includes('swing')
              ? 'shortTerm'
              : selectedHorizon.includes('longterm')
              ? 'longTerm'
              : 'shortTerm'
          }
          onClose={() => setSelectedStock(null)}
          isWatchlisted={watchlist.includes(selectedStock.ticker)}
          onToggleWatchlist={() => toggleWatchlist(selectedStock.ticker)}
        />
      )}

      <AiCopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        onSelectStock={(stock) => {
          setIsCopilotOpen(false);
          setSelectedStock(stock);
        }}
      />

      {/* Custom Any Stock AI Analyzer: user enters any stock, AI returns When to Buy, SL, Targets & Chart Analysis */}
      <CustomStockAnalyzer
        isOpen={isCustomAnalyzerOpen}
        onClose={() => setIsCustomAnalyzerOpen(false)}
        onOpenGeneratedStock={(customStock) => {
          setSelectedStock(customStock);
        }}
        isIndianMarket={isIndianMarket}
        watchlist={watchlist}
        onToggleWatchlist={toggleWatchlist}
      />
    </div>
  );
}
