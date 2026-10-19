import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  ChevronRight,
  Sliders,
  ArrowUpRight,
  Star,
  Award,
  HelpCircle,
  ShieldAlert,
  Target,
  Zap,
  Activity
} from 'lucide-react';

export default function StockCardGrid({ 
  stocks, 
  selectedHorizon, 
  onSelectStock, 
  viewMode,
  defaultCurrency = '$',
  watchlist = [],
  onToggleWatchlist
}) {
  if (stocks.length === 0) {
    return (
      <div className="empty-state-card">
        <Sliders size={36} className="empty-icon" />
        <h3>No matching stocks found</h3>
        <p>
          {selectedHorizon === 'watchlist'
            ? 'Your personal watchlist is currently empty. Click the star icon (★) on any stock card to track it here.'
            : 'Try clearing your search query or switching sector filters.'}
        </p>
      </div>
    );
  }

  // Determine which tactical horizon to display on the card
  const getCardHorizon = (stock) => {
    if (selectedHorizon === 'top5-intraday') return { type: 'intraday', data: stock.intraday };
    if (selectedHorizon === 'top5-swing') return { type: 'shortTerm', data: stock.shortTerm };
    if (selectedHorizon === 'top5-longterm') return { type: 'longTerm', data: stock.longTerm };
    
    // For 'all' or 'watchlist', pick based on stock's preferred horizon or default to shortTerm
    const preferred = stock.preferredHorizon === 'intraday' ? 'intraday' : 
                      stock.preferredHorizon === 'longTerm' ? 'longTerm' : 'shortTerm';
    return { type: preferred, data: stock[preferred] || stock.shortTerm };
  };

  // Mini sparkline SVG renderer
  const renderSparkline = (prices, isPositive) => {
    if (!prices || prices.length < 2) return null;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const width = 130;
    const height = 44;

    const points = prices.map((p, i) => {
      const x = (i / (prices.length - 1)) * width;
      const y = height - ((p - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    }).join(' ');

    const strokeColor = isPositive ? '#10b981' : '#f43f5e';
    const fillColor = isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)';

    const firstX = 0;
    const lastX = width;
    const areaPoints = `${points} ${lastX},${height} ${firstX},${height}`;

    return (
      <svg width={width} height={height} className="sparkline-svg">
        <polygon points={areaPoints} fill={fillColor} />
        <polyline fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
      </svg>
    );
  };

  // Table View
  if (viewMode === 'table') {
    return (
      <div className="table-responsive-container">
        <table className="pro-stock-table">
          <thead>
            <tr>
              <th>RANK & TICKER</th>
              <th>PRICE & 24H</th>
              <th>WHY CHOSEN (AI REASON)</th>
              <th>RSI / RVOL</th>
              <th>WHEN TO ENTER</th>
              <th>STOP LOSS</th>
              <th>PRIMARY TARGET</th>
              <th>R:R</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => {
              const { type, data } = getCardHorizon(stock);
              const curr = stock.currencySymbol || defaultCurrency;
              const isPositive = stock.change >= 0;
              const isSaved = watchlist.includes(stock.ticker);
              const rank = stock.top5Rank;

              const entryText = type === 'longTerm' 
                ? `Fair Value ${curr}${data.intrinsicValue}` 
                : `${curr}${data.entryZone.min.toFixed(2)} - ${curr}${data.entryZone.max.toFixed(2)}`;
              
              const slText = type === 'longTerm'
                ? `Moat Safety: 52W Low ${curr}${stock.low52}`
                : `${curr}${data.stopLoss.price.toFixed(2)} (${data.stopLoss.distancePercent}%)`;

              const targetText = type === 'longTerm'
                ? `1-Yr: ${curr}${data.target1Yr} (+${(((data.target1Yr - stock.price) / stock.price) * 100).toFixed(0)}%)`
                : `${curr}${data.targets[1]?.price || data.targets[0]?.price} (+${data.targets[1]?.profitPercent || data.targets[0]?.profitPercent}%)`;

              const rrValue = type === 'longTerm' ? 'Compounder' : (data.targets[1]?.rr || data.targets[0]?.rr || data.riskRewardRatio);

              const whySnippet = stock.whyChosenInTop5 ? stock.whyChosenInTop5[type] : data.summary;

              return (
                <tr key={stock.ticker} onClick={() => onSelectStock(stock)} className="table-row-hover">
                  <td>
                    <div className="table-symbol-cell">
                      <div className="symbol-rank-row">
                        {rank ? (
                          <span className="rank-badge-table">#{rank}</span>
                        ) : null}
                        <button 
                          className={`btn-star-table ${isSaved ? 'saved' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onToggleWatchlist) onToggleWatchlist(stock.ticker);
                          }}
                          title={isSaved ? "Remove from watchlist" : "Add to watchlist"}
                        >
                          <Star size={13} fill={isSaved ? "#f59e0b" : "none"} />
                        </button>
                        <span className="table-ticker">{stock.ticker}</span>
                      </div>
                      <span className="table-company">{stock.name}</span>
                      <span className="table-sector-badge">{stock.sector.split('&')[0]}</span>
                    </div>
                  </td>
                  <td>
                    <div className="table-price-cell">
                      <div className="table-price">{curr}{stock.price.toFixed(2)}</div>
                      <div className={`table-change ${isPositive ? 'positive' : 'negative'}`}>
                        {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="table-reason-cell">
                      <p className="table-reason-text">{whySnippet}</p>
                    </div>
                  </td>
                  <td>
                    <div className="table-tech-cell font-mono">
                      <span>RSI: {stock.technicals?.rsi?.value || 55}</span>
                      <span className="text-dim">RVOL: {stock.rvol}x</span>
                    </div>
                  </td>
                  <td>
                    <span className="entry-zone-highlight">{entryText}</span>
                  </td>
                  <td>
                    <span className="sl-badge-table">{slText}</span>
                  </td>
                  <td>
                    <span className="target-badge-table">{targetText}</span>
                  </td>
                  <td>
                    <span className="rr-pill">{rrValue}</span>
                  </td>
                  <td>
                    <button className="btn-table-action" onClick={(e) => { e.stopPropagation(); onSelectStock(stock); }}>
                      Report <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // Grid View (Default)
  return (
    <div className="stock-card-grid">
      {stocks.map((stock) => {
        const { type, data } = getCardHorizon(stock);
        const curr = stock.currencySymbol || defaultCurrency;
        const isPositive = stock.change >= 0;
        const isSaved = watchlist.includes(stock.ticker);
        const rank = stock.top5Rank;
        const whyChosen = stock.whyChosenInTop5 ? stock.whyChosenInTop5[type] : data.summary;

        return (
          <div 
            key={stock.ticker} 
            className={`stock-card ${rank ? 'top5-featured-card' : ''}`}
            onClick={() => onSelectStock(stock)}
          >
            {/* Top 5 Crown Rank Banner */}
            {rank && (
              <div className="top5-rank-strip">
                <div className="rank-strip-left">
                  <Award size={14} className="gold-trophy" />
                  <span className="rank-text">
                    TOP 5 PICK <strong>• RANK #{rank}</strong>
                  </span>
                </div>
                <div className="rank-score-pill">
                  <Sparkles size={11} /> {data.confidence || stock.aiOverallScore}% AI Conviction
                </div>
              </div>
            )}

            {/* Card Identity Header */}
            <div className="stock-card-top">
              <div className="stock-identity">
                <div className="ticker-badge-row">
                  <span className="card-ticker">{stock.ticker}</span>
                  <span className={`horizon-indicator-tag tag-${type}`}>
                    {type === 'intraday' ? '⚡ INTRADAY' : type === 'shortTerm' ? '🌊 SWING' : '💎 LONG-TERM'}
                  </span>
                  
                  {/* Watchlist Star Toggle */}
                  <button 
                    className={`btn-card-star ${isSaved ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onToggleWatchlist) onToggleWatchlist(stock.ticker);
                    }}
                    title={isSaved ? "Remove from watchlist" : "Save to my personal watchlist"}
                  >
                    <Star size={15} fill={isSaved ? "#f59e0b" : "none"} />
                  </button>
                </div>
                <div className="card-company-name">{stock.name}</div>
                <div className="card-sector-tag">{stock.sector}</div>
              </div>

              <div className="stock-card-price-block">
                <div className="card-current-price font-mono">{curr}{stock.price.toFixed(2)}</div>
                <div className={`card-change-badge ${isPositive ? 'positive' : 'negative'}`}>
                  {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  <span>{isPositive ? '+' : ''}{stock.change.toFixed(2)} ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)</span>
                </div>
              </div>
            </div>

            {/* Sparkline & Quick Indicators */}
            <div className="sparkline-container-row">
              <div className="sparkline-box">
                {renderSparkline(stock.priceHistory, isPositive)}
              </div>
              <div className="card-quick-metrics">
                <div className="metric-chip">
                  <span className="chip-label">RSI(14)</span>
                  <span className={`chip-val font-mono ${stock.technicals?.rsi?.value > 70 ? 'text-crimson' : stock.technicals?.rsi?.value < 35 ? 'text-amber' : 'text-emerald'}`}>
                    {stock.technicals?.rsi?.value || 55}
                  </span>
                </div>
                <div className="metric-chip">
                  <span className="chip-label">RVOL</span>
                  <span className="chip-val font-mono">{stock.rvol}x</span>
                </div>
                <div className="metric-chip">
                  <span className="chip-label">20 EMA</span>
                  <span className="chip-val font-mono">{curr}{stock.technicals?.movingAverages?.ema20 || stock.price}</span>
                </div>
              </div>
            </div>

            {/* "WHY AI CHOSE THIS IN TOP 5" Section */}
            <div className="why-chosen-container">
              <div className="why-chosen-header">
                <Sparkles size={12} className="text-gold" />
                <span className="why-label">WHY THIS STOCK IS SELECTED IN TOP 5:</span>
              </div>
              <p className="why-chosen-desc">
                {whyChosen}
              </p>
            </div>

            {/* Core Tactical Parameters: Entry Zone, Stop Loss, Target */}
            <div className="trade-parameters-panel">
              {/* When To Buy */}
              <div className="trade-param-row entry-param">
                <div className="param-label-group">
                  <span className="param-dot dot-cyan"></span>
                  <span className="param-title">WHEN TO ENTER:</span>
                </div>
                <div className="param-value-box">
                  {type === 'longTerm' ? (
                    <span className="entry-zone-text font-mono">Accumulate below {curr}{data.intrinsicValue?.toFixed(2)}</span>
                  ) : (
                    <span className="entry-zone-text font-mono">{curr}{data.entryZone.min.toFixed(2)} - {curr}{data.entryZone.max.toFixed(2)}</span>
                  )}
                </div>
              </div>

              {/* Stop Loss */}
              <div className="trade-param-row sl-param">
                <div className="param-label-group">
                  <span className="param-dot dot-crimson"></span>
                  <span className="param-title">STOP LOSS:</span>
                </div>
                <div className="param-value-box">
                  {type === 'longTerm' ? (
                    <span className="sl-text font-mono">Moat Defense: 52W Low {curr}{stock.low52}</span>
                  ) : (
                    <span className="sl-text font-mono">{curr}{data.stopLoss.price.toFixed(2)} ({data.stopLoss.distancePercent}%)</span>
                  )}
                </div>
              </div>

              {/* Target & Return */}
              <div className="trade-param-row target-param">
                <div className="param-label-group">
                  <span className="param-dot dot-emerald"></span>
                  <span className="param-title">PROFIT TARGET:</span>
                </div>
                <div className="param-value-box">
                  {type === 'longTerm' ? (
                    <span className="target-text font-mono">1-Yr Target: {curr}{data.target1Yr?.toFixed(2)} (+{(((data.target1Yr - stock.price) / stock.price) * 100).toFixed(0)}%)</span>
                  ) : (
                    <span className="target-text font-mono">
                      {curr}{data.targets[1]?.price || data.targets[0]?.price} (+{data.targets[1]?.profitPercent || data.targets[0]?.profitPercent}%)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Card Footer with R:R Ratio & Action Button */}
            <div className="stock-card-footer">
              <div className="rr-metric-box">
                <span className="rr-title">RISK/REWARD</span>
                <span className="rr-value font-mono">
                  {type === 'longTerm' ? 'Compounder' : (data.targets[1]?.rr || data.targets[0]?.rr || data.riskRewardRatio)}
                </span>
              </div>

              <button className="btn-open-analysis" onClick={(e) => { e.stopPropagation(); onSelectStock(stock); }}>
                <span>Indicator Chart & Report</span>
                <ArrowUpRight size={15} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
