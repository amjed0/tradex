import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Wallet, 
  Sparkles,
  PlusCircle,
  RefreshCw,
  Bot
} from 'lucide-react';

export default function Navbar({ 
  onOpenCopilot, 
  onOpenPortfolio, 
  paperCapital, 
  openPositionsCount,
  searchQuery,
  setSearchQuery,
  onOpenCustomAnalyzer,
  isIndianMarket,
  setIsIndianMarket,
  marketIndices,
  onRefreshPrices,
  isRefreshing
}) {
  const currencySymbol = isIndianMarket ? '₹' : '$';

  return (
    <header className="navbar-container">
      {/* Top Bar with Live Index Ribbon */}
      <div className="ticker-ribbon">
        <div className="ticker-ribbon-content">
          <div className="ticker-badge-live">
            <span className="live-dot"></span> LIVE {isIndianMarket ? 'NSE / BSE' : 'NYSE / NASDAQ'} FEED
          </div>
          {(marketIndices || []).map((idx) => (
            <div key={idx.symbol} className="ticker-item">
              <span className="ticker-name">{idx.symbol}</span>
              <span className="ticker-code">({idx.ticker})</span>
              <span className="ticker-price">{idx.formattedPrice || idx.price}</span>
              <span className={`ticker-change ${idx.isUp ? 'positive' : 'negative'}`}>
                {idx.isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {idx.change}
              </span>
            </div>
          ))}
          {/* Duplicate for smooth continuous scroll */}
          {(marketIndices || []).map((idx) => (
            <div key={`${idx.symbol}-dup`} className="ticker-item">
              <span className="ticker-name">{idx.symbol}</span>
              <span className="ticker-code">({idx.ticker})</span>
              <span className="ticker-price">{idx.formattedPrice || idx.price}</span>
              <span className={`ticker-change ${idx.isUp ? 'positive' : 'negative'}`}>
                {idx.isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {idx.change}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="navbar-main">
        <div className="nav-brand-section">
          <div className="nav-logo-box">
            <div className="logo-icon-wrapper">
              <Sparkles className="logo-sparkle" size={20} />
            </div>
            <div>
              <div className="brand-title">
                Trade<span className="brand-accent">X</span> <span className="ai-badge">AI</span>
              </div>
              <div className="brand-subtitle">LIVE BROKERAGE & NEURAL ALPHA ENGINE</div>
            </div>
          </div>

          {/* MARKET TOGGLE: Indian Market vs US / Foreign Market */}
          <div className="market-toggle-pill-container">
            <button
              id="btn-market-indian"
              className={`market-toggle-btn ${isIndianMarket ? 'active' : ''}`}
              onClick={() => setIsIndianMarket(true)}
              title="Switch to Indian Market (NSE / BSE - Rupee ₹)"
            >
              <span className="flag-icon">🇮🇳</span>
              <span className="market-btn-text">Indian Market (NSE)</span>
            </button>
            <button
              id="btn-market-foreign"
              className={`market-toggle-btn ${!isIndianMarket ? 'active' : ''}`}
              onClick={() => setIsIndianMarket(false)}
              title="Switch to Foreign / US Market (NYSE / NASDAQ - Dollar $)"
            >
              <span className="flag-icon">🇺🇸</span>
              <span className="market-btn-text">Foreign / US (NYSE)</span>
            </button>
          </div>

          <div className="market-status-pill">
            <span className="pulse-dot"></span>
            <span className="status-text">
              {isIndianMarket ? 'NSE / BSE: ' : 'NYSE / NASDAQ: '}
              <strong className="active-green">LIVE STREAMING</strong>
            </span>
          </div>
        </div>

        {/* Center Search Input */}
        <div className="nav-search-bar">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder={isIndianMarket ? "Search Indian stock (e.g. RELIANCE, TCS, TATAMOTORS, ZOMATO)..." : "Search US stock (e.g. NVDA, TSLA, AAPL, MSFT)..."} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="search-clear-btn" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>

        {/* Right Action Buttons */}
        <div className="nav-actions">
          {/* Refresh live prices button */}
          <button 
            id="btn-refresh-quotes"
            className="btn-refresh-pill"
            onClick={onRefreshPrices}
            disabled={isRefreshing}
            title="Fetch real-time live quotes from Yahoo Finance"
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin-anim' : ''} />
            <span className="refresh-text">{isRefreshing ? 'Updating...' : 'Live Refresh'}</span>
          </button>

          {/* Analyze Any Stock Button */}
          <button 
            id="btn-analyze-ticker"
            className="btn-custom-analyze"
            onClick={onOpenCustomAnalyzer}
            title="Give any stock to AI and get When to Buy, Stop Loss, Target, and full Technical analysis"
          >
            <PlusCircle size={15} />
            <span>Analyze Any Stock</span>
          </button>

          {/* Paper Trading Portfolio Button */}
          <button 
            id="btn-paper-portfolio"
            className="btn-portfolio-pill"
            onClick={onOpenPortfolio}
            title="Open Paper Trading Brokerage Account"
          >
            <Wallet size={16} className="wallet-icon" />
            <div className="portfolio-info">
              <span className="portfolio-label">VIRTUAL CAPITAL</span>
              <span className="portfolio-balance">
                {currencySymbol}{paperCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {openPositionsCount > 0 && (
              <span className="position-count-badge">{openPositionsCount} Open</span>
            )}
          </button>

          {/* AI Copilot Drawer Button */}
          <button 
            id="btn-ai-copilot"
            className="btn-ai-copilot"
            onClick={onOpenCopilot}
          >
            <Bot size={17} className="bot-icon pulse-subtle" />
            <span>AI Copilot</span>
            <span className="ai-chip">PRO</span>
          </button>
        </div>
      </div>
    </header>
  );
}
