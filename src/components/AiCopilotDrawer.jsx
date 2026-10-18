import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Bot, 
  Sparkles, 
  Zap, 
  Target, 
  ShieldAlert, 
  TrendingUp, 
  HelpCircle,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { STOCKS_DATA, AI_MARKET_REGIME } from '../data/stocksData';

export default function AiCopilotDrawer({ 
  isOpen, 
  onClose, 
  onSelectStock 
}) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: "👋 Welcome to TradeX AI Copilot! I am your real-time quantitative assistant. I can recommend the best Intraday scalps, Swing breakouts, or Long-Term compounders, compute exact Stop Losses and Targets, and explain when to enter any stock.",
      timestamp: "Just now"
    }
  ]);

  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const promptSuggestions = [
    "🔥 Best Intraday Scalp Right Now",
    "🎯 Stop Loss & Target for NVDA",
    "💎 Top Long-Term Compounder with Moat",
    "⚡ When to Buy TSLA Breakdown",
    "🛡️ How is Dynamic Stop Loss calculated?"
  ];

  const handleSendMessage = (textToSend) => {
    const query = textToSend || inputVal;
    if (!query.trim()) return;

    // Append user message
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    // AI Response generation logic
    setTimeout(() => {
      let aiReply = "";
      const lower = query.toLowerCase();

      if (lower.includes('intraday') || lower.includes('scalp')) {
        const topIntraday = STOCKS_DATA.find(s => s.ticker === 'NVDA') || STOCKS_DATA[0];
        aiReply = `⚡ **Top Intraday Pick:** **${topIntraday.ticker} ($${topIntraday.price.toFixed(2)})**\n\n` +
          `• **When to Buy (Entry):** $${topIntraday.intraday.entryZone.min.toFixed(2)} - $${topIntraday.intraday.entryZone.max.toFixed(2)}\n` +
          `• **Trigger Condition:** ${topIntraday.intraday.triggerCondition}\n` +
          `• **Stop Loss:** $${topIntraday.intraday.stopLoss.price.toFixed(2)} (${topIntraday.intraday.stopLoss.distancePercent}% - ${topIntraday.intraday.stopLoss.basis})\n` +
          `• **Target 1:** $${topIntraday.intraday.targets[0].price} (+${topIntraday.intraday.targets[0].profitPercent}%)\n` +
          `• **Target 2:** $${topIntraday.intraday.targets[1].price} (+${topIntraday.intraday.targets[1].profitPercent}%)\n` +
          `• **Risk/Reward:** ${topIntraday.intraday.targets[1].rr} with high momentum RVOL (${topIntraday.rvol}x).`;
      } 
      else if (lower.includes('nvda')) {
        const s = STOCKS_DATA.find(x => x.ticker === 'NVDA');
        aiReply = `🤖 **NVIDIA (${s.ticker}) Strategic Blueprint:**\n\n` +
          `• **Intraday Entry:** $${s.intraday.entryZone.min} - $${s.intraday.entryZone.max} | SL: $${s.intraday.stopLoss.price} | Target: $${s.intraday.targets[1].price}\n` +
          `• **Swing (2-15 Days):** Entry $${s.shortTerm.entryZone.optimal} on 20 EMA bounce | SL: $${s.shortTerm.stopLoss.price} | Target 1: $${s.shortTerm.targets[0].price} | Target 2: $${s.shortTerm.targets[1].price}\n` +
          `• **Long-Term Fair Value:** $${s.longTerm.intrinsicValue} (${s.longTerm.valuationStatus})\n` +
          `• **Technical Verdict:** ${s.technicals.movingAverages.verdict}`;
      }
      else if (lower.includes('tsla')) {
        const s = STOCKS_DATA.find(x => x.ticker === 'TSLA');
        aiReply = `⚡ **Tesla (${s.ticker}) Tactical Overview:**\n\n` +
          `• **Current Price:** $${s.price.toFixed(2)} (+${s.changePercent}%)\n` +
          `• **When to Buy:** Enter between $${s.intraday.entryZone.min} and $${s.intraday.entryZone.max} on 15m candle close above $240 VWAP.\n` +
          `• **Stop Loss:** Strict structural stop at $${s.intraday.stopLoss.price} (-2.18%).\n` +
          `• **Targets:** T1: $${s.intraday.targets[0].price} | T2: $${s.intraday.targets[1].price} | T3: $${s.intraday.targets[2].price}.\n` +
          `• **Catalyst:** Institutional call option flow surge at $245 strike.`;
      }
      else if (lower.includes('long-term') || lower.includes('compounder') || lower.includes('moat')) {
        const topCompounder = STOCKS_DATA.find(s => s.ticker === 'MSFT') || STOCKS_DATA[3];
        aiReply = `💎 **Premier Long-Term Wealth Compounder:** **${topCompounder.ticker}**\n\n` +
          `• **Moat:** ${topCompounder.longTerm.moatRating}\n` +
          `• **DCF Intrinsic Fair Value:** $${topCompounder.longTerm.intrinsicValue} (${topCompounder.longTerm.valuationStatus})\n` +
          `• **ROE / Free Cash Flow:** ${topCompounder.longTerm.roe} ROE / ${topCompounder.fundamentals.freeCashFlowTTM} FCF\n` +
          `• **1-Year Target:** $${topCompounder.longTerm.target1Yr} | **3-Year Target:** $${topCompounder.longTerm.target3Yr}\n` +
          `• **Thesis:** ${topCompounder.longTerm.thesis}`;
      }
      else if (lower.includes('stop loss') || lower.includes('calculate')) {
        aiReply = `🛡️ **How TradeX AI Calculates Dynamic Stop Losses:**\n\n` +
          `1. **Intraday:** Uses 0.8 to 1.2 x ATR(14) below the session VWAP and opening range low to prevent getting chopped out by noise.\n` +
          `2. **Short-Term (Swing):** Anchors below structural swing pivot lows and the rising 20/50 EMA, maintaining at least a 1:2.5 Risk/Reward ratio.\n` +
          `3. **Long-Term:** Utilizes intrinsic fundamental margin of safety and multi-month 200 SMA support.\n\n` +
          `💡 Use the **Position Size Calculator** in any stock view to automatically adjust share quantities to never risk more than 1-2% of your account!`;
      }
      else {
        aiReply = `📊 **AI Market Analysis for "${query}":**\n\n` +
          `Current Market Regime: **${AI_MARKET_REGIME.regime}** (Sentiment: ${AI_MARKET_REGIME.sentimentScore}/100).\n` +
          `• Today's Best Horizon: **Short-Term Swing & VWAP Breakouts**.\n` +
          `• Top High-Conviction Picks: **NVDA**, **PLTR**, **TSLA**, and **META**.\n` +
          `• Click any stock card to view live entry zones, stop losses, and target profit tiers.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: aiReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsTyping(false);
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <div className="copilot-drawer-overlay" onClick={onClose}>
      <div className="copilot-drawer" onClick={(e) => e.stopPropagation()}>
        
        {/* Drawer Header */}
        <div className="copilot-header">
          <div className="copilot-title-group">
            <div className="copilot-icon-wrap">
              <Bot size={18} className="bot-pulse" />
            </div>
            <div>
              <div className="copilot-title">TradeX AI Copilot</div>
              <div className="copilot-status">Neural Trading Intelligence Active</div>
            </div>
          </div>
          <button className="copilot-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Preset Prompt Suggestions */}
        <div className="copilot-suggestions">
          <span className="suggestions-label">Quick Prompts:</span>
          <div className="suggestion-chips">
            {promptSuggestions.map((sug, i) => (
              <button 
                key={i} 
                className="sug-chip"
                onClick={() => handleSendMessage(sug)}
              >
                {sug}
              </button>
            ))}
          </div>
        </div>

        {/* Message Log */}
        <div className="copilot-messages-log">
          {messages.map((m) => (
            <div key={m.id} className={`chat-message ${m.sender}`}>
              <div className="message-bubble">
                <div className="message-content">
                  {m.text.split('\n').map((line, idx) => (
                    <p key={idx} className={line.startsWith('•') ? 'chat-bullet' : ''}>
                      {line}
                    </p>
                  ))}
                </div>
                <div className="message-meta">{m.timestamp}</div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="chat-message ai">
              <div className="message-bubble typing-bubble">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="copilot-input-bar">
          <input 
            type="text" 
            placeholder="Ask about any stock, stop loss, target, or intraday setup..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="copilot-text-input"
          />
          <button 
            className="copilot-send-btn"
            onClick={() => handleSendMessage()}
            disabled={!inputVal.trim()}
          >
            <Send size={16} />
          </button>
        </div>

      </div>
    </div>
  );
}
