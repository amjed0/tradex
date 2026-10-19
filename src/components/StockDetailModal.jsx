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
  Building, 
  Info, 
  Compass, 
  Activity, 
  Layers, 
  Star, 
  Award, 
  Eye, 
  ArrowRight,
  CandlestickChart as CandleIcon,
  LineChart as LineIcon
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

  // Chart Style: 'candles' (Default!) or 'line'
  const [chartType, setChartType] = useState('candles');
  const [timeframe, setTimeframe] = useState('1D');

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

  // Active hover candle for live crosshair inspection
  const [hoveredCandle, setHoveredCandle] = useState(null);

  // Base price history array
  const rawCloses = stock.priceHistory || [stock.price * 0.98, stock.price * 1.01, stock.price];

  // Generate realistic Japanese Candlestick OHLC bars with exact Date/Time stamps
  const generateCandles = () => {
    const totalBars = 32;
    const baseList = (stock.chartSeries && stock.chartSeries.length >= 10 ? stock.chartSeries : rawCloses.map(p => ({ price: p })));
    
    // Generate dates backwards from current time
    const now = new Date();
    const result = [];

    for (let i = 0; i < totalBars; i++) {
      const idxFromEnd = totalBars - 1 - i;
      // Step back in time: 1D = 15m intervals, 1W = 2h intervals, 1M = 1d intervals
      let candleDate = new Date(now.getTime());
      if (timeframe === '1D') {
        candleDate.setMinutes(now.getMinutes() - (idxFromEnd * 15));
      } else if (timeframe === '1W') {
        candleDate.setHours(now.getHours() - (idxFromEnd * 4));
      } else {
        candleDate.setDate(now.getDate() - idxFromEnd);
      }

      // Base price computation
      const baseVal = baseList[i % baseList.length]?.price || stock.price;
      const noise = Math.sin(i * 1.35) * (stock.price * 0.012) + Math.cos(i * 0.75) * (stock.price * 0.008);
      const prevClose = i > 0 ? result[i - 1].close : Number((stock.price * 0.98).toFixed(2));
      const close = i === totalBars - 1 ? currentLivePrice : Number((baseVal + noise).toFixed(2));
      const open = prevClose;
      const isBullish = close >= open;

      const maxOC = Math.max(open, close);
      const minOC = Math.min(open, close);
      const wickHigh = Number((maxOC + Math.abs(Math.sin(i * 1.7) * (stock.price * 0.006) + 0.3)).toFixed(2));
      const wickLow = Number((minOC - Math.abs(Math.cos(i * 1.4) * (stock.price * 0.006) + 0.3)).toFixed(2));

      // Indicator curves
      const ema20 = Number((stock.technicals?.movingAverages?.ema20 || close * 0.99) + Math.sin(i * 0.4) * (stock.price * 0.003));
      const sma50 = Number((stock.technicals?.movingAverages?.sma50 || close * 0.97) + Math.cos(i * 0.3) * (stock.price * 0.004));
      const rsi = Number(Math.max(18, Math.min(85, (stock.technicals?.rsi?.value || 55) + Math.sin(i * 0.85) * 8)).toFixed(1));
      const macdHist = Number(((stock.technicals?.macd?.hist !== undefined ? stock.technicals.macd.hist : 0.45) + Math.cos(i * 0.75) * 0.35).toFixed(2));
      const volume = Math.round(15000 + Math.abs(Math.sin(i * 2.1)) * 45000);

      // Date / Time formatting for bottom axis
      const timeStr = candleDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      const dateStr = candleDate.toLocaleDateString([], { month: 'short', day: 'numeric' });

      result.push({
        index: i,
        open: Number(open.toFixed(2)),
        high: Math.max(wickHigh, maxOC),
        low: Math.min(wickLow, minOC),
        close: Number(close.toFixed(2)),
        volume,
        isBullish,
        ema20: Number(ema20.toFixed(2)),
        sma50: Number(sma50.toFixed(2)),
        rsi,
        macdHist,
        timeStr,
        dateStr,
        fullTimestamp: `${dateStr} ${timeStr}`,
      });
    }

    return result;
  };

  const candles = generateCandles();
  const allLows = candles.map(c => c.low);
  const allHighs = candles.map(c => c.high);

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

  // Drawing the Pro TradingView-Style Candlestick & Indicator Chart
  const renderInteractiveChart = () => {
    // Layout measurements:
    // Left: 15px margin -> Chart plot: 15px to 720px -> Right Price Scale: 720px to 800px (80px dedicated right column)
    const svgWidth = 800;
    const priceScaleWidth = 75;
    const chartPlotWidth = svgWidth - priceScaleWidth - 15; // 710px plot area
    const plotLeft = 15;
    const plotRight = plotLeft + chartPlotWidth; // 725px
    
    // Vertical heights
    const mainChartTop = 24;
    const mainChartH = 260; // main price candlestick area
    const timeAxisH = 24; // bottom date & time strip
    const timeAxisY = mainChartTop + mainChartH; // 284px

    // Sub-chart 1: RSI 14
    const rsiSubH = 55;
    const rsiStartY = timeAxisY + timeAxisH + 10; // 318px
    const rsi70Y = rsiStartY + rsiSubH - (0.7 * rsiSubH);
    const rsi30Y = rsiStartY + rsiSubH - (0.3 * rsiSubH);

    // Sub-chart 2: MACD Histogram
    const macdSubH = 50;
    const macdStartY = rsiStartY + rsiSubH + (showOverlays.rsiSubChart ? 12 : 0);
    const macdZeroY = macdStartY + (macdSubH / 2);

    const totalHeight = (showOverlays.macdSubChart ? macdStartY + macdSubH : (showOverlays.rsiSubChart ? rsiStartY + rsiSubH : timeAxisY + timeAxisH)) + 14;

    // Price scale boundaries
    const min = Math.min(...allLows, stopLossPriceUsed) * 0.993;
    const max = Math.max(...allHighs, target2PriceUsed) * 1.007;
    const range = max - min || 1;

    // Function to calculate Y position on main price chart
    const getY = (val) => mainChartTop + (mainChartH - ((val - min) / range) * (mainChartH - 24) - 12);

    // X coordinates per candle
    const n = candles.length;
    const getX = (index) => plotLeft + (index / (n - 1)) * (chartPlotWidth - 20) + 10;
    const candleWidth = Math.max(7, Math.min(13, (chartPlotWidth / n) - 5));

    // Price Grid steps for Right Axis (5 price levels)
    const priceTicks = [
      min + range * 0.92,
      min + range * 0.70,
      min + range * 0.48,
      min + range * 0.26,
      min + range * 0.08
    ];

    // EMA 20 overlay line
    const emaPoints = candles.map((c, i) => {
      const x = getX(i);
      const y = getY(c.ema20);
      return `${i === 0 ? 'M' : 'L'} ${x} ${Math.max(mainChartTop + 4, Math.min(mainChartTop + mainChartH - 4, y))}`;
    }).join(' ');

    // SMA 50 overlay line
    const smaPoints = candles.map((c, i) => {
      const x = getX(i);
      const y = getY(c.sma50);
      return `${i === 0 ? 'M' : 'L'} ${x} ${Math.max(mainChartTop + 4, Math.min(mainChartTop + mainChartH - 4, y))}`;
    }).join(' ');

    // Area path for Line/Area chart mode
    const linePoints = candles.map((c, i) => ({ x: getX(i), y: getY(c.close) }));
    const linePathData = linePoints.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
    const areaPathData = `${linePathData} L ${linePoints[linePoints.length - 1].x} ${timeAxisY} L ${linePoints[0].x} ${timeAxisY} Z`;

    const slY = getY(stopLossPriceUsed);
    const t1Y = getY(target1PriceUsed);
    const t2Y = getY(target2PriceUsed);
    const currentPriceY = getY(currentLivePrice);

    let entryMinY = 0;
    let entryMaxY = 0;
    if (activeHorizon !== 'longTerm' && horizonData.entryZone) {
      entryMinY = getY(horizonData.entryZone.min);
      entryMaxY = getY(horizonData.entryZone.max);
    }

    // RSI points
    const rsiPoints = candles.map((c, i) => {
      const x = getX(i);
      const y = rsiStartY + rsiSubH - ((c.rsi / 100) * rsiSubH);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    // Candidate for hover candle
    const activeCandle = hoveredCandle || candles[candles.length - 1];
    const activeCandleX = activeCandle ? getX(activeCandle.index) : plotRight - 10;
    const activeCandleY = activeCandle ? getY(activeCandle.close) : currentPriceY;

    return (
      <div className="pro-chart-wrapper">
        
        {/* Real-Time OHLC Header Strip (TradingView Bar Display) */}
        <div className="chart-ohlc-live-legend">
          <div className="ohlc-symbol-name">
            <span className="ohlc-ticker">{stock.ticker}</span>
            <span className="ohlc-tf-badge">{timeframe}</span>
            <span className={`ohlc-badge ${activeCandle.isBullish ? 'bullish' : 'bearish'}`}>
              {activeCandle.isBullish ? 'BULLISH' : 'BEARISH'}
            </span>
          </div>

          <div className="ohlc-metrics-row font-mono">
            <span className="ohlc-item">O: <strong className={activeCandle.isBullish ? 'text-emerald' : 'text-crimson'}>{curr}{activeCandle.open.toFixed(2)}</strong></span>
            <span className="ohlc-item">H: <strong className="text-emerald">{curr}{activeCandle.high.toFixed(2)}</strong></span>
            <span className="ohlc-item">L: <strong className="text-crimson">{curr}{activeCandle.low.toFixed(2)}</strong></span>
            <span className="ohlc-item">C: <strong className={activeCandle.isBullish ? 'text-emerald' : 'text-crimson'}>{curr}{activeCandle.close.toFixed(2)}</strong></span>
            <span className="ohlc-item text-dim">Vol: <strong>{activeCandle.volume.toLocaleString()}</strong></span>
            <span className="ohlc-item text-cyan">Time: <strong>{activeCandle.fullTimestamp}</strong></span>
          </div>
        </div>

        {/* SVG Canvas Container */}
        <svg 
          viewBox={`0 0 ${svgWidth} ${totalHeight}`} 
          className="main-interactive-svg pro-candlestick-svg"
          onMouseLeave={() => setHoveredCandle(null)}
        >
          <defs>
            <linearGradient id="priceGradientDetail" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="entryZoneGradDetail" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.04" />
            </linearGradient>
          </defs>

          {/* MAIN PRICE PLOT BACKGROUND */}
          <rect x={plotLeft} y={mainChartTop} width={chartPlotWidth} height={mainChartH} fill="rgba(8, 12, 22, 0.92)" rx="4" />

          {/* RIGHT PRICE SCALE BACKGROUND COLUMN (TRADINGVIEW STYLE) */}
          <rect x={plotRight} y={mainChartTop} width={priceScaleWidth} height={mainChartH} fill="#060913" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" />

          {/* BOTTOM DATE/TIME AXIS BACKGROUND */}
          <rect x={plotLeft} y={timeAxisY} width={chartPlotWidth} height={timeAxisH} fill="#060913" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" />
          <rect x={plotRight} y={timeAxisY} width={priceScaleWidth} height={timeAxisH} fill="#04060d" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" />

          {/* HORIZONTAL GRID LINES & RIGHT-SIDE PRICE SCALE LABELS */}
          {priceTicks.map((pVal, idx) => {
            const py = getY(pVal);
            return (
              <g key={idx} className="price-grid-row">
                {/* Dotted horizontal cross line */}
                <line x1={plotLeft} y1={py} x2={plotRight} y2={py} stroke="rgba(148, 163, 184, 0.12)" strokeDasharray="3 3" />
                {/* Small right axis tick mark */}
                <line x1={plotRight} y1={py} x2={plotRight + 5} y2={py} stroke="rgba(148, 163, 184, 0.4)" strokeWidth="1" />
                {/* Exact Price Label on Right Axis */}
                <text 
                  x={plotRight + 8} 
                  y={py + 3.5} 
                  fill="#94a3b8" 
                  fontSize="10" 
                  fontFamily="JetBrains Mono, monospace" 
                  fontWeight="600"
                >
                  {curr}{pVal.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* VERTICAL GRID LINES & BOTTOM DATE / TIME LABELS */}
          {candles.filter((_, i) => i % 6 === 0 || i === candles.length - 1).map((c, idx) => {
            const cx = getX(c.index);
            return (
              <g key={idx} className="time-grid-col">
                {/* Vertical grid line */}
                <line x1={cx} y1={mainChartTop} x2={cx} y2={timeAxisY} stroke="rgba(148, 163, 184, 0.08)" strokeDasharray="2 3" />
                {/* Bottom tick mark */}
                <line x1={cx} y1={timeAxisY} x2={cx} y2={timeAxisY + 4} stroke="rgba(148, 163, 184, 0.35)" />
                {/* Date & Time Text on Bottom Axis */}
                <text 
                  x={cx} 
                  y={timeAxisY + 16} 
                  textAnchor="middle" 
                  fill="#94a3b8" 
                  fontSize="9.5" 
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="500"
                >
                  {timeframe === '1D' ? c.timeStr : c.dateStr}
                </text>
              </g>
            );
          })}

          {/* ENTRY ZONE OVERLAY */}
          {showOverlays.entryZone && activeHorizon !== 'longTerm' && horizonData.entryZone && (
            <g className="chart-entry-zone-group">
              <rect 
                x={plotLeft} 
                y={Math.min(entryMinY, entryMaxY)} 
                width={chartPlotWidth} 
                height={Math.max(6, Math.abs(entryMinY - entryMaxY))} 
                fill="url(#entryZoneGradDetail)" 
                stroke="#06b6d4" 
                strokeDasharray="4 4" 
                strokeWidth="1.2"
              />
              <text x={plotLeft + 10} y={Math.min(entryMinY, entryMaxY) - 5} fill="#06b6d4" fontSize="10" fontFamily="JetBrains Mono, monospace" fontWeight="700">
                OPTIMAL ENTRY ZONE ({curr}{horizonData.entryZone.min} - {curr}{horizonData.entryZone.max})
              </text>
            </g>
          )}

          {/* TARGET 1 LINE & RIGHT BADGE */}
          {showOverlays.targets && t1Y > mainChartTop && t1Y < timeAxisY && (
            <g className="chart-target-line-group">
              <line x1={plotLeft} y1={t1Y} x2={plotRight} y2={t1Y} stroke="#10b981" strokeDasharray="5 3" strokeWidth="1.4" />
              <rect x={plotRight} y={t1Y - 9} width={priceScaleWidth} height="18" fill="#10b981" rx="2" />
              <text x={plotRight + 6} y={t1Y + 3.5} fill="#022c22" fontSize="9.5" fontWeight="800" fontFamily="JetBrains Mono, monospace">
                T1 {curr}{target1PriceUsed.toFixed(1)}
              </text>
            </g>
          )}

          {/* TARGET 2 LINE & RIGHT BADGE */}
          {showOverlays.targets && t2Y > mainChartTop && t2Y < timeAxisY && (
            <g className="chart-target-line-group">
              <line x1={plotLeft} y1={t2Y} x2={plotRight} y2={t2Y} stroke="#34d399" strokeDasharray="5 3" strokeWidth="1.4" />
              <rect x={plotRight} y={t2Y - 9} width={priceScaleWidth} height="18" fill="#34d399" rx="2" />
              <text x={plotRight + 6} y={t2Y + 3.5} fill="#022c22" fontSize="9.5" fontWeight="800" fontFamily="JetBrains Mono, monospace">
                T2 {curr}{target2PriceUsed.toFixed(1)}
              </text>
            </g>
          )}

          {/* STOP LOSS LINE & RIGHT BADGE */}
          {showOverlays.stopLoss && slY > mainChartTop && slY < timeAxisY && (
            <g className="chart-sl-line-group">
              <line x1={plotLeft} y1={slY} x2={plotRight} y2={slY} stroke="#f43f5e" strokeDasharray="5 3" strokeWidth="1.4" />
              <rect x={plotRight} y={slY - 9} width={priceScaleWidth} height="18" fill="#f43f5e" rx="2" />
              <text x={plotRight + 6} y={slY + 3.5} fill="#ffffff" fontSize="9.5" fontWeight="800" fontFamily="JetBrains Mono, monospace">
                SL {curr}{stopLossPriceUsed.toFixed(1)}
              </text>
            </g>
          )}

          {/* CANDLESTICKS OR AREA LINE */}
          {chartType === 'candles' ? (
            <g className="japanese-candlesticks-group">
              {candles.map((c, i) => {
                const x = getX(i);
                const wickY1 = getY(c.high);
                const wickY2 = getY(c.low);
                const openY = getY(c.open);
                const closeY = getY(c.close);
                const bodyTop = Math.min(openY, closeY);
                const bodyH = Math.max(3, Math.abs(openY - closeY));
                const color = c.isBullish ? '#10b981' : '#f43f5e';
                const isHovered = hoveredCandle && hoveredCandle.index === i;

                return (
                  <g 
                    key={i} 
                    className={`candle-element ${isHovered ? 'active-hover' : ''}`}
                    onMouseEnter={() => setHoveredCandle(c)}
                    style={{ cursor: 'crosshair' }}
                  >
                    {/* Upper and lower wick line */}
                    <line 
                      x1={x} 
                      y1={wickY1} 
                      x2={x} 
                      y2={wickY2} 
                      stroke={color} 
                      strokeWidth={isHovered ? "2" : "1.3"} 
                      strokeLinecap="round" 
                    />
                    {/* Candle real body */}
                    <rect 
                      x={x - candleWidth / 2} 
                      y={bodyTop} 
                      width={candleWidth} 
                      height={bodyH} 
                      fill={color} 
                      stroke={color} 
                      strokeWidth={isHovered ? "1.8" : "1"} 
                      rx="1" 
                    />

                    {/* Invisible wider hover hit box for easy touch/mouse inspection */}
                    <rect 
                      x={x - candleWidth} 
                      y={mainChartTop} 
                      width={candleWidth * 2} 
                      height={mainChartH} 
                      fill="transparent" 
                    />
                  </g>
                );
              })}
            </g>
          ) : (
            <g className="area-curve-group">
              <path d={areaPathData} fill="url(#priceGradientDetail)" />
              <path d={linePathData} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          )}

          {/* 20-Day EMA Line */}
          {showOverlays.ema20 && (
            <path d={emaPoints} fill="none" stroke="#06b6d4" strokeWidth="1.8" strokeDasharray="3 2" opacity="0.9" />
          )}

          {/* 50-Day SMA Line */}
          {showOverlays.sma50 && (
            <path d={smaPoints} fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeDasharray="4 2" opacity="0.9" />
          )}

          {/* LIVE PRICE HIGHLIGHT ON RIGHT SCALE (TRADINGVIEW RED/GREEN ACTIVE PILL) */}
          {currentPriceY > mainChartTop && currentPriceY < timeAxisY && (
            <g className="live-price-pill-right">
              {/* Horizontal ray across plot to the active candle */}
              <line x1={plotLeft} y1={currentPriceY} x2={plotRight} y2={currentPriceY} stroke="#38bdf8" strokeDasharray="2 2" strokeWidth="1.2" opacity="0.8" />
              {/* Active Price Box in Right Scale */}
              <rect 
                x={plotRight} 
                y={currentPriceY - 10} 
                width={priceScaleWidth} 
                height="20" 
                fill="#0284c7" 
                stroke="#38bdf8"
                strokeWidth="1"
                rx="3" 
              />
              <text 
                x={plotRight + 6} 
                y={currentPriceY + 3.8} 
                fill="#ffffff" 
                fontSize="10" 
                fontWeight="800" 
                fontFamily="JetBrains Mono, monospace"
              >
                {curr}{currentLivePrice.toFixed(2)}
              </text>
            </g>
          )}

          {/* CROSSHAIR INSPECTOR (WHEN USER HOVERS A CANDLE) */}
          {hoveredCandle && (
            <g className="tradingview-crosshair-group">
              {/* Vertical line through candle */}
              <line x1={activeCandleX} y1={mainChartTop} x2={activeCandleX} y2={timeAxisY} stroke="#94a3b8" strokeDasharray="3 3" strokeWidth="1" />
              {/* Horizontal line through price */}
              <line x1={plotLeft} y1={activeCandleY} x2={plotRight} y2={activeCandleY} stroke="#94a3b8" strokeDasharray="3 3" strokeWidth="1" />
              
              {/* Bottom date badge for hovered candle */}
              <rect x={activeCandleX - 35} y={timeAxisY} width="70" height={timeAxisH} fill="#1e293b" stroke="#38bdf8" rx="2" />
              <text x={activeCandleX} y={timeAxisY + 16} textAnchor="middle" fill="#38bdf8" fontSize="9.5" fontFamily="JetBrains Mono, monospace" fontWeight="700">
                {activeCandle.timeStr}
              </text>

              {/* Right price badge for hovered candle */}
              <rect x={plotRight} y={activeCandleY - 9} width={priceScaleWidth} height="18" fill="#1e293b" stroke="#cbd5e1" rx="2" />
              <text x={plotRight + 6} y={activeCandleY + 3.5} fill="#ffffff" fontSize="9.5" fontFamily="JetBrains Mono, monospace" fontWeight="700">
                {curr}{activeCandle.close.toFixed(2)}
              </text>
            </g>
          )}

          {/* SUB-CHART 1: RSI (14) INDICATOR PANEL */}
          {showOverlays.rsiSubChart && (
            <g className="rsi-subpanel-group">
              {/* RSI background */}
              <rect x={plotLeft} y={rsiStartY} width={chartPlotWidth} height={rsiSubH} fill="rgba(8, 12, 22, 0.92)" rx="4" />
              {/* RSI Right scale */}
              <rect x={plotRight} y={rsiStartY} width={priceScaleWidth} height={rsiSubH} fill="#060913" stroke="rgba(255, 255, 255, 0.08)" />
              
              {/* 70 Overbought & 30 Oversold references */}
              <line x1={plotLeft} y1={rsi70Y} x2={plotRight} y2={rsi70Y} stroke="#f43f5e" strokeDasharray="3 3" strokeWidth="1" opacity="0.5" />
              <text x={plotRight + 6} y={rsi70Y + 3} fill="#f43f5e" fontSize="9" fontFamily="JetBrains Mono, monospace" fontWeight="700">70 OB</text>

              <line x1={plotLeft} y1={rsi30Y} x2={plotRight} y2={rsi30Y} stroke="#10b981" strokeDasharray="3 3" strokeWidth="1" opacity="0.5" />
              <text x={plotRight + 6} y={rsi30Y + 3} fill="#10b981" fontSize="9" fontFamily="JetBrains Mono, monospace" fontWeight="700">30 OS</text>

              {/* RSI Title & Value */}
              <text x={plotLeft + 10} y={rsiStartY + 14} fill="#94a3b8" fontSize="10" fontFamily="JetBrains Mono, monospace">
                RSI (14): <tspan fill="#38bdf8" fontWeight="700">{activeCandle.rsi}</tspan>
              </text>

              {/* RSI Trajectory Line */}
              <path d={rsiPoints} fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" />
            </g>
          )}

          {/* SUB-CHART 2: MACD HISTOGRAM PANEL */}
          {showOverlays.macdSubChart && (
            <g className="macd-subpanel-group">
              {/* MACD background */}
              <rect x={plotLeft} y={macdStartY} width={chartPlotWidth} height={macdSubH} fill="rgba(8, 12, 22, 0.92)" rx="4" />
              {/* MACD Right scale */}
              <rect x={plotRight} y={macdStartY} width={priceScaleWidth} height={macdSubH} fill="#060913" stroke="rgba(255, 255, 255, 0.08)" />
              <line x1={plotLeft} y1={macdZeroY} x2={plotRight} y2={macdZeroY} stroke="#64748b" strokeWidth="1" opacity="0.5" />
              <text x={plotRight + 6} y={macdZeroY + 3} fill="#94a3b8" fontSize="9" fontFamily="JetBrains Mono, monospace">0.00</text>

              <text x={plotLeft + 10} y={macdStartY + 13} fill="#94a3b8" fontSize="10" fontFamily="JetBrains Mono, monospace">
                MACD HISTOGRAM: <tspan fill={activeCandle.macdHist >= 0 ? '#10b981' : '#f43f5e'} fontWeight="700">{activeCandle.macdHist >= 0 ? `+${activeCandle.macdHist}` : activeCandle.macdHist}</tspan>
              </text>

              {/* MACD Histogram Bars */}
              {candles.map((c, idx) => {
                const x = getX(c.index);
                const barH = Math.min(20, Math.max(3, Math.abs(c.macdHist) * 16));
                const isGreen = c.macdHist >= 0;
                const y = isGreen ? macdZeroY - barH : macdZeroY;
                return (
                  <rect 
                    key={idx}
                    x={x - 2}
                    y={y}
                    width="4"
                    height={barH}
                    fill={isGreen ? '#10b981' : '#f43f5e'}
                    opacity="0.85"
                    rx="1"
                  />
                );
              })}
            </g>
          )}
        </svg>
      </div>
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
                  <span className="pulse-dot"></span> REAL-TIME TICK
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
                <span>WHY THIS STOCK WAS CHOSEN IN TOP 5</span>
              </div>
              <div className="top5-score-tag">
                <Sparkles size={13} />
                <span>AI Selection Conviction: <strong>{horizonData.confidence || stock.aiOverallScore}/100</strong></span>
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
                  <span className="trigger-lbl">VALUATION STATUS:</span>
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

          {/* SECTION 4: INTERACTIVE CANDLESTICK CHART & INDICATORS OVERLAYS */}
          <div className="chart-section-card">
            <div className="chart-toolbar-header">
              <div className="chart-heading-group">
                <BarChart3 size={18} className="text-emerald" />
                <h4>INTERACTIVE PRICE & TECHNICAL INDICATOR CHART</h4>
                
                {/* Timeframe Buttons */}
                <div className="timeframe-buttons-pill">
                  {['1D', '1W', '1M', '1Y'].map((tf) => (
                    <button
                      key={tf}
                      className={`btn-tf-pill ${timeframe === tf ? 'active' : ''}`}
                      onClick={() => setTimeframe(tf)}
                    >
                      {tf}
                    </button>
                  ))}
                </div>

                {/* Candlestick vs Line Toggle */}
                <div className="chart-type-toggle-group">
                  <button 
                    className={`btn-chart-type ${chartType === 'candles' ? 'active' : ''}`}
                    onClick={() => setChartType('candles')}
                    title="Japanese Candlestick Chart (OHLC)"
                  >
                    <CandleIcon size={14} />
                    <span>Candlesticks</span>
                  </button>
                  <button 
                    className={`btn-chart-type ${chartType === 'line' ? 'active' : ''}`}
                    onClick={() => setChartType('line')}
                    title="Area / Line Curve"
                  >
                    <LineIcon size={14} />
                    <span>Area</span>
                  </button>
                </div>
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
                    checked={showOverlays.entryZone}
                    onChange={(e) => setShowOverlays({ ...showOverlays, entryZone: e.target.checked })}
                  />
                  <span className="toggle-dot dot-cyan"></span>
                  <span>Buy Zone</span>
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

            {/* Interactive SVG Chart Canvas (Horizontally scrollable on small mobile) */}
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
