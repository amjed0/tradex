import React from 'react';
import { 
  Zap, 
  TrendingUp, 
  Gem, 
  Layers, 
  ArrowUpDown, 
  Filter, 
  LayoutGrid, 
  TableProperties,
  Star,
  Award,
  Sparkles,
  Compass
} from 'lucide-react';

export default function HorizonFilterBar({
  selectedHorizon,
  setSelectedHorizon,
  selectedSector,
  setSelectedSector,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  sectorsList,
  totalCount,
  watchlistCount = 0
}) {
  const horizons = [
    {
      id: 'top5-intraday',
      name: 'Top 5 Intraday',
      icon: Zap,
      badge: '⚡ Rank #1-#5',
      sub: 'VWAP breakouts & fast scalp targets',
      accentColor: '#f59e0b',
    },
    {
      id: 'top5-swing',
      name: 'Top 5 Swing Trade',
      icon: TrendingUp,
      badge: '🌊 Rank #1-#5',
      sub: '20-EMA pullbacks & 1:3 R:R multi-day',
      accentColor: '#10b981',
    },
    {
      id: 'top5-longterm',
      name: 'Top 5 Long-Term',
      icon: Gem,
      badge: '💎 Rank #1-#5',
      sub: 'Deep moats & intrinsic DCF discount',
      accentColor: '#8b5cf6',
    },
    {
      id: 'watchlist',
      name: 'My Watchlist',
      icon: Star,
      badge: `${watchlistCount} Saved`,
      sub: 'Personal tracked stocks portfolio',
      accentColor: '#eab308',
    },
    {
      id: 'all',
      name: 'All Market Equities',
      icon: Layers,
      badge: `${totalCount} Tickers`,
      sub: 'Complete real-time screener universe',
      accentColor: '#06b6d4',
    },
  ];

  // Dynamic tactical guidance banner based on chosen tab
  const getTacticalNotice = () => {
    switch (selectedHorizon) {
      case 'top5-intraday':
        return {
          title: 'TOP 5 INTRADAY SCALPS',
          desc: 'Screened by highest volume surge (RVOL > 1.1x), holding firmly above VWAP, with favorable ATR stop loss and 1:2.5+ target upside.',
          color: '#f59e0b',
        };
      case 'top5-swing':
        return {
          title: 'TOP 5 SWING TRADE SETUPS',
          desc: 'Screened for multi-day continuation holding above the 20-day EMA support with MACD bullish expansion and 1:3 risk-to-reward ratios.',
          color: '#10b981',
        };
      case 'top5-longterm':
        return {
          title: 'TOP 5 LONG-TERM WEALTH COMPOUNDERS',
          desc: 'Screened for wide economic moats, high ROCE/ROE (>20%), robust free cash flows, and significant discount to DCF Intrinsic Value.',
          color: '#8b5cf6',
        };
      case 'watchlist':
        return {
          title: 'PERSONAL WATCHLIST STATION',
          desc: 'Your saved stocks under continuous personal analysis. Monitor live prices, indicators, and entry triggers in one place.',
          color: '#eab308',
        };
      default:
        return {
          title: 'LIVE ALGORITHMIC SCREENER',
          desc: 'Real-time quotes with computed technical indicators (RSI, MACD, EMAs, ATR) and fundamental valuations across the market.',
          color: '#06b6d4',
        };
    }
  };

  const notice = getTacticalNotice();

  return (
    <div className="filter-bar-wrapper">
      {/* Dynamic AI Strategy & Top 5 Directive Banner */}
      <div className="market-regime-banner">
        <div className="regime-left">
          <div className="regime-pill" style={{ borderColor: notice.color, color: notice.color }}>
            <Award size={15} />
            <span>AI DIRECTIVE: <strong>{notice.title}</strong></span>
          </div>
          <div className="regime-sentiment">
            <span>Market Mode:</span>
            <span className="sentiment-highlight">Algorithmic Quant Selection (Live Exchange Feed)</span>
          </div>
        </div>

        <div className="regime-right">
          <Compass size={14} className="compass-icon" />
          <span className="regime-insight-text">
            <strong>Selection Rule:</strong> {notice.desc}
          </span>
        </div>
      </div>

      {/* Horizon Selector Tabs */}
      <div className="horizon-tabs-container">
        {horizons.map((h) => {
          const Icon = h.icon;
          const isActive = selectedHorizon === h.id;
          return (
            <button
              key={h.id}
              className={`horizon-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => setSelectedHorizon(h.id)}
            >
              <div className="horizon-tab-top">
                <div className="horizon-tab-icon-wrap" style={{ color: h.accentColor }}>
                  <Icon size={18} fill={h.id === 'watchlist' && isActive ? h.accentColor : 'none'} />
                </div>
                <span className="horizon-name">{h.name}</span>
                <span className="horizon-badge" style={{ borderColor: h.accentColor, color: h.accentColor }}>
                  {h.badge}
                </span>
              </div>
              <div className="horizon-sub">{h.sub}</div>
              {isActive && <div className="horizon-active-indicator" style={{ background: h.accentColor }}></div>}
            </button>
          );
        })}
      </div>

      {/* Control bar: Sector filter, Sort Dropdown, View mode toggler */}
      <div className="filter-controls-bar">
        <div className="sector-chips-group">
          <span className="filter-label"><Filter size={13} /> Sector:</span>
          {sectorsList.map((sector) => (
            <button
              key={sector}
              className={`sector-chip ${selectedSector === sector ? 'active' : ''}`}
              onClick={() => setSelectedSector(sector)}
            >
              {sector}
            </button>
          ))}
        </div>

        <div className="sort-view-group">
          <div className="sort-select-wrapper">
            <ArrowUpDown size={14} className="sort-icon" />
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-dropdown"
            >
              <option value="aiScore">Sort: Highest AI Conviction</option>
              <option value="potentialReturn">Sort: Top Target Upside %</option>
              <option value="change">Sort: Top Daily Gainers</option>
              <option value="rvol">Sort: Highest RVOL (Volume Surge)</option>
              <option value="peLow">Sort: Lowest P/E Ratio (Value)</option>
            </select>
          </div>

          <div className="view-mode-toggle">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Visual Cards View"
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Pro Quant Table View"
            >
              <TableProperties size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
