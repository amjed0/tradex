import React from 'react';
import { 
  X, 
  Wallet, 
  RotateCcw,
  Sparkles
} from 'lucide-react';

export default function PaperPortfolioModal({ 
  isOpen, 
  onClose, 
  portfolio, 
  onClosePosition, 
  onResetPortfolio,
  currencySymbol = '$'
}) {
  if (!isOpen) return null;

  const { capital, positions, closedTrades } = portfolio;

  // Calculate live values
  const totalInvested = positions.reduce((acc, pos) => acc + (pos.shares * pos.entryPrice), 0);
  const currentPositionsValue = positions.reduce((acc, pos) => acc + (pos.shares * pos.entryPrice), 0);
  const totalAccountValue = capital + currentPositionsValue;
  const totalRealizedPnl = closedTrades.reduce((acc, t) => acc + t.pnlDollars, 0);

  const winningTrades = closedTrades.filter(t => t.pnlDollars > 0).length;
  const winRate = closedTrades.length > 0 ? ((winningTrades / closedTrades.length) * 100).toFixed(1) : 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="portfolio-modal-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="portfolio-header">
          <div className="portfolio-title-group">
            <div className="portfolio-icon-wrap">
              <Wallet size={20} />
            </div>
            <div>
              <div className="portfolio-modal-title">Paper Trading Brokerage Account Simulator</div>
              <div className="portfolio-modal-sub">Real-time virtual execution without financial risk</div>
            </div>
          </div>

          <div className="portfolio-header-actions">
            <button className="btn-reset-portfolio" onClick={onResetPortfolio} title={`Reset to ${currencySymbol}${currencySymbol === '₹' ? '5,00,000' : '50,000'} cash`}>
              <RotateCcw size={14} />
              <span>Reset Capital</span>
            </button>
            <button className="modal-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Portfolio Stats Strip */}
        <div className="portfolio-summary-strip">
          <div className="summary-stat-box">
            <span className="summary-label">TOTAL ACCOUNT VALUE</span>
            <span className="summary-value font-mono">{currencySymbol}{totalAccountValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          <div className="summary-stat-box">
            <span className="summary-label">AVAILABLE CASH</span>
            <span className="summary-value font-mono">{currencySymbol}{capital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          <div className="summary-stat-box">
            <span className="summary-label">CAPITAL INVESTED</span>
            <span className="summary-value font-mono">{currencySymbol}{totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          <div className="summary-stat-box">
            <span className="summary-label">REALIZED P&L</span>
            <span className={`summary-value font-mono ${totalRealizedPnl >= 0 ? 'text-emerald' : 'text-crimson'}`}>
              {totalRealizedPnl >= 0 ? '+' : ''}{currencySymbol}{totalRealizedPnl.toFixed(2)}
            </span>
          </div>

          <div className="summary-stat-box">
            <span className="summary-label">WIN RATE</span>
            <span className="summary-value font-mono text-emerald">
              {winRate}% ({winningTrades}/{closedTrades.length})
            </span>
          </div>
        </div>

        {/* Positions Section */}
        <div className="portfolio-body-scroll">
          <div className="positions-section">
            <div className="section-title-row">
              <h4>ACTIVE POSITIONS ({positions.length})</h4>
              <span className="section-sub">Live monitoring with automated stop loss and profit targets</span>
            </div>

            {positions.length === 0 ? (
              <div className="no-positions-box">
                <Sparkles size={24} className="sparkle-gold" />
                <p>No active positions. Click <strong>"Execute Paper Trade Preset"</strong> on any stock to open a position.</p>
              </div>
            ) : (
              <div className="positions-table-wrap">
                <table className="positions-table">
                  <thead>
                    <tr>
                      <th>TICKER & STRATEGY</th>
                      <th>SHARES</th>
                      <th>ENTRY PRICE</th>
                      <th>STOP LOSS</th>
                      <th>TARGET 1</th>
                      <th>TARGET 2</th>
                      <th>INVESTED</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((pos) => (
                      <tr key={pos.id}>
                        <td>
                          <div className="pos-ticker-cell">
                            <span className="pos-ticker">{pos.ticker}</span>
                            <span className={`horizon-tag-mini tag-${pos.horizon}`}>
                              {pos.horizon.toUpperCase()}
                            </span>
                          </div>
                          <span className="pos-time">{pos.timestamp}</span>
                        </td>
                        <td>
                          <span className="font-mono font-bold">{pos.shares}</span>
                        </td>
                        <td>
                          <span className="font-mono">{currencySymbol}{pos.entryPrice.toFixed(2)}</span>
                        </td>
                        <td>
                          <span className="font-mono text-crimson">{currencySymbol}{pos.stopLoss.toFixed(2)}</span>
                        </td>
                        <td>
                          <span className="font-mono text-emerald">{currencySymbol}{pos.target1.toFixed(2)}</span>
                        </td>
                        <td>
                          <span className="font-mono text-emerald">{currencySymbol}{pos.target2.toFixed(2)}</span>
                        </td>
                        <td>
                          <span className="font-mono">{currencySymbol}{pos.totalCapital.toFixed(2)}</span>
                        </td>
                        <td>
                          <button 
                            className="btn-close-pos"
                            onClick={() => onClosePosition(pos.id, 1.02)}
                          >
                            Close Position
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Closed Trades History */}
          {closedTrades.length > 0 && (
            <div className="closed-trades-section">
              <h4>CLOSED TRADE HISTORY ({closedTrades.length})</h4>
              <div className="closed-trades-list">
                {closedTrades.map((trade) => (
                  <div key={trade.id} className="closed-trade-item">
                    <div className="closed-left">
                      <span className="trade-ticker">{trade.ticker}</span>
                      <span className="trade-horizon">({trade.horizon})</span>
                      <span className="trade-shares">{trade.shares} shares @ {currencySymbol}{trade.entryPrice.toFixed(2)}</span>
                    </div>
                    <div className="closed-right">
                      <span className="exit-price">Closed @ {currencySymbol}{trade.exitPrice.toFixed(2)}</span>
                      <span className={`pnl-badge ${trade.pnlDollars >= 0 ? 'positive' : 'negative'}`}>
                        {trade.pnlDollars >= 0 ? '+' : ''}{currencySymbol}{trade.pnlDollars.toFixed(2)} ({trade.pnlPercent}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
