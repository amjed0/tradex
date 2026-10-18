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
  Flame,
  Target,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { AI_MARKET_REGIME } from '../data/stocksData';

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
  totalCount
}) {
  const horizons = [
    {
      id: 'all',
      name: 'All Horizons',
      icon: Layers,
      badge: `${totalCount} Picks`,
      sub: 'Comprehensive AI universe',
      accentColor: '#3b82f6',
    },
    {
      id: 'intraday',
      name: 'Intraday Scalps',
      icon: Zap,
      badge: '5m - 4h',
      sub: 'VWAP breakouts & tight ATR stop losses',
      accentColor: '#f59e0b',
    },
    {
      id: 'shortTerm',
      name: 'Short-Term Swing',
      icon: TrendingUp,
      badge: '2 - 15 Days',
      sub: '20 EMA pullbacks & 1:3 R:R targets',
      accentColor: '#10b981',
    },
    {
      id: 'longTerm',
      name: 'Long-Term Wealth',
      icon: Gem,
      badge: '1 - 5 Years',
      sub: 'Deep moats & intrinsic value discount',
      accentColor: '#8b5cf6',
    },
  ];

  return (
    <div className="filter-bar-wrapper">
      {/* Market Regime & AI Strategy Banner */}
      <div className="market-regime-banner">
        <div className="regime-left">
          <div className="regime-pill">
            <Flame size={14} className="regime-icon" />
            <span>AI REGIME: <strong>{AI_MARKET_REGIME.regime}</strong></span>
          </div>
          <div className="regime-sentiment">
            <span>Market Sentiment:</span>
            <span className="sentiment-highlight">{AI_MARKET_REGIME.sentimentLabel} ({AI_MARKET_REGIME.sentimentScore}/100)</span>
          </div>
          <div className="regime-stat-chip">
            <ShieldCheck size={13} />
            <span>VIX: {AI_MARKET_REGIME.vixState}</span>
          </div>
        </div>

        <div className="regime-right">
          <Compass size={14} className="compass-icon" />
          <span className="regime-insight-text">
            <strong>AI Tactical Directive:</strong> {AI_MARKET_REGIME.keyInsight}
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
                  <Icon size={18} />
                </div>
                <span className="horizon-name">{h.name}</span>
                <span className="horizon-badge" style={{ borderColor: h.accentColor }}>{h.badge}</span>
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
              <option value="aiScore">Sort: Highest AI Confidence</option>
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
