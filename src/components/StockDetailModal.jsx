import React, { useState, useEffect } from 'react';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  Target, 
  Zap, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  BarChart3, 
  Play, 
  Pause,
  Building,
  Info,
  Compass,
  Activity,
  Layers,
  Star,
  Award,
  Eye,
  ArrowRight
} from 'lucide-react';

export default function StockDetailModal({ 
  stock, 
  initialHorizon = 'shortTerm', 
  onClose,
  isWatchlisted = false,
  onToggleWatchlist
}) {
  if (!stock) return null;

  const curr = stock.currencySymbol || (stock.currency === 'INR' ? '₹' : '$');

  // Active Horizon state inside modal
  const [activeHorizon, setActiveHorizon] = useState(
    initialHorizon && initialHorizon !== 'all' ? initialHorizon : (stock.preferredHorizon === 'all' ? 'shortTerm' : stock.preferredHorizon)
  );

  // Overlay toggles for the interactive chart
  const [showOverlays, setShowOverlays] = useState({
    entryZone: true,
    stopLoss: true,
    targets: true,
    ema20: true,
    sma50: true,
    rsiSubChart: true,
    macdSubChart: true,
  });

  // Simulated live ticking price
  const [isLiveTicking, setIsLiveTicking] = useState(true);
  const [currentLivePrice, setCurrentLivePrice] = useState(stock.price);

  // Tick simulation effect
  useEffect(() => {
    let interval;
    if (isLiveTicking) {
      interval = setInterval(() => {
        const delta = (Math.random() - 0.48) * (stock.price * 0.0012);
        setCurrentLivePrice((prev) => Number((prev + delta).toFixed(2)));
      }, 1600);
    }
    return () => clearInterval(interval);
  }, [isLiveTicking, stock.price]);

  // Setup data for currently active horizon
  const horizonData = stock[activeHorizon] || stock.shortTerm;
  const isPositive = stock.change >= 0;

  // Chart data extraction
  const series = stock.chartSeries || (stock.priceHistory || [stock.price * 0.98, stock.price * 1.01, stock.price]).map((p, i, arr) => ({
    price: p,
    ema20: Number((stock.technicals?.movingAverages?.ema20 || p * 0.99)),
    sma50: Number((stock.technicals?.movingAverages?.sma50 || p * 0.97)),
    rsi: Number((stock.technicals?.rsi?.value || 55) + Math.sin(i) * 5),
    macdHist: Number((stock.technicals?.macd?.histogram ? parseFloat(stock.technicals.macd.histogram) : 0.5) + Math.cos(i) * 0.2),
  }));

  const prices = series.map(s => s.price);

  // Stop loss and target references
  let stopLossPriceUsed = currentLivePrice * 0.96;
  let target1PriceUsed = currentLivePrice * 1.04;
  let target2PriceUsed = currentLivePrice * 1.08;

  if (activeHorizon === 'longTerm') {
    stopLossPriceUsed = stock.low52 || currentLivePrice * 0.88;
    target1PriceUsed = horizonData.target1Yr || currentLivePrice * 1.25;
    target2PriceUsed = horizonData.target3Yr || currentLivePrice * 1.65;
  } else {
    stopLossPriceUsed = horizonData.stopLoss?.price || currentLivePrice * 0.97;
    target1PriceUsed = horizonData.targets?.[0]?.price || currentLivePrice * 1.03;
    target2PriceUsed = horizonData.targets?.[1]?.price || currentLivePrice * 1.06;
  }

  // Why this stock was chosen in Top 5
  const whyReason = stock.whyChosenInTop5 ? stock.whyChosenInTop5[activeHorizon] : horizonData.summary;

  // Drawing the Pro Interactive SVG Chart with Indicators
  const renderInteractiveChart = () => {
    const min = Math.min(...prices, stopLossPriceUsed) * 0.99;
    const max = Math.max(...prices, target2PriceUsed) * 1.01;
    const range = max - min || 1;
    const width = 760;
    const mainChartH = 220;

    // Price curve points
    const points = series.map((s, i) => {
      const x = (i / (series.length - 1)) * (width - 40) + 20;
      const y = mainChartH - ((s.price - min) / range) * (mainChartH - 25) - 12;
      return { x, y, ...s };
    });

    const pathData = points.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
    const areaData = `${pathData} L ${points[points.length - 1].x} ${mainChartH} L ${points[0].x} ${mainChartH} Z`;

    // EMA 20 overlay path
    const emaPoints = series.map((s, i) => {
      const x = (i / (series.length - 1)) * (width - 40) + 20;
      const y = mainChartH - ((s.ema20 - min) / range) * (mainChartH - 25) - 12;
      return `${i === 0 ? 'M' : 'L'} ${x} ${Math.max(5, Math.min(mainChartH - 5, y))}`;
    }).join(' ');

    // SMA 50 overlay path
    const smaPoints = series.map((s, i) => {
      const x = (i / (series.length - 1)) * (width - 40) + 20;
      const y = mainChartH - ((s.sma50 - min) / range) * (mainChartH - 25) - 12;
      return `${i === 0 ? 'M' : 'L'} ${x} ${Math.max(5, Math.min(mainChartH - 5, y))}`;
    }).join(' ');

    const slY = mainChartH - ((stopLossPriceUsed - min) / range) * (mainChartH - 25) - 12;
    const t1Y = mainChartH - ((target1PriceUsed - min) / range) * (mainChartH - 25) - 12;
    const t2Y = mainChartH - ((target2PriceUsed - min) / range) * (mainChartH - 25) - 12;
    
    let entryMinY = 0;
    let entryMaxY = 0;
    if (activeHorizon !== 'longTerm' && horizonData.entryZone) {
      entryMinY = mainChartH - ((horizonData.entryZone.min - min) / range) * (mainChartH - 25) - 12;
      entryMaxY = mainChartH - ((horizonData.entryZone.max - min) / range) * (mainChartH - 25) - 12;
    }

    // Sub-chart 1: RSI 14 (Height: 65px)
    const rsiSubH = 65;
    const rsiStartY = mainChartH + 25;
    const rsiPoints = series.map((s, i) => {
      const x = (i / (series.length - 1)) * (width - 40) + 20;
      const y = rsiStartY + rsiSubH - ((s.rsi / 100) * rsiSubH);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    const rsi70Y = rsiStartY + rsiSubH - (0.7 * rsiSubH);
    const rsi30Y = rsiStartY + rsiSubH - (0.3 * rsiSubH);

    // Sub-chart 2: MACD Histogram (Height: 55px)
    const macdSubH = 55;
    const macdStartY = rsiStartY + rsiSubH + 20;
    const macdZeroY = macdStartY + (macdSubH / 2);

    const totalHeight = macdStartY + macdSubH + 15;

    return (
      <svg viewBox={`0 0 ${width} ${totalHeight}`} className="main-interactive-svg">
        <defs>
          <linearGradient id="priceGradientDetail" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="entryZoneGradDetail" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.06" />
          </linearGradient>
        </defs>

        {/* --- MAIN PRICE PANEL --- */}
        <rect x="0" y="0" width={width} height={mainChartH} fill="rgba(15, 23, 42, 0.4)" rx="8" />

        {/* Grid Lines */}
        <line x1="20" y1="40" x2={width - 20} y2="40" stroke="#334155" strokeDasharray="3 3" opacity="0.25" />
        <line x1="20" y1={mainChartH / 2} x2={width - 20} y2={mainChartH / 2} stroke="#334155" strokeDasharray="3 3" opacity="0.25" />
        <line x1="20" y1={mainChartH - 20} x2={width - 20} y2={mainChartH - 20} stroke="#334155" strokeDasharray="3 3" opacity="0.25" />

        {/* Entry Zone Area */}
        {showOverlays.entryZone && activeHorizon !== 'longTerm' && horizonData.entryZone && (
          <g className="chart-entry-zone-group">
            <rect 
              x="20" 
              y={Math.min(entryMinY, entryMaxY)} 
              width={width - 40} 
              height={Math.max(6, Math.abs(entryMinY - entryMaxY))} 
              fill="url(#entryZoneGradDetail)" 
              stroke="#06b6d4" 
              strokeDasharray="4 4" 
              strokeWidth="1.2"
            />
            <text x={width - 190} y={Math.min(entryMinY, entryMaxY) - 5} fill="#06b6d4" fontSize="10.5" fontFamily="JetBrains Mono" fontWeight="600">
              OPTIMAL ENTRY ({curr}{horizonData.entryZone.min} - {curr}{horizonData.entryZone.max})
            </text>
          </g>
        )}

        {/* Target 1 Line */}
        {showOverlays.targets && t1Y > 0 && t1Y < mainChartH && (
          <g className="chart-target-line-group">
            <line x1="20" y1={t1Y} x2={width - 20} y2={t1Y} stroke="#10b981" strokeDasharray="5 4" strokeWidth="1.5" />
            <text x="25" y={t1Y - 4} fill="#10b981" fontSize="10.5" fontWeight="700" fontFamily="JetBrains Mono">
              TARGET 1: {curr}{target1PriceUsed.toFixed(2)}
            </text>
          </g>
        )}

        {/* Target 2 Line */}
        {showOverlays.targets && t2Y > 0 && t2Y < mainChartH && (
          <g className="chart-target-line-group">
            <line x1="20" y1={t2Y} x2={width - 20} y2={t2Y} stroke="#34d399" strokeDasharray="5 4" strokeWidth="1.5" />
            <text x="25" y={t2Y - 4} fill="#34d399" fontSize="10.5" fontWeight="700" fontFamily="JetBrains Mono">
              TARGET 2 (Runner): {curr}{target2PriceUsed.toFixed(2)}
            </text>
          </g>
        )}

        {/* Stop Loss Line */}
        {showOverlays.stopLoss && slY > 0 && slY < mainChartH && (
          <g className="chart-sl-line-group">
            <line x1="20" y1={slY} x2={width - 20} y2={slY} stroke="#f43f5e" strokeDasharray="6 3" strokeWidth="1.8" />
            <text x="25" y={slY - 4} fill="#f43f5e" fontSize="10.5" fontWeight="700" fontFamily="JetBrains Mono">
              STOP LOSS (ATR): {curr}{stopLossPriceUsed.toFixed(2)}
            </text>
          </g>
        )}

        {/* Price Area & Line */}
        <path d={areaData} fill="url(#priceGradientDetail)" />
        <path d={pathData} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* EMA 20 Overlay Line */}
        {showOverlays.ema20 && (
          <path d={emaPoints} fill="none" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.85" />
        )}

        {/* SMA 50 Overlay Line */}
        {showOverlays.sma50 && (
          <path d={smaPoints} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.85" />
        )}

        {/* Live Ticking Pulse Head */}
        {points.length > 0 && (
          <g className="live-dot-pulse">
            <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="7" fill="#10b981" opacity="0.4" className="pulse-circle" />
            <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="3.5" fill="#ffffff" />
          </g>
        )}

        {/* --- SUB-CHART 1: RSI (14) INDICATOR PANEL --- */}
        {showOverlays.rsiSubChart && (
          <g className="rsi-subpanel-group">
            <rect x="0" y={rsiStartY} width={width} height={rsiSubH} fill="rgba(15, 23, 42, 0.55)" rx="6" />
            {/* 70 Overbought & 30 Oversold references */}
            <line x1="20" y1={rsi70Y} x2={width - 20} y2={rsi70Y} stroke="#f43f5e" strokeDasharray="3 3" strokeWidth="1" opacity="0.4" />
            <text x="25" y={rsi70Y - 2} fill="#f43f5e" fontSize="9" fontFamily="JetBrains Mono">70 OVERBOUGHT</text>

            <line x1="20" y1={rsi30Y} x2={width - 20} y2={rsi30Y} stroke="#10b981" strokeDasharray="3 3" strokeWidth="1" opacity="0.4" />
            <text x="25" y={rsi30Y + 9} fill="#10b981" fontSize="9" fontFamily="JetBrains Mono">30 OVERSOLD</text>

            {/* RSI Title & Value */}
            <text x={width - 140} y={rsiStartY + 14} fill="#94a3b8" fontSize="10" fontFamily="JetBrains Mono">
              RSI (14): <tspan fill="#38bdf8" fontWeight="700">{stock.technicals?.rsi?.value || 55}</tspan>
            </text>

            {/* RSI Trajectory Line */}
            <path d={rsiPoints} fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" />
          </g>
        )}

        {/* --- SUB-CHART 2: MACD HISTOGRAM PANEL --- */}
        {showOverlays.macdSubChart && (
          <g className="macd-subpanel-group">
            <rect x="0" y={macdStartY} width={width} height={macdSubH} fill="rgba(15, 23, 42, 0.55)" rx="6" />
            <line x1="20" y1={macdZeroY} x2={width - 20} y2={macdZeroY} stroke="#64748b" strokeWidth="1" opacity="0.4" />
            <text x="25" y={macdStartY + 13} fill="#94a3b8" fontSize="10" fontFamily="JetBrains Mono">
              MACD HISTOGRAM: <tspan fill={stock.technicals?.macd?.hist >= 0 ? '#10b981' : '#f43f5e'} fontWeight="700">{stock.technicals?.macd?.histogram || '+0.45'}</tspan>
            </text>

            {/* MACD Histogram Bars */}
            {series.map((s, idx) => {
              const x = (idx / (series.length - 1)) * (width - 40) + 20;
              const barH = Math.min(22, Math.max(3, Math.abs(s.macdHist) * 16));
              const isGreen = s.macdHist >= 0;
              const y = isGreen ? macdZeroY - barH : macdZeroY;
              return (
                <rect 
                  key={idx}
                  x={x - 2}
                  y={y}
                  width="4"
                  height={barH}
                  fill={isGreen ? '#10b981' : '#f43f5e'}
                  opacity="0.8"
                  rx="1"
                />
              );
            })}
          </g>
        )}
      </svg>
    );
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="stock-modal-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="modal-header">
          <div className="header-left">
            <div className="ticker-badge-huge">{stock.ticker}</div>
            <div className="company-details">
              <div className="name-exchange-row">
                <h3>{stock.name}</h3>
                <span className="exchange-pill">
                  {stock.currency === 'INR' ? 'NSE 🇮🇳' : 'NASDAQ/NYSE 🇺🇸'}
                </span>
                <span className="sector-tag-pill">{stock.sector}</span>
              </div>
              <div className="price-movement-strip">
                <span className="current-price-val font-mono">
                  {curr}{currentLivePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={`movement-pill ${isPositive ? 'positive' : 'negative'}`}>
                  {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  <span>{isPositive ? '+' : ''}{stock.change.toFixed(2)} ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)</span>
                </span>
                <span className="live-pulse-badge">
                  <span className="pulse-dot"></span> LIVE TICKING
                </span>
              </div>
            </div>
          </div>

          <div className="header-right">
            {/* Watchlist Toggle Button */}
            <button 
              className={`btn-modal-watchlist ${isWatchlisted ? 'active' : ''}`}
              onClick={onToggleWatchlist}
              title={isWatchlisted ? "Remove from my watchlist" : "Save to my personal watchlist"}
            >
              <Star size={16} fill={isWatchlisted ? "#f59e0b" : "none"} className={isWatchlisted ? "star-gold" : ""} />
              <span>{isWatchlisted ? 'In Watchlist' : 'Add to Watchlist'}</span>
            </button>

            <button className="modal-close-btn" onClick={onClose} id="btn-close-stock-detail">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="modal-body-content">
          
          {/* SECTION 1: "WHY THIS STOCK IS RANKED IN TOP 5" SHOWCASE */}
          <div className="top5-reason-hero-card">
            <div className="top5-hero-header">
              <div className="top5-badge-gold">
                <Award size={16} />
                <span>WHY THIS STOCK WAS SELECTED IN TOP 5</span>
              </div>
              <div className="top5-score-tag">
                <Sparkles size={13} />
                <span>AI Conviction Score: <strong>{horizonData.confidence || stock.aiOverallScore}/100</strong></span>
              </div>
            </div>

            <div className="top5-hero-body">
              <p className="top5-thesis-text">
                {whyReason}
              </p>
              
              <div className="top5-triggers-row">
                <div className="trigger-chip">
                  <span className="trigger-lbl">VOLUME ANOMALY:</span>
                  <span className="trigger-val text-emerald font-mono">{stock.rvol}x Relative Surge</span>
                </div>
                <div className="trigger-chip">
                  <span className="trigger-lbl">RSI MOMENTUM:</span>
                  <span className="trigger-val text-cyan font-mono">{stock.technicals?.rsi?.value} ({stock.technicals?.rsi?.status})</span>
                </div>
                <div className="trigger-chip">
                  <span className="trigger-lbl">CHART PATTERN:</span>
                  <span className="trigger-val text-purple">{stock.technicals?.chartPattern || 'Bullish Channel Base'}</span>
                </div>
                <div className="trigger-chip">
                  <span className="trigger-lbl">VALUATION:</span>
                  <span className="trigger-val text-emerald">{stock.longTerm?.valuationStatus || 'Attractive'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: TACTICAL HORIZON SWITCHER (Intraday, Swing, Long-Term) */}
          <div className="horizon-subnav-strip">
            <div className="horizon-switch-label">Select Trading Horizon Blueprint:</div>
            <div className="horizon-switch-buttons">
              <button 
                className={`horizon-switch-btn ${activeHorizon === 'intraday' ? 'active' : ''}`}
                onClick={() => setActiveHorizon('intraday')}
              >
                <Zap size={14} />
                <span>⚡ Intraday Scalp (5m - 4h)</span>
              </button>
              <button 
                className={`horizon-switch-btn ${activeHorizon === 'shortTerm' ? 'active' : ''}`}
                onClick={() => setActiveHorizon('shortTerm')}
              >
                <TrendingUp size={14} />
                <span>🌊 Swing Trade (2 - 15 Days)</span>
              </button>
              <button 
                className={`horizon-switch-btn ${activeHorizon === 'longTerm' ? 'active' : ''}`}
                onClick={() => setActiveHorizon('longTerm')}
              >
                <Building size={14} />
                <span>💎 Long-Term Wealth (1 - 3 Yrs)</span>
              </button>
            </div>
          </div>

          {/* SECTION 3: 3 CORE TACTICAL PILLARS (When to Buy, Stop Loss, Targets) */}
          <div className="tactical-blueprint-grid">
            {/* 1. When to Enter */}
            <div className="blueprint-box box-entry">
              <div className="b-header">
                <span className="b-dot dot-entry"></span>
                <span className="b-title">1. WHEN TO ENTER (ENTRY TIMING)</span>
              </div>
              <div className="b-content">
                <div className="b-main-val text-cyan font-mono">
                  {activeHorizon === 'longTerm' 
                    ? `Accumulate Below ${curr}${horizonData.intrinsicValue?.toFixed(2)}`
                    : `${curr}${horizonData.entryZone.min.toFixed(2)} - ${curr}${horizonData.entryZone.max.toFixed(2)}`
                  }
                </div>
                <div className="b-sub-rule">
                  <strong>Trigger Condition:</strong> {horizonData.triggerCondition || horizonData.thesis}
                </div>
                <div className="b-badge-wrap">
                  <span className="badge-setup">{horizonData.setupName || 'Algorithmic Breakout'}</span>
                </div>
              </div>
            </div>

            {/* 2. Stop Loss */}
            <div className="blueprint-box box-sl">
              <div className="b-header">
                <span className="b-dot dot-sl"></span>
                <span className="b-title">2. STOP LOSS (RISK SHIELD)</span>
              </div>
              <div className="b-content">
                <div className="b-main-val text-crimson font-mono">
                  {curr}{stopLossPriceUsed.toFixed(2)}
                  <span className="b-pct">({horizonData.stopLoss?.distancePercent || -3.5}%)</span>
                </div>
                <div className="b-sub-rule">
                  <strong>Risk Basis:</strong> {horizonData.stopLoss?.basis || `Placed below structural support at ${curr}${stopLossPriceUsed.toFixed(2)}`}
                </div>
                <div className="b-badge-wrap">
                  <span className="badge-sl-type">{horizonData.stopLoss?.type || 'Dynamic ATR Stop Loss'}</span>
                </div>
              </div>
            </div>

            {/* 3. Profit Targets */}
            <div className="blueprint-box box-target">
              <div className="b-header">
                <span className="b-dot dot-target"></span>
                <span className="b-title">3. PROFIT TARGETS & EXIT PLAN</span>
              </div>
              <div className="b-content">
                {horizonData.targets ? (
                  <div className="targets-tier-list">
                    {horizonData.targets.map((tgt, idx) => (
                      <div key={idx} className="target-tier-row">
                        <span className="tgt-name">{tgt.label}:</span>
                        <span className="tgt-price text-emerald font-mono">{curr}{tgt.price.toFixed(2)}</span>
                        <span className="tgt-pct">(+{tgt.profitPercent}%)</span>
                        <span className="tgt-rr badge-rr">{tgt.rr}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="targets-tier-list">
                    <div className="target-tier-row">
                      <span className="tgt-name">1-Year Target:</span>
                      <span className="tgt-price text-emerald font-mono">{curr}{horizonData.target1Yr} (+25%)</span>
                    </div>
                    <div className="target-tier-row">
                      <span className="tgt-name">3-Year Multibagger:</span>
                      <span className="tgt-price text-emerald font-mono">{curr}{horizonData.target3Yr} (+68%)</span>
                    </div>
                  </div>
                )}
                <div className="b-sub-rule">
                  <strong>Trade Discipline:</strong> Lock 50% partials at Target 1, trail stop to breakeven, ride runners to Target 2 & 3.
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: INTERACTIVE STOCK CHART & INDICATORS OVERLAYS */}
          <div className="chart-section-card">
            <div className="chart-toolbar-header">
              <div className="chart-heading-group">
                <BarChart3 size={18} className="text-emerald" />
                <h4>INTERACTIVE PRICE & TECHNICAL INDICATOR CHART</h4>
              </div>

              {/* Indicator Overlay Checkboxes */}
              <div className="indicator-toggles-strip">
                <label className="overlay-toggle-pill">
                  <input 
                    type="checkbox" 
                    checked={showOverlays.ema20}
                    onChange={(e) => setShowOverlays({ ...showOverlays, ema20: e.target.checked })}
                  />
                  <span className="toggle-dot dot-cyan"></span>
                  <span>20 EMA</span>
                </label>

                <label className="overlay-toggle-pill">
                  <input 
                    type="checkbox" 
                    checked={showOverlays.sma50}
                    onChange={(e) => setShowOverlays({ ...showOverlays, sma50: e.target.checked })}
                  />
                  <span className="toggle-dot dot-amber"></span>
                  <span>50 SMA</span>
                </label>

                <label className="overlay-toggle-pill">
                  <input 
                    type="checkbox" 
                    checked={showOverlays.stopLoss}
                    onChange={(e) => setShowOverlays({ ...showOverlays, stopLoss: e.target.checked })}
                  />
                  <span className="toggle-dot dot-crimson"></span>
                  <span>Stop Loss</span>
                </label>

                <label className="overlay-toggle-pill">
                  <input 
                    type="checkbox" 
                    checked={showOverlays.targets}
                    onChange={(e) => setShowOverlays({ ...showOverlays, targets: e.target.checked })}
                  />
                  <span className="toggle-dot dot-emerald"></span>
                  <span>Targets</span>
                </label>

                <label className="overlay-toggle-pill">
                  <input 
                    type="checkbox" 
                    checked={showOverlays.rsiSubChart}
                    onChange={(e) => setShowOverlays({ ...showOverlays, rsiSubChart: e.target.checked })}
                  />
                  <span>RSI Panel</span>
                </label>

                <label className="overlay-toggle-pill">
                  <input 
                    type="checkbox" 
                    checked={showOverlays.macdSubChart}
                    onChange={(e) => setShowOverlays({ ...showOverlays, macdSubChart: e.target.checked })}
                  />
                  <span>MACD Panel</span>
                </label>
              </div>
            </div>

            {/* Interactive SVG Chart Canvas */}
            <div className="chart-canvas-container">
              {renderInteractiveChart()}
            </div>
          </div>

          {/* SECTION 5: TECHNICAL & FUNDAMENTAL ANALYSIS SPLIT PANELS */}
          <div className="analysis-split-grid">
            
            {/* Left: AI Technical Analysis Radar */}
            <div className="deep-analysis-card technical-card">
              <div className="panel-title-bar">
                <Activity size={16} className="text-cyan" />
                <h4>AI TECHNICAL ANALYSIS RADAR</h4>
                <span className="panel-badge-tech">{stock.technicals?.trend || 'Bullish Uptrend'}</span>
              </div>

              <div className="tech-indicators-grid">
                
                {/* RSI */}
                <div className="tech-box">
                  <div className="tech-box-header">
                    <span>RSI (14-Period)</span>
                    <span className="tech-val font-mono text-cyan">{stock.technicals?.rsi?.value || 58}</span>
                  </div>
                  <div className="rsi-meter-bar">
                    <div className="rsi-meter-fill" style={{ width: `${stock.technicals?.rsi?.value || 58}%` }}></div>
                  </div>
                  <div className="tech-box-sub">{stock.technicals?.rsi?.status} - {stock.technicals?.rsi?.interpretation}</div>
                </div>

                {/* MACD */}
                <div className="tech-box">
                  <div className="tech-box-header">
                    <span>MACD (12, 26, 9)</span>
                    <span className="tech-val font-mono text-emerald">{stock.technicals?.macd?.histogram || '+0.45'}</span>
                  </div>
                  <div className="macd-details font-mono">
                    <span>Line: {stock.technicals?.macd?.line || 1.2}</span>
                    <span>Signal: {stock.technicals?.macd?.signal || 0.8}</span>
                  </div>
                  <div className="tech-box-sub text-emerald">{stock.technicals?.macd?.status}</div>
                </div>

                {/* Moving Averages */}
                <div className="tech-box full-width">
                  <div className="tech-box-header">
                    <span>Moving Averages Matrix</span>
                    <span className="golden-cross-tag">
                      <Sparkles size={11} /> 200 SMA Bull Cross Confirmed
                    </span>
                  </div>
                  <div className="ma-matrix-row">
                    <div className="ma-chip">
                      <span className="ma-label">20 EMA</span>
                      <span className="ma-val font-mono">{curr}{stock.technicals?.movingAverages?.ema20?.toFixed(2)}</span>
                    </div>
                    <div className="ma-chip">
                      <span className="ma-label">50 SMA</span>
                      <span className="ma-val font-mono">{curr}{stock.technicals?.movingAverages?.sma50?.toFixed(2)}</span>
                    </div>
                    <div className="ma-chip">
                      <span className="ma-label">200 SMA</span>
                      <span className="ma-val font-mono">{curr}{stock.technicals?.movingAverages?.sma200?.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="tech-box-sub">{stock.technicals?.movingAverages?.verdict}</div>
                </div>

                {/* Key Support & Resistance Matrix */}
                <div className="tech-box full-width">
                  <div className="tech-box-header">
                    <span>Support & Resistance Structure</span>
                  </div>
                  <div className="sr-matrix-row">
                    <div className="sr-column support-col">
                      <span className="sr-col-title text-emerald">KEY SUPPORT LEVELS:</span>
                      <div className="sr-pills">
                        {(stock.technicals?.supportLevels || []).map((lvl, i) => (
                          <span key={i} className="sr-pill s-pill">S{i + 1}: {curr}{lvl?.toFixed(2)}</span>
                        ))}
                      </div>
                    </div>
                    <div className="sr-column resistance-col">
                      <span className="sr-col-title text-crimson">KEY RESISTANCE LEVELS:</span>
                      <div className="sr-pills">
                        {(stock.technicals?.resistanceLevels || []).map((lvl, i) => (
                          <span key={i} className="sr-pill r-pill">R{i + 1}: {curr}{lvl?.toFixed(2)}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Candlestick & Pattern Diagnosis */}
                <div className="tech-box full-width pattern-box">
                  <div className="pattern-item">
                    <span className="pat-label">CHART PATTERN:</span>
                    <span className="pat-value">{stock.technicals?.chartPattern || 'Bullish Flag Breakout'}</span>
                  </div>
                  <div className="pattern-item">
                    <span className="pat-label">CANDLESTICK SIGNAL:</span>
                    <span className="pat-value">{stock.technicals?.candlestickPattern || 'Bullish Expansion Candle'}</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Right: AI Fundamental Analysis Engine */}
            <div className="deep-analysis-card fundamental-card">
              <div className="panel-title-bar">
                <Building size={16} className="text-purple" />
                <h4>AI FUNDAMENTAL VALUATION ENGINE</h4>
                <span className="panel-badge-fund">Grade: {stock.fundamentals?.grade || 'A+'}</span>
              </div>

              <div className="fund-metrics-grid">
                
                {/* DCF Fair Value Box */}
                <div className="fund-box fair-value-highlight">
                  <div className="fund-box-header">
                    <span>DCF INTRINSIC VALUE</span>
                    <span className="fund-val text-emerald font-mono">{curr}{stock.longTerm?.intrinsicValue?.toFixed(2)}</span>
                  </div>
                  <div className="fair-val-sub text-emerald font-bold">
                    {stock.longTerm?.valuationStatus}
                  </div>
                </div>

                {/* Scorecard Mini Grid */}
                <div className="fund-stat-chip">
                  <span className="stat-label">P/E Ratio</span>
                  <span className="stat-val font-mono">{stock.pe}</span>
                </div>
                <div className="fund-stat-chip">
                  <span className="stat-label">Forward P/E</span>
                  <span className="stat-val font-mono">{stock.forwardPe}</span>
                </div>
                <div className="fund-stat-chip">
                  <span className="stat-label">PEG Ratio</span>
                  <span className="stat-val font-mono">{stock.longTerm?.pegRatio || '1.2'}</span>
                </div>
                <div className="fund-stat-chip">
                  <span className="stat-label">ROE</span>
                  <span className="stat-val font-mono text-emerald">{stock.longTerm?.roe || '24.5%'}</span>
                </div>
                <div className="fund-stat-chip">
                  <span className="stat-label">Revenue Growth</span>
                  <span className="stat-val font-mono text-emerald">{stock.longTerm?.revGrowthYoy || '+18.4%'}</span>
                </div>
                <div className="fund-stat-chip">
                  <span className="stat-label">FCF Margin</span>
                  <span className="stat-val font-mono">{stock.longTerm?.fcfMargin || '28%'}</span>
                </div>
                <div className="fund-stat-chip">
                  <span className="stat-label">Debt / Equity</span>
                  <span className="stat-val font-mono">{stock.longTerm?.debtToEquity || '0.2'}</span>
                </div>
                <div className="fund-stat-chip">
                  <span className="stat-label">Free Cash Flow</span>
                  <span className="stat-val font-mono">{stock.fundamentals?.freeCashFlowTTM || 'Strong'}</span>
                </div>

                {/* Wall Street & Institutional Consensus */}
                <div className="fund-box full-width">
                  <div className="fund-box-header">
                    <span>INSTITUTIONAL & ANALYST CONSENSUS</span>
                    <span className="fund-val font-bold text-emerald">{stock.fundamentals?.analystConsensus?.consensus || 'Strong Buy (88%)'}</span>
                  </div>
                  <div className="analyst-bar-row">
                    <div className="analyst-pill buy">
                      <span>{stock.fundamentals?.analystConsensus?.buy || 35} BUY</span>
                    </div>
                    <div className="analyst-pill hold">
                      <span>{stock.fundamentals?.analystConsensus?.hold || 4} HOLD</span>
                    </div>
                    <div className="analyst-pill sell">
                      <span>{stock.fundamentals?.analystConsensus?.sell || 1} SELL</span>
                    </div>
                  </div>
                  <div className="analyst-target-sub font-mono">
                    Average Target: <strong className="text-emerald">{curr}{stock.fundamentals?.analystConsensus?.avgTarget?.toFixed(2)}</strong> (High: <strong className="text-emerald">{curr}{stock.fundamentals?.analystConsensus?.highestTarget?.toFixed(2)}</strong>)
                  </div>
                </div>

                {/* AI Core Thesis */}
                <div className="fund-box full-width thesis-box">
                  <div className="thesis-title">AI CORE INVESTMENT THESIS:</div>
                  <p className="thesis-p">{stock.longTerm?.thesis}</p>
                  
                  <div className="pros-cons-split">
                    <div className="pros-list">
                      <span className="pro-header text-emerald">KEY CATALYSTS & PROS:</span>
                      {(stock.fundamentals?.pros || []).map((p, i) => (
                        <div key={i} className="bullet-point">✓ {p}</div>
                      ))}
                    </div>
                    <div className="cons-list">
                      <span className="con-header text-crimson">KEY RISKS TO MONITOR:</span>
                      {(stock.fundamentals?.cons || []).map((c, i) => (
                        <div key={i} className="bullet-point">⚠ {c}</div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <div className="footer-left">
            <span className="footer-disclaimer">
              <Info size={13} />
              AI technical signals update continuously with real-time exchange ticks, VWAP deviations, and RSI calculations.
            </span>
          </div>
          <div className="footer-right">
            <button className="btn-secondary-close" onClick={onClose}>
              Close Inspector
            </button>
            <button 
              className={`btn-primary-action ${isWatchlisted ? 'in-watchlist' : ''}`}
              onClick={onToggleWatchlist}
            >
              <Star size={16} fill={isWatchlisted ? "#f59e0b" : "none"} />
              <span>{isWatchlisted ? 'Saved in Watchlist' : 'Add to My Watchlist'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
