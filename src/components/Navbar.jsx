import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Wallet, 
  Sparkles, 
  PlusCircle, 
  RefreshCw, 
  Bot,
  Menu,
  X
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
        {/* Top Header Row: Brand Logo + Market Switcher + Mobile Toggle */}
        <div className="navbar-top-row">
          <div className="nav-brand-section">
            <div className="nav-logo-box" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="logo-icon-wrapper">
                <Sparkles className="logo-sparkle" size={20} />
              </div>
              <div className="brand-text-block">
                <div className="brand-title">
                  Trade<span className="brand-accent">X</span> <span className="ai-badge">AI</span>
                </div>
                <div className="brand-subtitle">LIVE BROKERAGE & NEURAL ALPHA</div>
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
            placeholder={isIndianMarket ? "Search Indian stock (e.g. RELIANCE, TCS, INFY)..." : "Search US stock (e.g. NVDA, TSLA, AAPL)..."} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="search-clear-btn" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>

        {/* Action Buttons Strip (Inline on desktop, sleek quick-scroll on mobile, expands on menu open) */}
        <div className={`nav-actions ${isMobileMenuOpen ? 'mobile-menu-expanded' : ''}`}>
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

          {/* Analyze Any Stock Button */}
          <button 
            id="btn-analyze-ticker"
            className="btn-custom-analyze"
            onClick={() => {
              onOpenCustomAnalyzer();
              setIsMobileMenuOpen(false);
            }}
            title="Analyze Any Stock with AI"
          >
            <PlusCircle size={15} />
            <span className="btn-text-full">Analyze Any Stock</span>
            <span className="btn-text-short">Analyze</span>
          </button>

          {/* Paper Trading Portfolio Button */}
          <button 
            id="btn-paper-portfolio"
            className="btn-portfolio-pill"
            onClick={() => {
              onOpenPortfolio();
              setIsMobileMenuOpen(false);
            }}
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
            onClick={() => {
              onOpenCopilot();
              setIsMobileMenuOpen(false);
            }}
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
                <span>Active Exchange: <strong className="active-green">{isIndianMarket ? 'NSE / BSE India (₹)' : 'NYSE / NASDAQ US ($)'}</strong></span>
              </div>
            </div>
            <div className="mobile-drawer-grid">
              <div className="mobile-drawer-card" onClick={() => { onOpenPortfolio(); setIsMobileMenuOpen(false); }}>
                <Wallet size={16} className="text-emerald" />
                <div>
                  <div className="md-label">Paper Account Capital</div>
                  <div className="md-val text-emerald font-mono">
                    {currencySymbol}{paperCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <div className="mobile-drawer-card" onClick={() => { onOpenCustomAnalyzer(); setIsMobileMenuOpen(false); }}>
                <PlusCircle size={16} className="text-cyan" />
                <div>
                  <div className="md-label">Custom Stock AI Analyzer</div>
                  <div className="md-val text-cyan">Analyze Any Ticker</div>
                </div>
              </div>

              <div className="mobile-drawer-card" onClick={() => { onOpenCopilot(); setIsMobileMenuOpen(false); }}>
                <Bot size={16} className="text-purple" />
                <div>
                  <div className="md-label">Neural Alpha Copilot</div>
                  <div className="md-val text-purple">Chat with AI Quant Pro</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
