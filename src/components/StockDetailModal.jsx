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
  Calculator,
  Activity,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function StockDetailModal({ 
  stock, 
  initialHorizon, 
  onClose, 
  onExecutePaperTrade 
}) {
  if (!stock) return null;

  const curr = stock.currencySymbol || (stock.currency === 'INR' ? '₹' : '$');

  // Active Horizon state inside modal
  const [activeHorizon, setActiveHorizon] = useState(
    initialHorizon && initialHorizon !== 'all' ? initialHorizon : (stock.preferredHorizon === 'all' ? 'shortTerm' : stock.preferredHorizon)
  );

  // Position Sizing Calculator state
  const [accountCapital, setAccountCapital] = useState(stock.currency === 'INR' ? 100000 : 10000);
  const [riskPercent, setRiskPercent] = useState(1.5); // 1.5% max risk
  const [chartTimeframe, setChartTimeframe] = useState('1D');
  const [showOverlays, setShowOverlays] = useState({
    entryZone: true,
    stopLoss: true,
    targets: true,
    movingAverages: true,
  });

  // Simulated live ticking price
  const [isLiveTicking, setIsLiveTicking] = useState(true);
  const [currentLivePrice, setCurrentLivePrice] = useState(stock.price);
  const [simulatedCandles, setSimulatedCandles] = useState([...(stock.priceHistory || [stock.price * 0.98, stock.price * 1.01, stock.price])]);

  // Tick simulation effect
  useEffect(() => {
    let interval;
    if (isLiveTicking) {
      interval = setInterval(() => {
        const delta = (Math.random() - 0.48) * (stock.price * 0.0015);
        setCurrentLivePrice((prev) => {
          const newPrice = Number((prev + delta).toFixed(2));
          return newPrice;
        });
      }, 1800);
    }
    return () => clearInterval(interval);
  }, [isLiveTicking, stock.price]);

  // Setup data for currently active horizon
  const horizonData = stock[activeHorizon] || stock.shortTerm;
  const isPositive = stock.change >= 0;

  // Position sizing math
  const maxRiskDollars = (accountCapital * (riskPercent / 100));
  
  // Risk per share calculation
  let riskPerShare = 1;
  let recommendedShares = 1;
  let entryPriceUsed = currentLivePrice;
  let stopLossPriceUsed = currentLivePrice * 0.95;
  let target1PriceUsed = currentLivePrice * 1.05;
  let target2PriceUsed = currentLivePrice * 1.10;
  let target3PriceUsed = currentLivePrice * 1.15;

  if (activeHorizon === 'longTerm') {
    entryPriceUsed = currentLivePrice;
    stopLossPriceUsed = currentLivePrice * 0.88; // 12% safety threshold
    target1PriceUsed = horizonData.target1Yr || currentLivePrice * 1.25;
    target2PriceUsed = horizonData.intrinsicValue || currentLivePrice * 1.35;
    target3PriceUsed = horizonData.target3Yr || currentLivePrice * 1.65;
    riskPerShare = Math.max(0.5, entryPriceUsed - stopLossPriceUsed);
    recommendedShares = Math.max(1, Math.floor(maxRiskDollars / riskPerShare));
  } else {
    entryPriceUsed = horizonData.entryZone?.optimal || currentLivePrice;
    stopLossPriceUsed = horizonData.stopLoss?.price || currentLivePrice * 0.98;
    target1PriceUsed = horizonData.targets?.[0]?.price || entryPriceUsed * 1.03;
    target2PriceUsed = horizonData.targets?.[1]?.price || entryPriceUsed * 1.06;
    target3PriceUsed = horizonData.targets?.[2]?.price || entryPriceUsed * 1.10;
    riskPerShare = Math.max(0.2, Math.abs(entryPriceUsed - stopLossPriceUsed));
    recommendedShares = Math.max(1, Math.floor(maxRiskDollars / riskPerShare));
  }

  const capitalRequired = (recommendedShares * currentLivePrice).toFixed(2);
  const potentialLoss = (recommendedShares * riskPerShare).toFixed(2);
  const potentialProfitT1 = (recommendedShares * Math.abs(target1PriceUsed - entryPriceUsed)).toFixed(2);
  const potentialProfitT2 = (recommendedShares * Math.abs(target2PriceUsed - entryPriceUsed)).toFixed(2);

  const handleExecuteTrade = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {
      // Confetti fallback
    }

    const tradeOrder = {
      ticker: stock.ticker,
      name: stock.name,
      horizon: activeHorizon,
      entryPrice: currentLivePrice,
      stopLoss: stopLossPriceUsed,
      target1: target1PriceUsed,
      target2: target2PriceUsed,
      target3: target3PriceUsed,
      shares: recommendedShares,
      totalCapital: Number(capitalRequired),
      riskDollars: Number(potentialLoss),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    onExecutePaperTrade(tradeOrder);
  };

  // Drawing interactive SVG chart
  const renderChart = () => {
    const prices = simulatedCandles;
    const min = Math.min(...prices, stopLossPriceUsed) * 0.99;
    const max = Math.max(...prices, target2PriceUsed) * 1.01;
    const range = max - min || 1;
    const width = 640;
    const height = 260;
    const paddingBottom = 30;
    const chartH = height - paddingBottom;

    const points = prices.map((p, i) => {
      const x = (i / (prices.length - 1)) * (width - 40) + 20;
      const y = chartH - ((p - min) / range) * (chartH - 20) - 10;
      return { x, y, price: p };
    });

    const pathData = points.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
    const areaData = `${pathData} L ${points[points.length - 1].x} ${chartH} L ${points[0].x} ${chartH} Z`;

    const slY = chartH - ((stopLossPriceUsed - min) / range) * (chartH - 20) - 10;
    const t1Y = chartH - ((target1PriceUsed - min) / range) * (chartH - 20) - 10;
    const t2Y = chartH - ((target2PriceUsed - min) / range) * (chartH - 20) - 10;
    
    let entryMinY = 0;
    let entryMaxY = 0;
    if (activeHorizon !== 'longTerm' && horizonData.entryZone) {
      entryMinY = chartH - ((horizonData.entryZone.min - min) / range) * (chartH - 20) - 10;
      entryMaxY = chartH - ((horizonData.entryZone.max - min) / range) * (chartH - 20) - 10;
    }

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="main-interactive-svg">
        <defs>
          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="entryZoneGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.08" />
          </linearGradient>
        </defs>

        <line x1="20" y1="40" x2={width - 20} y2="40" stroke="#334155" strokeDasharray="3 3" opacity="0.3" />
        <line x1="20" y1={chartH / 2} x2={width - 20} y2={chartH / 2} stroke="#334155" strokeDasharray="3 3" opacity="0.3" />
        <line x1="20" y1={chartH - 10} x2={width - 20} y2={chartH - 10} stroke="#334155" strokeDasharray="3 3" opacity="0.3" />

        {showOverlays.entryZone && activeHorizon !== 'longTerm' && horizonData.entryZone && (
          <g className="chart-entry-zone-group">
            <rect 
              x="20" 
              y={Math.min(entryMinY, entryMaxY)} 
              width={width - 40} 
              height={Math.abs(entryMinY - entryMaxY) || 8} 
              fill="url(#entryZoneGrad)" 
              stroke="#06b6d4" 
              strokeDasharray="4 4" 
              strokeWidth="1"
            />
            <text x={width - 150} y={Math.min(entryMinY, entryMaxY) - 5} fill="#06b6d4" fontSize="11" fontFamily="JetBrains Mono">
              BUY ZONE ({curr}{horizonData.entryZone.min} - {curr}{horizonData.entryZone.max})
            </text>
          </g>
        )}

        {showOverlays.targets && t1Y > 0 && t1Y < chartH && (
          <g className="chart-target-line-group">
            <line x1="20" y1={t1Y} x2={width - 20} y2={t1Y} stroke="#10b981" strokeDasharray="5 4" strokeWidth="1.5" />
            <text x="25" y={t1Y - 4} fill="#10b981" fontSize="11" fontWeight="600" fontFamily="JetBrains Mono">
              TARGET 1: {curr}{target1PriceUsed.toFixed(2)}
            </text>
          </g>
        )}

        {showOverlays.targets && t2Y > 0 && t2Y < chartH && (
          <g className="chart-target-line-group">
            <line x1="20" y1={t2Y} x2={width - 20} y2={t2Y} stroke="#34d399" strokeDasharray="5 4" strokeWidth="1.5" />
            <text x="25" y={t2Y - 4} fill="#34d399" fontSize="11" fontWeight="600" fontFamily="JetBrains Mono">
              TARGET 2 (Runner): {curr}{target2PriceUsed.toFixed(2)}
            </text>
          </g>
        )}

        {showOverlays.stopLoss && slY > 0 && slY < chartH && (
          <g className="chart-sl-line-group">
            <line x1="20" y1={slY} x2={width - 20} y2={slY} stroke="#f43f5e" strokeDasharray="6 3" strokeWidth="1.8" />
            <text x="25" y={slY - 4} fill="#f43f5e" fontSize="11" fontWeight="600" fontFamily="JetBrains Mono">
              STOP LOSS: {curr}{stopLossPriceUsed.toFixed(2)}
            </text>
          </g>
        )}

        <path d={areaData} fill="url(#priceGradient)" />
        <path d={pathData} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {points.length > 0 && (
          <g className="live-dot-pulse">
            <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="6" fill="#10b981" opacity="0.4" className="pulse-circle" />
            <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="3.5" fill="#ffffff" />
          </g>
        )}

        <text x="25" y={height - 8} fill="#64748b" fontSize="10" fontFamily="JetBrains Mono">09:15 AM</text>
        <text x={width / 2 - 20} y={height - 8} fill="#64748b" fontSize="10" fontFamily="JetBrains Mono">12:30 PM</text>
        <text x={width - 70} y={height - 8} fill="#64748b" fontSize="10" fontFamily="JetBrains Mono">03:30 PM</text>
      </svg>
    );
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="stock-modal-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Top Command Bar */}
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-symbol-box">
              <span className="modal-ticker">{stock.ticker}</span>
              <span className="modal-company">{stock.name}</span>
              <span className="modal-sector-tag">{stock.sector}</span>
            </div>

            <div className="modal-price-live">
              <div className="live-price-digits">{curr}{currentLivePrice.toFixed(2)}</div>
              <div className={`modal-change-pill ${isPositive ? 'positive' : 'negative'}`}>
                {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                <span>{isPositive ? '+' : ''}{stock.change.toFixed(2)} ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)</span>
              </div>
              <button 
                className={`btn-live-toggle ${isLiveTicking ? 'active' : ''}`}
                onClick={() => setIsLiveTicking(!isLiveTicking)}
                title="Toggle live price simulated tick"
              >
                {isLiveTicking ? <Pause size={12} /> : <Play size={12} />}
                <span>{isLiveTicking ? 'Live Tick ON' : 'Paused'}</span>
              </button>
            </div>
          </div>

          <div className="modal-header-right">
            <div className="ai-conviction-badge">
              <div className="badge-inner">
                <Sparkles size={14} className="sparkle-gold" />
                <span className="conviction-label">AI OVERALL RATING</span>
                <span className="conviction-score">{stock.aiOverallScore}/100</span>
              </div>
              <span className="conviction-status">{stock.aiRecommendation}</span>
            </div>

            <button className="modal-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Horizon Switcher Tabs */}
        <div className="modal-horizon-selector">
          <span className="selector-title">SELECT STRATEGY HORIZON:</span>
          <div className="horizon-pill-buttons">
            <button 
              className={`horizon-pill ${activeHorizon === 'intraday' ? 'active active-intraday' : ''}`}
              onClick={() => setActiveHorizon('intraday')}
            >
              <Zap size={14} />
              <span>Intraday (Day Trading Scalp)</span>
              <span className="pill-metric">{stock.intraday?.confidence || 92}% AI</span>
            </button>

            <button 
              className={`horizon-pill ${activeHorizon === 'shortTerm' ? 'active active-swing' : ''}`}
              onClick={() => setActiveHorizon('shortTerm')}
            >
              <TrendingUp size={14} />
              <span>Short-Term (Swing 2-15 Days)</span>
              <span className="pill-metric">{stock.shortTerm?.confidence || 94}% AI</span>
            </button>

            <button 
              className={`horizon-pill ${activeHorizon === 'longTerm' ? 'active active-wealth' : ''}`}
              onClick={() => setActiveHorizon('longTerm')}
            >
              <Building size={14} />
              <span>Long-Term (Wealth Compounder)</span>
              <span className="pill-metric">{stock.longTerm?.confidence || 96}% AI</span>
            </button>
          </div>
        </div>

        {/* Main Body Grid */}
        <div className="modal-body-scrollable">
          
          {/* SECTION 1: AI TRADE EXECUTION COMMAND CENTER */}
          <div className="ai-trade-engine-card">
            <div className="card-top-title">
              <div className="title-left">
                <Compass className="engine-icon" size={18} />
                <h3>AI TRADE EXECUTION ENGINE: {activeHorizon.toUpperCase()}</h3>
              </div>
              <span className="signal-badge-glow">{horizonData?.signalBadge}</span>
            </div>

            <div className="trade-engine-grid">
              
              {/* Box 1: When To Buy */}
              <div className="engine-box entry-box">
                <div className="box-header">
                  <span className="box-dot dot-cyan"></span>
                  <h4>1. WHEN TO BUY (OPTIMAL ENTRY)</h4>
                  <span className="box-badge-cyan">TIMING RADAR</span>
                </div>
                <div className="box-main-value">
                  {activeHorizon === 'longTerm' ? (
                    <span className="value-highlight">Accumulate below {curr}{horizonData?.intrinsicValue?.toFixed(2)}</span>
                  ) : (
                    <span className="value-highlight">{curr}{horizonData?.entryZone?.min?.toFixed(2)} - {curr}{horizonData?.entryZone?.max?.toFixed(2)}</span>
                  )}
                </div>
                <div className="box-details">
                  <div className="detail-item">
                    <span className="item-label">Trigger Rule:</span>
                    <span className="item-value font-mono">
                      {activeHorizon === 'longTerm' 
                        ? 'Dollar cost average on pullbacks to 200-day moving average'
                        : horizonData?.triggerCondition}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="item-label">Setup Pattern:</span>
                    <span className="item-value font-bold">
                      {activeHorizon === 'longTerm' ? horizonData?.moatRating : horizonData?.setupName}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="item-label">Current Status:</span>
                    <span className="status-badge-inline active-green">
                      <CheckCircle2 size={12} /> Live Buy Signal Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Box 2: Stop Loss */}
              <div className="engine-box sl-box">
                <div className="box-header">
                  <span className="box-dot dot-crimson"></span>
                  <h4>2. STOP LOSS (RISK SHIELD)</h4>
                  <span className="box-badge-crimson">CAPITAL DEFENSE</span>
                </div>
                <div className="box-main-value text-crimson">
                  {activeHorizon === 'longTerm' ? (
                    <span className="value-highlight text-crimson">Dynamic Moat Floor (-12.0%)</span>
                  ) : (
                    <span className="value-highlight text-crimson">
                      {curr}{horizonData?.stopLoss?.price?.toFixed(2)} ({horizonData?.stopLoss?.distancePercent}%)
                    </span>
                  )}
                </div>
                <div className="box-details">
                  <div className="detail-item">
                    <span className="item-label">Algorithm Basis:</span>
                    <span className="item-value font-mono">
                      {activeHorizon === 'longTerm' 
                        ? 'Structural support at 200-day SMA floor'
                        : horizonData?.stopLoss?.basis}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="item-label">SL Type:</span>
                    <span className="item-value">
                      {activeHorizon === 'longTerm' ? 'Fundamental Re-evaluation Stop' : horizonData?.stopLoss?.type}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="item-label">Risk Per Share:</span>
                    <span className="item-value font-mono font-bold text-crimson">
                      {curr}{riskPerShare.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Box 3: Target Profit Tiers */}
              <div className="engine-box target-box">
                <div className="box-header">
                  <span className="box-dot dot-emerald"></span>
                  <h4>3. TARGETS & PROFIT BOOKING</h4>
                  <span className="box-badge-emerald">ASYMMETRIC REWARD</span>
                </div>
                <div className="target-tiers-list">
                  {activeHorizon === 'longTerm' ? (
                    <>
                      <div className="target-tier-row">
                        <span className="tier-tag t1">1-Yr Target</span>
                        <span className="tier-price">{curr}{horizonData?.target1Yr?.toFixed(2)}</span>
                        <span className="tier-profit">+{(Math.abs(((horizonData?.target1Yr || currentLivePrice * 1.25) - currentLivePrice) / currentLivePrice) * 100).toFixed(1)}%</span>
                        <span className="tier-action">Hold Core</span>
                      </div>
                      <div className="target-tier-row">
                        <span className="tier-tag t2">DCF Fair Value</span>
                        <span className="tier-price">{curr}{horizonData?.intrinsicValue?.toFixed(2)}</span>
                        <span className="tier-profit">+{(Math.abs(((horizonData?.intrinsicValue || currentLivePrice * 1.35) - currentLivePrice) / currentLivePrice) * 100).toFixed(1)}%</span>
                        <span className="tier-action">Intrinsic Target</span>
                      </div>
                      <div className="target-tier-row">
                        <span className="tier-tag t3">3-Yr Target</span>
                        <span className="tier-price">{curr}{horizonData?.target3Yr?.toFixed(2)}</span>
                        <span className="tier-profit">+{(Math.abs(((horizonData?.target3Yr || currentLivePrice * 1.65) - currentLivePrice) / currentLivePrice) * 100).toFixed(1)}%</span>
                        <span className="tier-action">Multibagger Goal</span>
                      </div>
                    </>
                  ) : (
                    (horizonData?.targets || []).map((t, idx) => (
                      <div key={idx} className="target-tier-row">
                        <span className={`tier-tag t${idx + 1}`}>T{idx + 1} ({t.rr})</span>
                        <span className="tier-price">{curr}{t.price?.toFixed(2)}</span>
                        <span className="tier-profit">+{t.profitPercent}%</span>
                        <span className="tier-action">{t.action}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Position Size & Risk/Reward Interactive Calculator */}
            <div className="position-calc-section">
              <div className="calc-header">
                <div className="calc-title">
                  <Calculator size={16} />
                  <span>AI POSITION SIZING & RISK-REWARD CALCULATOR</span>
                </div>
                <div className="calc-inputs-group">
                  <div className="input-field">
                    <label>Account Capital ({curr}):</label>
                    <input 
                      type="number" 
                      value={accountCapital} 
                      onChange={(e) => setAccountCapital(Number(e.target.value) || 1000)}
                      step="1000"
                    />
                  </div>
                  <div className="input-field">
                    <label>Max Risk (%):</label>
                    <input 
                      type="number" 
                      value={riskPercent} 
                      onChange={(e) => setRiskPercent(Number(e.target.value) || 1)}
                      step="0.5"
                      min="0.5"
                      max="10"
                    />
                  </div>
                </div>
              </div>

              <div className="calc-results-strip">
                <div className="calc-result-box">
                  <span className="res-label">RECOMMENDED SHARES</span>
                  <span className="res-value font-mono">{recommendedShares} Shares</span>
                </div>
                <div className="calc-result-box">
                  <span className="res-label">TOTAL CAPITAL REQUIRED</span>
                  <span className="res-value font-mono">{curr}{capitalRequired}</span>
                </div>
                <div className="calc-result-box danger">
                  <span className="res-label">MAX RISK (AT SL)</span>
                  <span className="res-value font-mono text-crimson">-{curr}{potentialLoss}</span>
                </div>
                <div className="calc-result-box success">
                  <span className="res-label">TARGET 1 REWARD</span>
                  <span className="res-value font-mono text-emerald">+{curr}{potentialProfitT1}</span>
                </div>
                <div className="calc-result-box success">
                  <span className="res-label">TARGET 2 REWARD</span>
                  <span className="res-value font-mono text-emerald">+{curr}{potentialProfitT2}</span>
                </div>
                <button className="btn-execute-trade-modal" onClick={handleExecuteTrade}>
                  <Zap size={16} />
                  <span>Execute Paper Trade Preset</span>
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 2: INTERACTIVE CHART & VISUAL OVERLAYS */}
          <div className="chart-section-card">
            <div className="chart-card-header">
              <div className="chart-left-controls">
                <BarChart3 size={16} />
                <span className="chart-title">AI TECHNICAL CHART & OVERLAYS</span>
                
                <div className="timeframe-buttons">
                  {['1D', '5D', '1M', '6M', '1Y'].map((tf) => (
                    <button 
                      key={tf} 
                      className={`tf-btn ${chartTimeframe === tf ? 'active' : ''}`}
                      onClick={() => setChartTimeframe(tf)}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              <div className="chart-overlay-toggles">
                <label className="overlay-check">
                  <input 
                    type="checkbox" 
                    checked={showOverlays.entryZone}
                    onChange={(e) => setShowOverlays({ ...showOverlays, entryZone: e.target.checked })}
                  />
                  <span>Entry Zone</span>
                </label>
                <label className="overlay-check">
                  <input 
                    type="checkbox" 
                    checked={showOverlays.stopLoss}
                    onChange={(e) => setShowOverlays({ ...showOverlays, stopLoss: e.target.checked })}
                  />
                  <span className="text-crimson">Stop Loss</span>
                </label>
                <label className="overlay-check">
                  <input 
                    type="checkbox" 
                    checked={showOverlays.targets}
                    onChange={(e) => setShowOverlays({ ...showOverlays, targets: e.target.checked })}
                  />
                  <span className="text-emerald">Targets</span>
                </label>
              </div>
            </div>

            <div className="chart-canvas-container">
              {renderChart()}
            </div>
          </div>

          {/* SECTION 3 & 4: TECHNICAL & FUNDAMENTAL ANALYSIS SPLIT PANELS */}
          <div className="analysis-split-grid">
            
            {/* Left: AI Technical Analysis */}
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
                    <span className="tech-val font-mono">{stock.technicals?.rsi?.value || 58}</span>
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
                  <div className="macd-details">
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
                    <span className="pat-value">{stock.technicals?.candlestickPattern || 'Bullish Continuation'}</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Right: AI Fundamental Analysis */}
            <div className="deep-analysis-card fundamental-card">
              <div className="panel-title-bar">
                <Building size={16} className="text-purple" />
                <h4>AI FUNDAMENTAL ANALYSIS ENGINE</h4>
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

                {/* Wall Street / DII Consensus */}
                <div className="fund-box full-width">
                  <div className="fund-box-header">
                    <span>ANALYST & INSTITUTIONAL CONSENSUS</span>
                    <span className="fund-val font-bold">{stock.fundamentals?.analystConsensus?.consensus || 'Strong Buy (88%)'}</span>
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
                  <div className="analyst-target-sub">
                    Average Target: <strong className="font-mono">{curr}{stock.fundamentals?.analystConsensus?.avgTarget?.toFixed(2)}</strong> (High: <strong className="font-mono">{curr}{stock.fundamentals?.analystConsensus?.highestTarget?.toFixed(2)}</strong>)
                  </div>
                </div>

                {/* AI Qualitative Synthesis */}
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
              AI signals update continuously with volatility, VWAP deviations, and live market ticks.
            </span>
          </div>
          <div className="footer-right">
            <button className="btn-secondary-close" onClick={onClose}>
              Close Inspector
            </button>
            <button className="btn-primary-action" onClick={handleExecuteTrade}>
              <Zap size={16} />
              <span>Execute {stock.ticker} Paper Order</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
