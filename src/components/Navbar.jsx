import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Sparkles, 
  PlusCircle, 
  RefreshCw, 
  Bot,
  Menu,
  X,
  Star,
  Award
} from 'lucide-react';

export default function Navbar({ 
  onOpenCopilot, 
  onOpenWatchlist, 
  watchlistCount = 0, 
  onOpenCustomAnalyzer, 
  onSelectTop5,
  searchQuery, 
  setSearchQuery, 
  isIndianMarket, 
  setIsIndianMarket, 
  marketIndices, 
  onRefreshPrices, 
  isRefreshing 
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        {/* Top Header Row: Brand Logo + Market Switcher + Mobile Toggle */}
        <div className="navbar-top-row">
          <div className="nav-brand-section">
            <div className="nav-logo-box" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="logo-icon-wrapper">
                <Sparkles className="logo-sparkle" size={20} />
              </div>
              <div className="brand-text-block">
                <div className="brand-title">
                  Trade<span className="brand-accent">X</span> <span className="ai-badge">QUANT</span>
                </div>
                <div className="brand-subtitle">LIVE MARKET INTELLIGENCE & TOP 5 PICKS</div>
              </div>
            </div>

            {/* Desktop Status Pill */}
            <div className="market-status-pill desktop-only">
              <span className="pulse-dot"></span>
              <span className="status-text">
                {isIndianMarket ? 'NSE / BSE: ' : 'NYSE / NASDAQ: '}
                <strong className="active-green">LIVE STREAMING</strong>
              </span>
            </div>
          </div>

          {/* Right Header: Segmented Market Toggle + Mobile Hamburger */}
          <div className="navbar-header-right">
            {/* MARKET TOGGLE: Indian vs US */}
            <div className="market-toggle-pill-container">
              <button
                id="btn-market-indian"
                className={`market-toggle-btn ${isIndianMarket ? 'active' : ''}`}
                onClick={() => setIsIndianMarket(true)}
                title="Switch to Indian Market (NSE / BSE - Rupee ₹)"
              >
                <span className="flag-icon">🇮🇳</span>
                <span className="market-btn-text">
                  <span className="text-full">Indian Market (NSE)</span>
                  <span className="text-short">NSE</span>
                </span>
              </button>
              <button
                id="btn-market-foreign"
                className={`market-toggle-btn ${!isIndianMarket ? 'active' : ''}`}
                onClick={() => setIsIndianMarket(false)}
                title="Switch to Foreign / US Market (NYSE / NASDAQ - Dollar $)"
              >
                <span className="flag-icon">🇺🇸</span>
                <span className="market-btn-text">
                  <span className="text-full">Foreign / US (NYSE)</span>
                  <span className="text-short">US</span>
                </span>
              </button>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              id="btn-mobile-nav-toggle"
              className="mobile-menu-toggle-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Center Search Input */}
        <div className="nav-search-bar">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder={isIndianMarket ? "Search real Indian stock (e.g. RELIANCE, TCS, INFY)..." : "Search real US stock (e.g. NVDA, TSLA, AAPL)..."} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="search-clear-btn" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>

        {/* Action Buttons Strip */}
        <div className={`nav-actions ${isMobileMenuOpen ? 'mobile-menu-expanded' : ''}`}>
          {/* Top 5 Quick Button */}
          <button 
            id="btn-quick-top5"
            className="btn-top5-pill"
            onClick={() => {
              if (onSelectTop5) onSelectTop5();
              setIsMobileMenuOpen(false);
            }}
            title="View Top 5 AI Selected Stocks"
          >
            <Award size={15} className="text-gold" />
            <span className="btn-text-full">Best 5 Picks</span>
            <span className="btn-text-short">Top 5</span>
          </button>

          {/* Personal Watchlist Button */}
          <button 
            id="btn-watchlist-pill"
            className="btn-watchlist-pill"
            onClick={() => {
              if (onOpenWatchlist) onOpenWatchlist();
              setIsMobileMenuOpen(false);
            }}
            title="View My Personal Watchlist"
          >
            <Star size={15} className={watchlistCount > 0 ? "star-gold" : "star-muted"} fill={watchlistCount > 0 ? "#f59e0b" : "none"} />
            <span>Watchlist</span>
            <span className="watchlist-count-badge">{watchlistCount}</span>
          </button>

          {/* Analyze Any Stock Button */}
          <button 
            id="btn-analyze-ticker"
            className="btn-custom-analyze"
            onClick={() => {
              onOpenCustomAnalyzer();
              setIsMobileMenuOpen(false);
            }}
            title="Analyze Any Stock with AI (When to Buy, Stop Loss, Target, Chart)"
          >
            <PlusCircle size={15} />
            <span className="btn-text-full">Analyze Any Stock</span>
            <span className="btn-text-short">Analyze</span>
          </button>

          {/* Refresh live prices button */}
          <button 
            id="btn-refresh-quotes"
            className="btn-refresh-pill"
            onClick={() => {
              onRefreshPrices();
              setIsMobileMenuOpen(false);
            }}
            disabled={isRefreshing}
            title="Fetch real-time live quotes"
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin-anim' : ''} />
            <span className="refresh-text">{isRefreshing ? 'Updating...' : 'Live Refresh'}</span>
          </button>

          {/* AI Copilot Drawer Button */}
          <button 
            id="btn-ai-copilot"
            className="btn-ai-copilot"
            onClick={() => {
              onOpenCopilot();
              setIsMobileMenuOpen(false);
            }}
            title="AI Market Quant Copilot"
          >
            <Bot size={17} className="bot-icon pulse-subtle" />
            <span>AI Copilot</span>
            <span className="ai-chip">PRO</span>
          </button>
        </div>

        {/* Mobile Dropdown Details (visible when hamburger is toggled) */}
        {isMobileMenuOpen && (
          <div className="mobile-menu-drawer">
            <div className="mobile-drawer-header">
              <div className="mobile-status-row">
                <span className="pulse-dot"></span>
                <span>Real-Time Market: <strong className="active-green">{isIndianMarket ? 'NSE / BSE India (₹)' : 'NYSE / NASDAQ US ($)'}</strong></span>
              </div>
            </div>
            <div className="mobile-drawer-grid">
              <div className="mobile-drawer-card" onClick={() => { if (onSelectTop5) onSelectTop5(); setIsMobileMenuOpen(false); }}>
                <Award size={18} className="text-amber" />
                <div>
                  <div className="md-label">Best 5 Market Picks</div>
                  <div className="md-val text-amber">Top 5 Intraday, Swing & Long-Term</div>
                </div>
              </div>

              <div className="mobile-drawer-card" onClick={() => { if (onOpenWatchlist) onOpenWatchlist(); setIsMobileMenuOpen(false); }}>
                <Star size={18} className="text-gold" fill="#f59e0b" />
                <div>
                  <div className="md-label">My Personal Watchlist</div>
                  <div className="md-val text-bright">{watchlistCount} Tracked Stocks</div>
                </div>
              </div>

              <div className="mobile-drawer-card" onClick={() => { onOpenCustomAnalyzer(); setIsMobileMenuOpen(false); }}>
                <PlusCircle size={18} className="text-cyan" />
                <div>
                  <div className="md-label">Analyze Any Stock</div>
                  <div className="md-val text-cyan">Instant Technical & Fundamental Report</div>
                </div>
              </div>

              <div className="mobile-drawer-card" onClick={() => { onOpenCopilot(); setIsMobileMenuOpen(false); }}>
                <Bot size={18} className="text-purple" />
                <div>
                  <div className="md-label">Neural Alpha Copilot</div>
                  <div className="md-val text-purple">Ask AI Stock Questions</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
