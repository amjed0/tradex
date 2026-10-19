import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  ShieldAlert, 
  Activity, 
  ArrowRight, 
  Star,
  Award
} from 'lucide-react';
import { fetchLiveStockData } from '../services/stockService';

export default function CustomStockAnalyzer({ 
  isOpen, 
  onClose, 
  onOpenGeneratedStock,
  isIndianMarket = true,
  watchlist = [],
  onToggleWatchlist
}) {
  const [tickerInput, setTickerInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [activeTab, setActiveTab] = useState('intraday'); // 'intraday', 'shortTerm', 'longTerm'

  if (!isOpen) return null;

  const currencySymbol = isIndianMarket ? '₹' : '$';

  const quickIdeas = isIndianMarket ? [
    { label: "RELIANCE", sym: "RELIANCE.NS", name: "Reliance Ind." },
    { label: "TCS", sym: "TCS.NS", name: "Tata Consultancy" },
    { label: "INFY", sym: "INFY.NS", name: "Infosys" },
    { label: "HDFCBANK", sym: "HDFCBANK.NS", name: "HDFC Bank" },
    { label: "ICICIBANK", sym: "ICICIBANK.NS", name: "ICICI Bank" },
    { label: "SBIN", sym: "SBIN.NS", name: "State Bank of India" },
  ] : [
    { label: "NVDA", sym: "NVDA", name: "NVIDIA Corp" },
    { label: "TSLA", sym: "TSLA", name: "Tesla Inc" },
    { label: "AAPL", sym: "AAPL", name: "Apple Inc" },
    { label: "MSFT", sym: "MSFT", name: "Microsoft" },
    { label: "PLTR", sym: "PLTR", name: "Palantir" },
    { label: "AMD", sym: "AMD", name: "AMD Micro" },
  ];

  const handleAnalyze = async (symbolToTest) => {
    let raw = (symbolToTest || tickerInput).trim().toUpperCase();
    if (!raw) return;

    setErrorMsg('');
    setIsLoading(true);
    setAnalysisResult(null);

    // Format symbol for Yahoo Finance if Indian Market
    let querySymbol = raw;
    if (isIndianMarket && !raw.includes('.')) {
      querySymbol = `${raw}.NS`;
    }

    try {
      const data = await fetchLiveStockData(querySymbol);
      if (!data) {
        if (querySymbol.endsWith('.NS')) {
          const retryData = await fetchLiveStockData(raw);
          if (retryData) {
            setAnalysisResult(retryData);
            setIsLoading(false);
            return;
          }
        }
        throw new Error(`Could not find real market data for "${raw}". Check ticker symbol.`);
      }
      setAnalysisResult(data);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch live stock data.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentPlan = analysisResult ? analysisResult[activeTab] : null;
  const isSaved = analysisResult ? watchlist.includes(analysisResult.ticker) : false;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="custom-analyzer-modal wide-analyzer" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="analyzer-header">
          <div className="analyzer-title-group">
            <div className="analyzer-icon-badge">
              <Sparkles size={22} className="sparkle-gold" />
            </div>
            <div>
              <div className="analyzer-title">
                Real-Time Stock AI Quantitative Analyzer ⚡
              </div>
              <div className="analyzer-sub">
                Input any {isIndianMarket ? 'Indian (NSE / BSE)' : 'US / Foreign'} stock for live prices, When-to-Buy entry timing, Stop Loss, and Profit Targets.
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} id="btn-close-analyzer">
            <X size={18} />
          </button>
        </div>

        {/* Input & Search Strip */}
        <div className="analyzer-input-strip">
          <div className="analyzer-input-box">
            <Search size={18} className="search-icon-custom" />
            <input 
              id="input-custom-stock-ticker"
              type="text" 
              placeholder={isIndianMarket ? "Enter Indian stock ticker (e.g. RELIANCE, TCS, TATAMOTORS, ZOMATO)..." : "Enter US stock ticker (e.g. NVDA, TSLA, AAPL, MSFT)..."}
              value={tickerInput}
              onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              className="analyzer-text-input"
              autoFocus
            />
          </div>
          <button 
            id="btn-run-stock-ai"
            className="btn-run-custom-ai"
            onClick={() => handleAnalyze()}
            disabled={!tickerInput.trim() || isLoading}
          >
            {isLoading ? (
              <span className="btn-loading-flex">
                <span className="mini-spin"></span> Connecting to Live Market...
              </span>
            ) : (
              'Run Live AI Analysis'
            )}
          </button>
        </div>

        {/* Quick Ideas Chips */}
        <div className="popular-tickers-row">
          <span className="pop-label">Quick Scan:</span>
          {quickIdeas.map((s) => (
            <button 
              key={s.sym} 
              className="pop-chip"
              onClick={() => {
                setTickerInput(s.label);
                handleAnalyze(s.sym);
              }}
            >
              <strong>{s.label}</strong> ({s.name})
            </button>
          ))}
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="analyzer-error-banner">
            <ShieldAlert size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Loading state indicator */}
        {isLoading && (
          <div className="analyzer-scanning-state">
            <div className="scanner-pulsar"></div>
            <div className="scanner-text">Connecting to Live Exchange Feed...</div>
            <div className="scanner-subtext">Computing RSI, Moving Averages, Dynamic ATR Stop Loss, and Risk-Reward Targets</div>
          </div>
        )}

        {/* Analysis Result Display */}
        {analysisResult && !isLoading && (
          <div className="broker-stock-dossier">
            
            {/* Live Ticker Banner */}
            <div className="broker-live-banner">
              <div className="live-banner-left">
                <div className="broker-sym-group">
                  <span className="broker-ticker-name">{analysisResult.ticker}</span>
                  <span className="broker-exchange-tag">
                    {analysisResult.currency === 'INR' ? 'NSE 🇮🇳' : 'NASDAQ/NYSE 🇺🇸'}
                  </span>
                  <span className="broker-full-name">{analysisResult.name}</span>
                </div>
                <div className="broker-sector-label">{analysisResult.sector}</div>
              </div>

              <div className="live-banner-right">
                <div className="live-price-wrapper">
                  <span className="live-price-val">
                    {analysisResult.currencySymbol}{analysisResult.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className={`live-change-badge ${analysisResult.changePercent >= 0 ? 'bullish' : 'bearish'}`}>
                    {analysisResult.changePercent >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {analysisResult.changePercent >= 0 ? '+' : ''}{analysisResult.changePercent}%
                  </span>
                </div>
                <div className="live-range-text">
                  52W Range: {analysisResult.currencySymbol}{analysisResult.low52} - {analysisResult.currencySymbol}{analysisResult.high52}
                </div>
              </div>
            </div>

            {/* AI Recommendation & Horizon Switcher */}
            <div className="analyzer-horizon-tabs-bar">
              <div className="tabs-title-group">
                <span className="ai-rec-tag">
                  AI RECOMMENDATION: <strong>{analysisResult.aiRecommendation}</strong> ({analysisResult.aiOverallScore}/100)
                </span>
              </div>
              <div className="horizon-switch-pills">
                <button 
                  className={`h-pill ${activeTab === 'intraday' ? 'active' : ''}`}
                  onClick={() => setActiveTab('intraday')}
                >
                  ⚡ Intraday / Scalp
                </button>
                <button 
                  className={`h-pill ${activeTab === 'shortTerm' ? 'active' : ''}`}
                  onClick={() => setActiveTab('shortTerm')}
                >
                  🌊 Short-Term Swing
                </button>
                <button 
                  className={`h-pill ${activeTab === 'longTerm' ? 'active' : ''}`}
                  onClick={() => setActiveTab('longTerm')}
                >
                  💎 Long-Term Wealth
                </button>
              </div>
            </div>

            {/* Core 3 Pillars: When to Buy, Stop Loss, Targets */}
            {currentPlan && (
              <div className="three-pillars-grid">
                
                {/* 1. When to Buy */}
                <div className="pillar-box pillar-buy">
                  <div className="pillar-header">
                    <span className="pillar-dot dot-buy"></span>
                    <span className="pillar-title">1. WHEN TO ENTER (ENTRY TRIGGER)</span>
                  </div>
                  <div className="pillar-body">
                    <div className="pillar-main-val text-cyan font-mono">
                      {activeTab === 'longTerm' 
                        ? `DCF Fair Value: ${analysisResult.currencySymbol}${currentPlan.intrinsicValue}`
                        : `${analysisResult.currencySymbol}${currentPlan.entryZone.min} - ${analysisResult.currencySymbol}${currentPlan.entryZone.max}`
                      }
                    </div>
                    <div className="pillar-sub-label">
                      Setup: <strong>{currentPlan.setupName || 'Algorithmic Momentum Entry'}</strong>
                    </div>
                    <div className="pillar-condition-box">
                      <strong>Trigger Rule:</strong> {currentPlan.triggerCondition || currentPlan.thesis}
                    </div>
                    {currentPlan.signalBadge && (
                      <div className="pillar-badge-pill">{currentPlan.signalBadge}</div>
                    )}
                  </div>
                </div>

                {/* 2. Stop Loss */}
                <div className="pillar-box pillar-sl">
                  <div className="pillar-header">
                    <span className="pillar-dot dot-sl"></span>
                    <span className="pillar-title">2. STOP LOSS (RISK SHIELD)</span>
                  </div>
                  <div className="pillar-body">
                    <div className="pillar-main-val text-crimson font-mono">
                      {currentPlan.stopLoss 
                        ? `${analysisResult.currencySymbol}${currentPlan.stopLoss.price} (${currentPlan.stopLoss.distancePercent}%)`
                        : `${analysisResult.currencySymbol}${analysisResult.low52} (52W Support)`
                      }
                    </div>
                    <div className="pillar-sub-label">
                      Type: <strong>{currentPlan.stopLoss ? currentPlan.stopLoss.type : 'Long Term Moat Defense'}</strong>
                    </div>
                    <div className="pillar-condition-box">
                      <strong>Basis:</strong> {currentPlan.stopLoss ? currentPlan.stopLoss.basis : 'Conservative allocation sizing with multi-year horizon'}
                    </div>
                    <div className="pillar-risk-meter">
                      <span>Max Capital at Risk:</span>
                      <strong className="text-crimson font-mono">
                        {currentPlan.stopLoss ? `${Math.abs(currentPlan.stopLoss.distancePercent)}%` : 'Low Risk'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 3. Profit Targets */}
                <div className="pillar-box pillar-target">
                  <div className="pillar-header">
                    <span className="pillar-dot dot-target"></span>
                    <span className="pillar-title">3. PROFIT TARGETS & EXIT PLAN</span>
                  </div>
                  <div className="pillar-body">
                    {currentPlan.targets ? (
                      <div className="targets-tier-list">
                        {currentPlan.targets.map((tgt, idx) => (
                          <div key={idx} className="target-tier-row">
                            <span className="tgt-name">{tgt.label}:</span>
                            <span className="tgt-price text-emerald font-mono">
                              {analysisResult.currencySymbol}{tgt.price}
                            </span>
                            <span className="tgt-pct">(+{tgt.profitPercent}%)</span>
                            <span className="tgt-rr badge-rr">{tgt.rr}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="targets-tier-list">
                        <div className="target-tier-row">
                          <span className="tgt-name">1-Year Target:</span>
                          <span className="tgt-price text-emerald font-mono">
                            {analysisResult.currencySymbol}{currentPlan.target1Yr} (+25%)
                          </span>
                        </div>
                        <div className="target-tier-row">
                          <span className="tgt-name">3-Year Multibagger:</span>
                          <span className="tgt-price text-emerald font-mono">
                            {analysisResult.currencySymbol}{currentPlan.target3Yr} (+68%)
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="pillar-condition-box">
                      <strong>Exit Discipline:</strong> Lock 50% partials at Target 1, trail stop to breakeven, let runners reach Target 2 & 3.
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Technical Indicators Strip */}
            <div className="technicals-micro-strip">
              <div className="tech-chip">
                <span className="tech-chip-lbl">RSI (14):</span>
                <span className="tech-chip-val font-mono">{analysisResult.technicals.rsi.value}</span>
                <span className="tech-chip-status">({analysisResult.technicals.rsi.status})</span>
              </div>
              <div className="tech-chip">
                <span className="tech-chip-lbl">20 EMA:</span>
                <span className="tech-chip-val font-mono">{analysisResult.currencySymbol}{analysisResult.technicals.movingAverages.ema20}</span>
              </div>
              <div className="tech-chip">
                <span className="tech-chip-lbl">50 SMA:</span>
                <span className="tech-chip-val font-mono">{analysisResult.currencySymbol}{analysisResult.technicals.movingAverages.sma50}</span>
              </div>
              <div className="tech-chip">
                <span className="tech-chip-lbl">MACD:</span>
                <span className="tech-chip-val font-mono">{analysisResult.technicals.macd.histogram}</span>
                <span className="tech-chip-status">({analysisResult.technicals.macd.status})</span>
              </div>
              <div className="tech-chip">
                <span className="tech-chip-lbl">Pivot S1:</span>
                <span className="tech-chip-val font-mono">{analysisResult.currencySymbol}{analysisResult.technicals.supportLevels[0]}</span>
              </div>
              <div className="tech-chip">
                <span className="tech-chip-lbl">Pivot R1:</span>
                <span className="tech-chip-val font-mono">{analysisResult.currencySymbol}{analysisResult.technicals.resistanceLevels[0]}</span>
              </div>
            </div>

            {/* Action Bar (Watchlist & Full Terminal Report) */}
            <div className="broker-ticket-bar">
              <button 
                className={`btn-custom-watchlist-toggle ${isSaved ? 'active' : ''}`}
                onClick={() => {
                  if (onToggleWatchlist) onToggleWatchlist(analysisResult.ticker);
                }}
              >
                <Star size={16} fill={isSaved ? "#f59e0b" : "none"} />
                <span>{isSaved ? 'Saved in Personal Watchlist' : 'Add to My Watchlist'}</span>
              </button>

              <button 
                id="btn-open-terminal-full"
                className="btn-launch-terminal"
                onClick={() => {
                  onClose();
                  onOpenGeneratedStock(analysisResult);
                }}
              >
                <span>Open Complete Indicator Chart & Reports</span>
                <ArrowRight size={16} />
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
