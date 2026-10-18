import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from './components/Navbar';
import HorizonFilterBar from './components/HorizonFilterBar';
import StockCardGrid from './components/StockCardGrid';
import StockDetailModal from './components/StockDetailModal';
import AiCopilotDrawer from './components/AiCopilotDrawer';
import PaperPortfolioModal from './components/PaperPortfolioModal';
import CustomStockAnalyzer from './components/CustomStockAnalyzer';
import './App.css';

import { INDIAN_STOCKS_UNIVERSE } from './data/indianStocksList';
import { US_STOCKS_UNIVERSE } from './data/usStocksList';
import { fetchLiveStockData, fetchMarketIndices } from './services/stockService';

export default function App() {
  // Market Selection: true = Indian Market (NSE / BSE), false = Foreign / US Market (NYSE / NASDAQ)
  const [isIndianMarket, setIsIndianMarket] = useState(true);

  // Horizon Filter: 'all', 'intraday', 'shortTerm', 'longTerm'
  const [selectedHorizon, setSelectedHorizon] = useState('all');
  const [selectedSector, setSelectedSector] = useState('All');
  const [sortBy, setSortBy] = useState('aiScore');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Panels state
  const [selectedStock, setSelectedStock] = useState(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);
  const [isCustomAnalyzerOpen, setIsCustomAnalyzerOpen] = useState(false);

  // Live quotes state
  const [stocksList, setStocksList] = useState([]);
  const [marketIndices, setMarketIndices] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currencySymbol = isIndianMarket ? '₹' : '$';

  // Virtual Paper Trading Portfolio State
  const [portfolio, setPortfolio] = useState({
    capital: isIndianMarket ? 500000 : 50000,
    positions: [],
    closedTrades: []
  });

  // Switch portfolio default capital when market switches if no open positions
  useEffect(() => {
    setPortfolio(prev => {
      if (prev.positions.length === 0 && prev.closedTrades.length === 0) {
        return {
          ...prev,
          capital: isIndianMarket ? 500000 : 50000,
        };
      }
      return prev;
    });
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
      const promises = targetUniverse.map(item => 
        fetchLiveStockData(item.symbol, item.name, item.sector)
      );

      const results = await Promise.allSettled(promises);
      const loadedStocks = results
        .filter(r => r.status === 'fulfilled' && r.value != null)
        .map(r => r.value);

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
    stocksList.forEach(s => {
      if (s.sector) {
        const mainSec = s.sector.split('&')[0].trim();
        set.add(mainSec);
      }
    });
    return Array.from(set);
  }, [stocksList]);

  // Filtered & Sorted Stocks
  const filteredStocks = useMemo(() => {
    return stocksList.filter((stock) => {
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
    }).sort((a, b) => {
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
  }, [stocksList, selectedSector, searchQuery, sortBy]);

  // Execute paper trade handler
  const handleExecutePaperTrade = (tradeOrder) => {
    setPortfolio((prev) => {
      const newPos = {
        id: `pos-${Date.now()}`,
        ...tradeOrder
      };
      return {
        ...prev,
        capital: Math.max(0, prev.capital - tradeOrder.totalCapital),
        positions: [newPos, ...prev.positions]
      };
    });
  };

  // Close position handler
  const handleClosePosition = (posId, profitMultiplier = 1.02) => {
    setPortfolio((prev) => {
      const targetPos = prev.positions.find(p => p.id === posId);
      if (!targetPos) return prev;

      const exitPrice = Number((targetPos.entryPrice * profitMultiplier).toFixed(2));
      const pnlDollars = Number(((exitPrice - targetPos.entryPrice) * targetPos.shares).toFixed(2));
      const pnlPercent = Number((((exitPrice - targetPos.entryPrice) / targetPos.entryPrice) * 100).toFixed(2));

      const closedTrade = {
        id: `closed-${Date.now()}`,
        ticker: targetPos.ticker,
        horizon: targetPos.horizon,
        shares: targetPos.shares,
        entryPrice: targetPos.entryPrice,
        exitPrice: exitPrice,
        pnlDollars: pnlDollars,
        pnlPercent: pnlPercent,
        timestamp: 'Just now'
      };

      return {
        ...prev,
        capital: prev.capital + (targetPos.shares * exitPrice),
        positions: prev.positions.filter(p => p.id !== posId),
        closedTrades: [closedTrade, ...prev.closedTrades]
      };
    });
  };

  // Reset portfolio
  const handleResetPortfolio = () => {
    const defaultCap = isIndianMarket ? 500000 : 50000;
    if (window.confirm(`Reset paper trading balance back to ${currencySymbol}${defaultCap.toLocaleString()} cash?`)) {
      setPortfolio({
        capital: defaultCap,
        positions: [],
        closedTrades: []
      });
    }
  };

  return (
    <div className="tradex-app-root">
      
      {/* Top Navbar with Market Toggle (Indian vs Foreign) & Live Refresh */}
      <Navbar 
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onOpenPortfolio={() => setIsPortfolioOpen(true)}
        onOpenCustomAnalyzer={() => setIsCustomAnalyzerOpen(true)}
        paperCapital={portfolio.capital}
        openPositionsCount={portfolio.positions.length}
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
        
        {/* Horizon Filter & Control Bar */}
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
        />

        {/* Live Market Notice Banner */}
        <div className="market-mode-indicator-bar">
          <div className="indicator-left">
            <span className="live-radar-dot"></span>
            <span className="indicator-title">
              Active Exchange: <strong>{isIndianMarket ? 'National Stock Exchange (NSE) & BSE India 🇮🇳' : 'New York Stock Exchange & NASDAQ 🇺🇸'}</strong>
            </span>
            <span className="indicator-sub">
              {isIndianMarket 
                ? 'Showing live quotes in Indian Rupees (₹) with real NSE ticks' 
                : 'Showing live quotes in US Dollars ($) with real NYSE/NASDAQ ticks'}
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

        {/* Stock Screener Grid / Table with Real Quotes */}
        <StockCardGrid 
          stocks={filteredStocks}
          selectedHorizon={selectedHorizon}
          onSelectStock={(stock) => setSelectedStock(stock)}
          viewMode={viewMode}
          defaultCurrency={currencySymbol}
        />

      </main>

      {/* Modals & Drawers */}
      {selectedStock && (
        <StockDetailModal 
          stock={selectedStock}
          initialHorizon={selectedHorizon}
          onClose={() => setSelectedStock(null)}
          onExecutePaperTrade={handleExecutePaperTrade}
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

      <PaperPortfolioModal 
        isOpen={isPortfolioOpen}
        onClose={() => setIsPortfolioOpen(false)}
        portfolio={portfolio}
        onClosePosition={handleClosePosition}
        onResetPortfolio={handleResetPortfolio}
        currencySymbol={currencySymbol}
      />

      {/* Custom Any Stock AI Analyzer: user gives stock, AI returns When to Buy, SL, Targets */}
      <CustomStockAnalyzer 
        isOpen={isCustomAnalyzerOpen}
        onClose={() => setIsCustomAnalyzerOpen(false)}
        onOpenGeneratedStock={(customStock) => {
          setSelectedStock(customStock);
        }}
        isIndianMarket={isIndianMarket}
        onExecutePaperTrade={handleExecutePaperTrade}
      />

    </div>
  );
}
