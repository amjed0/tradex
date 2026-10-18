import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  ChevronRight,
  Sliders,
  ArrowUpRight
} from 'lucide-react';

export default function StockCardGrid({ 
  stocks, 
  selectedHorizon, 
  onSelectStock, 
  viewMode,
  defaultCurrency = '$'
}) {
  if (stocks.length === 0) {
    return (
      <div className="empty-state-card">
        <Sliders size={36} className="empty-icon" />
        <h3>No matching stocks found</h3>
        <p>Try clearing your search or switching sector filters to discover AI-screened setups.</p>
      </div>
    );
  }

  // Helper to extract active horizon setup
  const getHorizonData = (stock) => {
    if (selectedHorizon === 'intraday') return { type: 'intraday', data: stock.intraday };
    if (selectedHorizon === 'shortTerm') return { type: 'shortTerm', data: stock.shortTerm };
    if (selectedHorizon === 'longTerm') return { type: 'longTerm', data: stock.longTerm };
    // Default 'all' picks the stock's preferred horizon
    const preferred = stock.preferredHorizon === 'intraday' ? 'intraday' : 
                      stock.preferredHorizon === 'longTerm' ? 'longTerm' : 'shortTerm';
    return { type: preferred, data: stock[preferred] };
  };

  // Helper for mini SVG sparkline
  const renderSparkline = (prices, isPositive) => {
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const width = 120;
    const height = 40;

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

  if (viewMode === 'table') {
    return (
      <div className="table-responsive-container">
        <table className="pro-stock-table">
          <thead>
            <tr>
              <th>TICKER & COMPANY</th>
              <th>PRICE & 24H</th>
              <th>AI SIGNAL & CONVICTION</th>
              <th>WHEN TO BUY (ENTRY)</th>
              <th>STOP LOSS (SL)</th>
              <th>PRIMARY TARGET</th>
              <th>R:R RATIO</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => {
              const { type, data } = getHorizonData(stock);
              const curr = stock.currencySymbol || defaultCurrency;
              const isPositive = stock.change >= 0;
              const entryText = type === 'longTerm' 
                ? `Fair Value ${curr}${data.intrinsicValue}` 
                : `${curr}${data.entryZone.min.toFixed(2)} - ${curr}${data.entryZone.max.toFixed(2)}`;
              
              const slText = type === 'longTerm'
                ? `Safety: ${data.moatRating.slice(0, 15)}...`
                : `${curr}${data.stopLoss.price.toFixed(2)} (${data.stopLoss.distancePercent}%)`;

              const targetText = type === 'longTerm'
                ? `1-Yr: ${curr}${data.target1Yr} (+${(((data.target1Yr - stock.price) / stock.price) * 100).toFixed(1)}%)`
                : `${curr}${data.targets[1]?.price || data.targets[0]?.price} (+${data.targets[1]?.profitPercent || data.targets[0]?.profitPercent}%)`;

              const rrValue = type === 'longTerm' ? 'Compounder' : (data.targets[1]?.rr || data.targets[0]?.rr || data.riskRewardRatio);

              return (
                <tr key={stock.ticker} onClick={() => onSelectStock(stock)} className="table-row-hover">
                  <td>
                    <div className="table-symbol-cell">
                      <span className="table-ticker">{stock.ticker}</span>
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
                    <div className="table-signal-cell">
                      <span className="signal-pill-small">{data.signalBadge}</span>
                      <div className="ai-score-bar-mini">
                        <div className="ai-score-fill" style={{ width: `${data.confidence}%` }}></div>
                        <span className="ai-score-text">{data.confidence}% Conviction</span>
                      </div>
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
                      Analyze <ChevronRight size={14} />
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

  return (
    <div className="stock-card-grid">
      {stocks.map((stock) => {
        const { type, data } = getHorizonData(stock);
        const curr = stock.currencySymbol || defaultCurrency;
        const isPositive = stock.change >= 0;

        return (
          <div 
            key={stock.ticker} 
            className="stock-card"
            onClick={() => onSelectStock(stock)}
          >
            {/* Card Header */}
            <div className="stock-card-top">
              <div className="stock-identity">
                <div className="ticker-badge-row">
                  <span className="card-ticker">{stock.ticker}</span>
                  <span className={`horizon-indicator-tag tag-${type}`}>
                    {type === 'intraday' ? '⚡ INTRADAY' : type === 'shortTerm' ? '🌊 SWING' : '💎 LONG-TERM'}
                  </span>
                  <span className="card-score-badge">
                    <Sparkles size={11} /> {data.confidence}% AI
                  </span>
                </div>
                <div className="card-company-name">{stock.name}</div>
                <div className="card-sector-tag">{stock.sector}</div>
              </div>

              <div className="stock-card-price-block">
                <div className="card-current-price">{curr}{stock.price.toFixed(2)}</div>
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
                  <span className="chip-val">{stock.technicals.rsi.value}</span>
                </div>
                <div className="metric-chip">
                  <span className="chip-label">RVOL</span>
                  <span className="chip-val">{stock.rvol}x</span>
                </div>
                <div className="metric-chip">
                  <span className="chip-label">P/E</span>
                  <span className="chip-val">{stock.pe}</span>
                </div>
              </div>
            </div>

            {/* AI Setup Name & Badge */}
            <div className="setup-banner">
              <div className="setup-badge-text">{data.signalBadge}</div>
              <div className="setup-description-snippet">
                {type === 'longTerm' ? data.thesis : data.setupName}
              </div>
            </div>

            {/* Core Trade Parameters: When to Buy, Stop Loss, Target */}
            <div className="trade-parameters-panel">
              {/* When To Buy */}
              <div className="trade-param-row entry-param">
                <div className="param-label-group">
                  <span className="param-dot dot-cyan"></span>
                  <span className="param-title">WHEN TO BUY:</span>
                </div>
                <div className="param-value-box">
                  {type === 'longTerm' ? (
                    <span className="entry-zone-text">Accumulate below {curr}{data.intrinsicValue.toFixed(2)}</span>
                  ) : (
                    <span className="entry-zone-text">{curr}{data.entryZone.min.toFixed(2)} - {curr}{data.entryZone.max.toFixed(2)}</span>
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
                    <span className="sl-text">Capital Moat Protected</span>
                  ) : (
                    <span className="sl-text">{curr}{data.stopLoss.price.toFixed(2)} ({data.stopLoss.distancePercent}%)</span>
                  )}
                </div>
              </div>

              {/* Primary Target & Risk/Reward */}
              <div className="trade-param-row target-param">
                <div className="param-label-group">
                  <span className="param-dot dot-emerald"></span>
                  <span className="param-title">TARGET T1/T2:</span>
                </div>
                <div className="param-value-box">
                  {type === 'longTerm' ? (
                    <span className="target-text">1-Yr: {curr}{data.target1Yr.toFixed(2)} (+{(((data.target1Yr - stock.price) / stock.price) * 100).toFixed(0)}%)</span>
                  ) : (
                    <span className="target-text">
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
                <span className="rr-value">
                  {type === 'longTerm' ? '3-5x Compounder' : (data.targets[1]?.rr || data.targets[0]?.rr || data.riskRewardRatio)}
                </span>
              </div>

              <button className="btn-open-analysis" onClick={(e) => { e.stopPropagation(); onSelectStock(stock); }}>
                <span>AI Command Center</span>
                <ArrowUpRight size={15} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
